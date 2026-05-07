import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import { useAppContext } from '../context/AppContext';
import { Vehicle } from '../types';
import { CAR_BRANDS } from '../utils/carBrands';

interface FormData {
  personId: string;
  make: string;
  customBrand: string;
  model: string;
  plate: string;
}

interface FormErrors {
  personId?: string;
  make?: string;
  customBrand?: string;
  model?: string;
  plate?: string;
}

const VehicleForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addVehicle, updateVehicle, getPerson } = useAppContext();

  const isEditing = !!id;
  const vehicle = isEditing ? state.vehicles.find((v) => v.id === id) : null;

  const [formData, setFormData] = useState<FormData>({
    personId: '',
    make: '',
    customBrand: '',
    model: '',
    plate: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (vehicle) {
      const isStandardBrand = CAR_BRANDS.includes(vehicle.make as any);
      setFormData({
        personId: vehicle.personId,
        make: isStandardBrand ? vehicle.make : 'Altra',
        customBrand: isStandardBrand ? '' : vehicle.make,
        model: vehicle.model,
        plate: vehicle.plate,
      });
    }
  }, [vehicle]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.personId) {
      newErrors.personId = 'Il proprietario è obbligatorio';
    }

    if (!formData.make.trim()) {
      newErrors.make = 'La marca è obbligatoria';
    }

    if (formData.make === 'Altra' && !formData.customBrand.trim()) {
      newErrors.customBrand = 'Specificare la marca personalizzata';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Il modello è obbligatorio';
    }

    if (!formData.plate.trim()) {
      newErrors.plate = 'La targa è obbligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const finalMake = formData.make === 'Altra' ? formData.customBrand : formData.make;

    const vehicleData = {
      personId: formData.personId,
      make: finalMake,
      model: formData.model,
      plate: formData.plate,
      reimbursementRate: vehicle?.reimbursementRate ?? 0,
    };

    if (isEditing && vehicle) {
      updateVehicle({
        id: vehicle.id,
        ...vehicleData,
      });
    } else {
      addVehicle(vehicleData);
    }

    navigate('/veicoli');
  };

  // Prepare people options for select
  const peopleOptions = [...state.people]
    .sort((a, b) => a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name))
    .map((person) => ({
      value: person.id,
      label: `${person.surname} ${person.name} (${person.role})`,
    }));

  // Prepare car brands options for select
  const carBrandsOptions = CAR_BRANDS.map((brand) => ({
    value: brand,
    label: brand,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/veicoli')}
        >
          Torna all'elenco
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Modifica Veicolo' : 'Aggiungi Veicolo'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            id="personId"
            name="personId"
            label="Proprietario"
            options={peopleOptions}
            value={formData.personId}
            onChange={handleChange}
            error={errors.personId}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="make"
              name="make"
              label="Marca"
              options={carBrandsOptions}
              value={formData.make}
              onChange={handleChange}
              error={errors.make}
              required
            />

            <Input
              id="model"
              name="model"
              label="Modello"
              value={formData.model}
              onChange={handleChange}
              error={errors.model}
              required
            />
          </div>

          {formData.make === 'Altra' && (
            <Input
              id="customBrand"
              name="customBrand"
              label="Specifica Marca"
              value={formData.customBrand}
              onChange={handleChange}
              error={errors.customBrand}
              placeholder="Inserisci il nome della marca"
              required
            />
          )}

          <Input
            id="plate"
            name="plate"
            label="Targa"
            value={formData.plate}
            onChange={handleChange}
            error={errors.plate}
            required
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={18} />}
            >
              {isEditing ? 'Salva Modifiche' : 'Aggiungi Veicolo'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default VehicleForm;