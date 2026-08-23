// APORTE: MATIAS COLLAGUAZO
import React, { useState, useId } from 'react';
import type { Pet } from '../../types/pet';
import type { AdoptionInput } from '../../types/adoption';
import { Modal } from '../common/Modal';

interface AdoptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet | null;
  onSubmit: (data: AdoptionInput) => Promise<void>;
}

export const AdoptionModal: React.FC<AdoptionModalProps> = ({ isOpen, onClose, pet, onSubmit }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const nameId = useId();
  const emailId = useId();

  if (!isOpen || !pet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    const cleanCorreo = correo.trim();

    if (!cleanNombre || !cleanCorreo) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanCorreo)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        mascota_id: pet.id,
        nombre_solicitante: cleanNombre,
        correo_contacto: cleanCorreo,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNombre('');
        setCorreo('');
        onClose();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al registrar la postulación.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Solicitud de Adopción: ${pet.nombre}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200">
            ¡Solicitud enviada exitosamente! El refugio revisará tu postulación.
          </div>
        )}

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
              {pet.foto_url ? (
                <img
                  src={pet.foto_url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <span className="text-2xl select-none absolute inset-0 flex items-center justify-center -z-0">
                {pet.especie.toLowerCase() === 'gato' ? '🐱' : '🐶'}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{pet.nombre}</p>
              <p className="text-xs text-slate-500 font-medium">{pet.especie} · {pet.raza}</p>
            </div>
          </div>
          <span className="font-mono text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 font-semibold">
            ID #{pet.id}
          </span>
        </div>

        <div>
          <label htmlFor={nameId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Nombre Completo del Solicitante *
          </label>
          <input
            id={nameId}
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Carlos Mendoza"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div>
          <label htmlFor={emailId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Correo Electrónico de Contacto *
          </label>
          <input
            id={emailId}
            type="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="Ej: cmendoza@ejemplo.com"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
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
            disabled={isSubmitting || success}
            className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
