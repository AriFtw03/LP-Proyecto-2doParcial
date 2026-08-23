// APORTE: DIEGO ALFONZO
import React, { useState, useEffect, useCallback, useId } from 'react';
import type { Shift, ShiftInput } from '../../types/shift';
import { shiftService } from '../../services/shiftService';
import { Plus, Search, Calendar, Clock, User, Trash2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ShiftModal } from './ShiftModal';

export const ShiftCalendar: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dateFilterId = useId();

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shiftService.getAll({
        voluntario: searchTerm || undefined,
        fecha: selectedDate || undefined,
      });
      setShifts(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('No se pudieron cargar los turnos de voluntariado.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDate]);

  useEffect(() => {
    const controller = new AbortController();
    shiftService
      .getAll(
        {
          voluntario: searchTerm || undefined,
          fecha: selectedDate || undefined,
        },
        controller.signal
      )
      .then((data) => {
        setShifts(data);
        setError(null);
      })
      .catch((err) => {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          setError('No se pudieron cargar los turnos de voluntariado.');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [searchTerm, selectedDate]);

  const handleCreateOrUpdate = async (data: ShiftInput) => {
    try {
      setError(null);
      if (editingShift) {
        await shiftService.update(editingShift.id, data);
        setSuccessMessage('Turno de voluntariado actualizado exitosamente.');
      } else {
        await shiftService.create(data);
        setSuccessMessage('Nuevo turno asignado exitosamente.');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchShifts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el turno.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Confirmas que deseas cancelar este turno de voluntariado?')) {
      try {
        setError(null);
        await shiftService.delete(id);
        setSuccessMessage(`Turno #${id} eliminado correctamente.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchShifts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar el turno.');
      }
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar voluntario..."
              aria-label="Buscar voluntario por nombre"
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor={dateFilterId} className="sr-only">
              Filtrar por fecha
            </label>
            <input
              id={dateFilterId}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-600"
            />

            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Limpiar Fecha
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingShift(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-xs shrink-0 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Asignar Turno</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchShifts();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw size={24} className="animate-spin text-teal-600" />
            <span>Cargando calendario de actividades...</span>
          </div>
        ) : shifts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-slate-200 text-slate-500 font-medium">
            No hay turnos programados para los criterios seleccionados.
          </div>
        ) : (
          shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <User size={18} className="text-teal-600" aria-hidden="true" />
                    <span>{shift.nombre_voluntario}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(shift.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    aria-label={`Eliminar turno de ${shift.nombre_voluntario}`}
                    title="Eliminar turno"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 font-medium">
                  {shift.tarea_asignada}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar size={14} className="text-slate-400" aria-hidden="true" />
                  <span>{new Date(shift.fecha_turno + 'T00:00:00').toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-slate-600">
                  <Clock size={14} className="text-slate-400" aria-hidden="true" />
                  <span>{shift.hora_inicio.slice(0, 5)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <ShiftModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateOrUpdate}
          shiftToEdit={editingShift}
          key={editingShift?.id ?? 'new'}
        />
      )}
    </div>
  );
};
