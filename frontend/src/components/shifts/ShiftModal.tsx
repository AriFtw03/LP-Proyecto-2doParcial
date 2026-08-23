// APORTE: DIEGO ALFONZO
import React, { useState, useId } from 'react';
import type { Shift, ShiftInput } from '../../types/shift';
import { Modal } from '../common/Modal';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftInput) => Promise<void>;
  shiftToEdit?: Shift | null;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, onSubmit, shiftToEdit }) => {
  const today = new Date().toISOString().split('T')[0];
  const [nombreVoluntario, setNombreVoluntario] = useState(shiftToEdit?.nombre_voluntario ?? '');
  const [tareaAsignada, setTareaAsignada] = useState(shiftToEdit?.tarea_asignada ?? 'Alimentación y limpieza de caniles');
  const [fechaTurno, setFechaTurno] = useState(shiftToEdit?.fecha_turno ?? today);
  const [horaInicio, setHoraInicio] = useState(shiftToEdit ? shiftToEdit.hora_inicio.slice(0, 5) : '08:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const volunteerId = useId();
  const taskId = useId();
  const dateId = useId();
  const timeId = useId();

  if (!isOpen) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombreVoluntario.trim();
    const cleanTarea = tareaAsignada.trim();

    if (!cleanNombre || !cleanTarea || !fechaTurno) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        nombre_voluntario: cleanNombre,
        tarea_asignada: cleanTarea,
        fecha_turno: fechaTurno,
        hora_inicio: `${horaInicio}:00`,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al registrar el turno.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={shiftToEdit ? 'Editar Turno de Voluntariado' : 'Asignar Nuevo Turno'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label htmlFor={volunteerId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Nombre del Voluntario *
          </label>
          <input
            id={volunteerId}
            type="text"
            required
            value={nombreVoluntario}
            onChange={(e) => setNombreVoluntario(e.target.value)}
            placeholder="Ej: Laura Gómez"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div>
          <label htmlFor={taskId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Tarea Asignada *
          </label>
          <div className="space-y-2">
            <select
              id={taskId}
              value={
                ['Paseo de perros', 'Limpieza de caniles y gateras', 'Alimentación y cuidados', 'Apoyo en atención veterinaria', 'Recepción de visitas y adopciones'].includes(tareaAsignada)
                  ? tareaAsignada
                  : 'otro'
              }
              onChange={(e) => {
                if (e.target.value !== 'otro') {
                  setTareaAsignada(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="Paseo de perros">🐕 Paseo de perros</option>
              <option value="Limpieza de caniles y gateras">🧹 Limpieza de caniles y gateras</option>
              <option value="Alimentación y cuidados">🍲 Alimentación y cuidados</option>
              <option value="Apoyo en atención veterinaria">🩺 Apoyo en atención veterinaria</option>
              <option value="Recepción de visitas y adopciones">👋 Recepción de visitas y adopciones</option>
              <option value="otro">✏️ Otra tarea personalizada...</option>
            </select>

            <input
              type="text"
              required
              value={tareaAsignada}
              onChange={(e) => setTareaAsignada(e.target.value)}
              placeholder="Descripción de la tarea asignada"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={dateId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Fecha del Turno *
            </label>
            <input
              id={dateId}
              type="date"
              required
              value={fechaTurno}
              onChange={(e) => setFechaTurno(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label htmlFor={timeId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Hora de Inicio *
            </label>
            <input
              id={timeId}
              type="time"
              required
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
            className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            {isSubmitting ? 'Guardando...' : shiftToEdit ? 'Guardar Cambios' : 'Asignar Turno'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
