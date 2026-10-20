import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: caller, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !caller?.user) return json({ error: "Non autorizzato" }, 401);

    const { data: callerProfile } = await admin
      .from("user_profiles")
      .select("is_admin")
      .eq("id", caller.user.id)
      .maybeSingle();
    if (!callerProfile?.is_admin) return json({ error: "Non autorizzato" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    const validPersonId = async (personId: unknown) => {
      if (personId === null) return true;
      if (typeof personId !== "string" || !UUID_RE.test(personId)) return false;
      const { data } = await admin.from("people").select("id").eq("id", personId).maybeSingle();
      return !!data;
    };

    const personTaken = async (personId: string | null, exceptUserId?: string) => {
      if (!personId) return false;
      let q = admin.from("user_profiles").select("id").eq("person_id", personId);
      if (exceptUserId) q = q.neq("id", exceptUserId);
      const { data } = await q;
      return (data || []).length > 0;
    };

    if (action === "list") {
      const { data: usersData, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      const { data: profiles, error: profError } = await admin
        .from("user_profiles")
        .select("id, person_id, is_admin, created_at");
      if (profError) throw profError;
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const users = usersData.users.map((u) => {
        const p = profileMap.get(u.id);
        return {
          id: u.id,
          email: u.email || "",
          personId: p?.person_id ?? null,
          isAdmin: p?.is_admin ?? false,
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at ?? null,
        };
      });
      return json({ users });
    }

    if (action === "create") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const personId = body.personId ?? null;
      const isAdmin = body.isAdmin === true;

      if (!EMAIL_RE.test(email)) return json({ error: "Email non valida" }, 400);
      if (password.length < 8) return json({ error: "La password deve avere almeno 8 caratteri" }, 400);
      if (!(await validPersonId(personId))) return json({ error: "Persona non valida" }, 400);
      if (!isAdmin && !personId) return json({ error: "Collega l'account a una persona" }, 400);
      if (await personTaken(personId)) return json({ error: "Questa persona ha già un account" }, 409);

      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !created?.user) {
        console.error("createUser failed", error);
        return json({ error: "Impossibile creare l'account. L'email potrebbe essere già in uso." }, 400);
      }

      const { error: upsertError } = await admin
        .from("user_profiles")
        .upsert({ id: created.user.id, person_id: personId, is_admin: isAdmin });
      if (upsertError) {
        console.error("profile upsert failed", upsertError);
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: "Impossibile creare l'account" }, 500);
      }
      return json({ ok: true });
    }

    if (action === "update") {
      const userId = body.userId;
      const personId = body.personId ?? null;
      const isAdmin = body.isAdmin === true;

      if (typeof userId !== "string" || !UUID_RE.test(userId)) return json({ error: "Account non valido" }, 400);
      if (userId === caller.user.id && !isAdmin) {
        return json({ error: "Non puoi rimuovere i tuoi permessi di amministratore" }, 400);
      }
      if (!(await validPersonId(personId))) return json({ error: "Persona non valida" }, 400);
      if (await personTaken(personId, userId)) return json({ error: "Questa persona ha già un account" }, 409);

      const { error } = await admin
        .from("user_profiles")
        .update({ person_id: personId, is_admin: isAdmin })
        .eq("id", userId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete") {
      const userId = body.userId;
      if (typeof userId !== "string" || !UUID_RE.test(userId)) return json({ error: "Account non valido" }, 400);
      if (userId === caller.user.id) return json({ error: "Non puoi eliminare il tuo account" }, 400);

      for (const table of ["people", "vehicles", "trips", "saved_routes"]) {
        await admin.from(table).update({ created_by: null }).eq("created_by", userId);
        await admin.from(table).update({ modified_by: null }).eq("modified_by", userId);
      }
      await admin.from("user_profiles").delete().eq("id", userId);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Azione non valida" }, 400);
  } catch (err) {
    console.error("manage-users error", err);
    return json({ error: "Si è verificato un errore. Riprova." }, 500);
  }
});
