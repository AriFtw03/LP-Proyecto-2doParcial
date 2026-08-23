// APORTE: MATIAS COLLAGUAZO
import React, { useState, useEffect, useCallback } from 'react';
import type { AdoptionRequest, RequestStatus } from '../../types/adoption';
import { adoptionService } from '../../services/adoptionService';
import { Trash2, Filter, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdoptionList: React.FC = () => {
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adoptionService.getAll(
        statusFilter === 'all' ? undefined : (statusFilter as RequestStatus)
      );
      setRequests(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('No se pudieron cargar las solicitudes de adopción.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    adoptionService
      .getAll(
        statusFilter === 'all' ? undefined : (statusFilter as RequestStatus),
        controller.signal
      )
      .then((data) => {
        setRequests(data);
        setError(null);
      })
      .catch((err) => {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          setError('No se pudieron cargar las solicitudes de adopción.');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [statusFilter]);

  const handleStatusChange = async (id: number, newStatus: RequestStatus) => {
    try {
      setError(null);
      await adoptionService.updateStatus(id, newStatus);
      setSuccessMessage(`Solicitud #${id} actualizada a estado '${newStatus}'.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado de la solicitud.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Confirmas que deseas eliminar esta solicitud de adopción?')) {
      try {
        setError(null);
        await adoptionService.delete(id);
        setSuccessMessage(`Solicitud #${id} eliminada exitosamente.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar la solicitud.');
      }
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={18} className="text-slate-400 shrink-0" aria-hidden="true" />
          <label htmlFor="adoption-filter" className="text-sm font-medium text-slate-700">
            Filtrar por estado:
          </label>
          <select
            id="adoption-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">Todas las solicitudes</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
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
              fetchRequests();
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm border-collapse" aria-label="Listado de solicitudes de adopción">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4">ID</th>
              <th scope="col" className="py-3.5 px-4">Solicitante</th>
              <th scope="col" className="py-3.5 px-4">Correo</th>
              <th scope="col" className="py-3.5 px-4">Mascota Solicitada</th>
              <th scope="col" className="py-3.5 px-4">Fecha Postulación</th>
              <th scope="col" className="py-3.5 px-4">Estado</th>
              <th scope="col" className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <div className="flex justify-center items-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-teal-600" />
                    <span>Cargando solicitudes de adopción...</span>
                  </div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No hay solicitudes registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">#{req.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{req.nombre_solicitante}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">{req.correo_contacto}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {req.mascota_nombre || `ID #${req.mascota_id}`}
                    {req.mascota_especie && (
                      <span className="text-xs text-slate-400 ml-1">({req.mascota_especie})</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {new Date(req.fecha_solicitud).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={req.estado_solicitud}
                      onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus)}
                      aria-label={`Estado de solicitud #${req.id}`}
                      className="text-xs font-medium px-2 py-1 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="rechazada">Rechazada</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(req.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      aria-label={`Eliminar solicitud #${req.id} de ${req.nombre_solicitante}`}
                      title="Eliminar solicitud"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
