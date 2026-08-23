// APORTE: ARIANNA FEIJOO
import React, { useState, useId } from 'react';
import type { Pet, PetInput, AdoptionStatus } from '../../types/pet';
import { Modal } from '../common/Modal';

interface PetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PetInput) => Promise<void>;
  petToEdit?: Pet | null;
}

export const PetModal: React.FC<PetModalProps> = ({ isOpen, onClose, onSubmit, petToEdit }) => {
  const [nombre, setNombre] = useState(petToEdit?.nombre ?? '');
  const [especie, setEspecie] = useState(petToEdit?.especie ?? 'Perro');
  const [raza, setRaza] = useState(petToEdit?.raza ?? '');
  const [estadoSalud, setEstadoSalud] = useState(petToEdit?.estado_salud ?? 'Vacunado y desparasitado');
  const [estadoAdopcion, setEstadoAdopcion] = useState<AdoptionStatus>(petToEdit?.estado_adopcion ?? 'disponible');
  const [fotoUrl, setFotoUrl] = useState(petToEdit?.foto_url ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const nameId = useId();
  const speciesId = useId();
  const breedId = useId();
  const healthId = useId();
  const statusId = useId();
  const photoId = useId();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    const cleanEspecie = especie.trim();

    if (!cleanNombre || !cleanEspecie) {
      setError('El nombre y la especie son requeridos.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        nombre: cleanNombre,
        especie: cleanEspecie,
        raza: raza.trim() || 'Mestizo',
        estado_salud: estadoSalud.trim() || 'No evaluado',
        estado_adopcion: estadoAdopcion,
        foto_url: fotoUrl.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al guardar el expediente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={petToEdit ? 'Editar Expediente de Mascota' : 'Registrar Nueva Mascota'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label htmlFor={nameId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Nombre de la Mascota *
          </label>
          <input
            id={nameId}
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Max, Luna"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={speciesId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Especie *
            </label>
            <select
              id={speciesId}
              value={especie}
              onChange={(e) => setEspecie(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="Perro">Perro</option>
              <option value="Gato">Gato</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor={breedId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Raza
            </label>
            <input
              id={breedId}
              type="text"
              value={raza}
              onChange={(e) => setRaza(e.target.value)}
              placeholder="Ej: Mestizo, Siamés"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor={healthId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Estado de Salud / Historial
          </label>
          <input
            id={healthId}
            type="text"
            value={estadoSalud}
            onChange={(e) => setEstadoSalud(e.target.value)}
            placeholder="Ej: Vacunado, esterilizado, en tratamiento"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={statusId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Estado de Adopción
            </label>
            <select
              id={statusId}
              value={estadoAdopcion}
              onChange={(e) => setEstadoAdopcion(e.target.value as AdoptionStatus)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="disponible">Disponible</option>
              <option value="en proceso">En Proceso</option>
              <option value="adoptado">Adoptado</option>
            </select>
          </div>

          <div>
            <label htmlFor={photoId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              URL de Fotografía
            </label>
            <input
              id={photoId}
              type="url"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : petToEdit ? 'Guardar Cambios' : 'Crear Expediente'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
