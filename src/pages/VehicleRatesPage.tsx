import React, { useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

type CellState = 'idle' | 'saving' | 'saved' | 'error';

interface CellStatus {
  state: CellState;
  timeout?: ReturnType<typeof setTimeout>;
}

const VehicleRatesPage: React.FC = () => {
  const { state, upsertVehicleRate, getVehicleRateForMonth, getPerson } = useAppContext();
  const { showToast } = useToast();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [cellStatuses, setCellStatuses] = useState<Record<string, CellStatus>>({});
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const vehicles = [...state.vehicles].sort((a, b) => {
    const pa = getPerson(a.personId);
    const pb = getPerson(b.personId);
    const nameA = pa ? `${pa.surname} ${pa.name}` : '';
    const nameB = pb ? `${pb.surname} ${pb.name}` : '';
    return nameA.localeCompare(nameB, 'it');
  });

  const cellKey = (vehicleId: string, month: number) => `${vehicleId}-${selectedYear}-${month}`;

  const getCellValue = (vehicleId: string, month: number): string => {
    const key = cellKey(vehicleId, month);
    if (localValues[key] !== undefined) return localValues[key];
    const entry = state.vehicleRateHistory.find(
      r => r.vehicleId === vehicleId && r.year === selectedYear && r.month === month
    );
    if (entry) return entry.rate.toFixed(4).replace(/\.?0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1') || String(entry.rate);
    return '';
  };

  const setCellStatus = useCallback((key: string, cellState: CellState) => {
    setCellStatuses(prev => {
      const old = prev[key];
      if (old?.timeout) clearTimeout(old.timeout);
      let timeout: ReturnType<typeof setTimeout> | undefined;
      if (cellState === 'saved') {
        timeout = setTimeout(() => {
          setCellStatuses(p => {
            const next = { ...p };
            delete next[key];
            return next;
          });
        }, 2000);
      }
      return { ...prev, [key]: { state: cellState, timeout } };
    });
  }, []);

  const saveCell = useCallback(async (vehicleId: string, month: number, value: string) => {
    const key = cellKey(vehicleId, month);
    const trimmed = value.trim();
    if (trimmed === '') return;

    const rate = parseFloat(trimmed.replace(',', '.'));
    if (isNaN(rate) || rate < 0) {
      setCellStatus(key, 'error');
      return;
    }

    const existing = state.vehicleRateHistory.find(
      r => r.vehicleId === vehicleId && r.year === selectedYear && r.month === month
    );
    if (existing && existing.rate === rate) return;

    setCellStatus(key, 'saving');
    try {
      await upsertVehicleRate(vehicleId, selectedYear, month, rate);
      setCellStatus(key, 'saved');
      setLocalValues(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch {
      setCellStatus(key, 'error');
    }
  }, [state.vehicleRateHistory, selectedYear, upsertVehicleRate, setCellStatus]);

  const handleChange = (vehicleId: string, month: number, value: string) => {
    const key = cellKey(vehicleId, month);
    setLocalValues(prev => ({ ...prev, [key]: value }));

    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => {
      saveCell(vehicleId, month, value);
    }, 800);
  };

  const handleBlur = (vehicleId: string, month: number) => {
    const key = cellKey(vehicleId, month);
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
      delete debounceTimers.current[key];
    }
    const value = localValues[key];
    if (value !== undefined) {
      saveCell(vehicleId, month, value);
    }
  };

  const handleCopyFromPreviousYear = async () => {
    const prevYear = selectedYear - 1;
    const prevYearEntries = state.vehicleRateHistory.filter(r => r.year === prevYear);
    if (prevYearEntries.length === 0) {
      showToast(`Nessuna tariffa trovata per il ${prevYear}`, 'error');
      return;
    }

    let copied = 0;
    for (const entry of prevYearEntries) {
      const alreadyExists = state.vehicleRateHistory.find(
        r => r.vehicleId === entry.vehicleId && r.year === selectedYear && r.month === entry.month
      );
      if (!alreadyExists) {
        try {
          await upsertVehicleRate(entry.vehicleId, selectedYear, entry.month, entry.rate);
          copied++;
        } catch {
          // continue
        }
      }
    }

    if (copied > 0) {
      showToast(`Copiate ${copied} tariffe dal ${prevYear}`, 'success');
    } else {
      showToast(`Tutte le tariffe del ${selectedYear} sono già presenti`, 'info' as 'success');
    }
  };

  const getCellBorderClass = (vehicleId: string, month: number): string => {
    const key = cellKey(vehicleId, month);
    const status = cellStatuses[key];
    if (!status) return 'border-gray-200 focus:border-teal-400 focus:ring-teal-200';
    if (status.state === 'saving') return 'border-amber-300 focus:border-amber-400 focus:ring-amber-200';
    if (status.state === 'saved') return 'border-green-400 focus:border-green-400 focus:ring-green-200 bg-green-50';
    if (status.state === 'error') return 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50';
    return 'border-gray-200 focus:border-teal-400 focus:ring-teal-200';
  };

  const isMonthCurrent = (month: number) =>
    selectedYear === currentYear && month === new Date().getMonth();

  const getEffectiveRate = (vehicleId: string, month: number): string => {
    const entry = state.vehicleRateHistory.find(
      r => r.vehicleId === vehicleId && r.year === selectedYear && r.month === month
    );
    if (entry) return '';
    const fallback = getVehicleRateForMonth(vehicleId, selectedYear, month);
    if (fallback > 0) return `(${fallback.toFixed(4).replace(/\.?0+$/, '')})`;
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tariffe €/km</h1>
          <p className="text-sm text-gray-500 mt-1">
            Inserisci la tariffa mensile per ogni veicolo. I valori in grigio indicano la tariffa di fallback applicata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyFromPreviousYear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Copy size={16} />
            Copia da {selectedYear - 1}
          </button>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-semibold text-gray-900 min-w-[4rem] text-center">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors text-gray-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Nessun veicolo registrato. Aggiungi veicoli dalla sezione Persone.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[200px] sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                    Veicolo
                  </th>
                  {MONTHS.map((m, i) => (
                    <th
                      key={i}
                      className={`px-2 py-3 font-semibold text-center min-w-[80px] ${
                        isMonthCurrent(i) ? 'text-teal-700 bg-teal-50' : 'text-gray-700'
                      }`}
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map(vehicle => {
                  const person = getPerson(vehicle.personId);
                  const personName = person ? `${person.surname} ${person.name}` : 'N/D';
                  return (
                    <tr key={vehicle.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-white hover:bg-gray-50/50 z-10 border-r border-gray-200">
                        <div className="font-medium text-gray-900 truncate max-w-[180px]">{personName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">
                          {vehicle.make} {vehicle.model} &middot; {vehicle.plate}
                        </div>
                      </td>
                      {MONTHS.map((_, monthIdx) => {
                        const key = cellKey(vehicle.id, monthIdx);
                        const cellValue = getCellValue(vehicle.id, monthIdx);
                        const fallbackLabel = getEffectiveRate(vehicle.id, monthIdx);
                        const status = cellStatuses[key];
                        return (
                          <td
                            key={monthIdx}
                            className={`px-2 py-2 text-center ${isMonthCurrent(monthIdx) ? 'bg-teal-50/40' : ''}`}
                          >
                            <div className="relative">
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={cellValue}
                                onChange={e => handleChange(vehicle.id, monthIdx, e.target.value)}
                                onBlur={() => handleBlur(vehicle.id, monthIdx)}
                                placeholder={fallbackLabel}
                                className={`w-full text-center text-xs font-mono px-1 py-1.5 rounded border transition-all focus:outline-none focus:ring-1 ${getCellBorderClass(vehicle.id, monthIdx)}`}
                              />
                              {status?.state === 'saving' && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded border border-green-400 bg-green-50" />
              Tariffa salvata
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded border border-amber-300" />
              Salvataggio in corso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded border border-red-400 bg-red-50" />
              Errore
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gray-400 italic">(0.xxxx)</span>
              Valore di fallback (non impostato per questo mese)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleRatesPage;
