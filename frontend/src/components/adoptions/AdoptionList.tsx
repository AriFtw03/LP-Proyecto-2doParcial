// APORTE: MATIAS COLLAGUAZO
import React, { useState, useEffect, useCallback } from 'react';
import type { AdoptionRequest, RequestStatus, HousingType, ExperienceLevel } from '../../types/adoption';
import { adoptionService } from '../../services/adoptionService';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import {
  Trash2,
  Filter,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  HeartHandshake,
  Clock,
  Sparkles,
  XCircle,
  Mail,
  User,
  Phone,
  MapPin,
  Home,
  Eye,
  Check,
  X,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const housingLabels: Record<HousingType, string> = {
  casa_propia: 'Casa Propia',
  casa_alquiler: 'Casa Alquiler',
  departamento_propio: 'Depto Propio',
  departamento_alquiler: 'Depto Alquiler',
  otro: 'Otro',
};

const experienceLabels: Record<ExperienceLevel, string> = {
  primera_vez: 'Primera vez',
  ha_tenido_antes: 'Con experiencia',
  cuidador_experimentado: 'Experimentado',
};

export const AdoptionList: React.FC = () => {
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AdoptionRequest | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adoptionService.getAll(
        statusFilter === 'all' ? undefined : (statusFilter as RequestStatus)
      );
      setRequests(data);
      if (selectedRequest) {
        const updated = data.find((r) => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('No se pudieron cargar las solicitudes de adopción.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedRequest]);

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

  const handleStatusChange = async (id: number, newStatus: RequestStatus): Promise<boolean> => {
    try {
      setIsProcessingAction(true);
      setError(null);
      await adoptionService.updateStatus(id, newStatus);
      setSuccessMessage(`Solicitud #${id} actualizada a estado '${newStatus}'.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchRequests();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado de la solicitud.');
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Confirmas que deseas eliminar esta solicitud de adopción?')) {
      try {
        setError(null);
        await adoptionService.delete(id);
        if (selectedRequest?.id === id) {
          setSelectedRequest(null);
        }
        setSuccessMessage(`Solicitud #${id} eliminada exitosamente.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar la solicitud.');
      }
    }
  };

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.estado_solicitud === 'pendiente').length;
  const approvedCount = requests.filter((r) => r.estado_solicitud === 'aprobada').length;
  const rejectedCount = requests.filter((r) => r.estado_solicitud === 'rechazada').length;

  return (
    <div className="p-8 space-y-6">
      {/* Contadores Estadísticos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0">
            <HeartHandshake size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Trámites</p>
            <p className="text-xl font-bold text-slate-800">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendientes</p>
            <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aprobadas</p>
            <p className="text-xl font-bold text-emerald-700">{approvedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rechazadas</p>
            <p className="text-xl font-bold text-rose-700">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
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
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">Todas las solicitudes ({totalCount})</option>
            <option value="pendiente">Pendientes ({pendingCount})</option>
            <option value="aprobada">Aprobadas ({approvedCount})</option>
            <option value="rechazada">Rechazadas ({rejectedCount})</option>
          </select>
        </div>
      </div>

      {/* Alertas */}
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
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm animate-fadeIn">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabla de Gestión */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" aria-label="Listado de solicitudes de adopción">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-4">ID</th>
                <th scope="col" className="py-3.5 px-4">Solicitante y Contacto</th>
                <th scope="col" className="py-3.5 px-4">Mascota Solicitada</th>
                <th scope="col" className="py-3.5 px-4">Entorno Habitacional</th>
                <th scope="col" className="py-3.5 px-4">Experiencia</th>
                <th scope="col" className="py-3.5 px-4">Fecha</th>
                <th scope="col" className="py-3.5 px-4">Estado</th>
                <th scope="col" className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-teal-600" />
                      <span>Cargando solicitudes de adopción...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No hay solicitudes registradas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const hasPatio = Boolean(req.tiene_patio_espacio);
                  const hasOtherPets = Boolean(req.otras_mascotas);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">#{req.id}</td>

                      {/* Solicitante y Contacto rápido */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span>{req.nombre_solicitante}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-slate-500">
                          {req.telefono_contacto && (
                            <a
                              href={`tel:${req.telefono_contacto}`}
                              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-mono hover:underline"
                            >
                              <Phone size={11} className="shrink-0 text-slate-400" />
                              <span>{req.telefono_contacto}</span>
                            </a>
                          )}
                          <a
                            href={`mailto:${req.correo_contacto}`}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-mono hover:underline"
                          >
                            <Mail size={11} className="shrink-0 text-slate-400" />
                            <span className="truncate max-w-[180px]">{req.correo_contacto}</span>
                          </a>
                        </div>
                      </td>

                      {/* Mascota */}
                      <td className="py-3 px-4 text-slate-800">
                        <div className="font-medium text-slate-800">
                          {req.mascota_nombre || `ID #${req.mascota_id}`}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {req.mascota_especie ? `${req.mascota_especie}` : ''}
                          {req.mascota_raza ? ` · ${req.mascota_raza}` : ''}
                        </div>
                      </td>

                      {/* Entorno Habitacional */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <Home size={11} className="text-slate-500 shrink-0" />
                            {housingLabels[req.tipo_vivienda] || req.tipo_vivienda}
                          </span>
                          {hasPatio ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Patio
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                              Sin patio
                            </span>
                          )}
                          {hasOtherPets && (
                            <span
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                              title={req.descripcion_otras_mascotas || 'Tiene otras mascotas'}
                            >
                              +Mascotas
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Experiencia */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-600 font-medium">
                          {experienceLabels[req.experiencia_previa] || req.experiencia_previa}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(req.fecha_solicitud).toLocaleDateString()}
                      </td>

                      {/* Estado con selector */}
                      <td className="py-3 px-4">
                        <select
                          value={req.estado_solicitud}
                          disabled={isProcessingAction}
                          onChange={(e) => handleStatusChange(req.id, e.target.value as RequestStatus)}
                          aria-label={`Estado de solicitud #${req.id}`}
                          className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobada">Aprobada</option>
                          <option value="rechazada">Rechazada</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setSelectedRequest(req);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                            aria-label={`Evaluar expediente de solicitud #${req.id} de ${req.nombre_solicitante}`}
                            title="Ver y evaluar expediente completo"
                          >
                            <Eye size={14} aria-hidden="true" />
                            <span>Evaluar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(req.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                            aria-label={`Eliminar solicitud #${req.id} de ${req.nombre_solicitante}`}
                            title="Eliminar solicitud"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Evaluación Administrativa / Detalle Completo */}
      {selectedRequest && (
        <Modal
          isOpen={Boolean(selectedRequest)}
          onClose={() => {
            setSelectedRequest(null);
            setError(null);
          }}
          title={`Expediente de Solicitud #${selectedRequest.id}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm animate-fadeIn">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {/* Header del expediente con estado actual */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-base">{selectedRequest.nombre_solicitante}</h4>
                  <StatusBadge status={selectedRequest.estado_solicitud} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Postulación registrada el {new Date(selectedRequest.fecha_solicitud).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <span className="font-mono text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 font-semibold shadow-2xs">
                  Trámite #{selectedRequest.id}
                </span>
              </div>
            </div>

            {/* Datos del Solicitante y Contacto */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm pb-2 border-b border-slate-100">
                <User size={16} />
                <h5>Información del Solicitante</h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider font-semibold">Correo Electrónico</span>
                  <a
                    href={`mailto:${selectedRequest.correo_contacto}`}
                    className="text-slate-800 font-medium hover:text-teal-600 hover:underline flex items-center gap-1 mt-0.5 font-mono"
                  >
                    <Mail size={12} className="text-slate-400" />
                    {selectedRequest.correo_contacto}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider font-semibold">Teléfono de Contacto</span>
                  <a
                    href={`tel:${selectedRequest.telefono_contacto}`}
                    className="text-teal-700 font-medium hover:underline flex items-center gap-1 mt-0.5 font-mono"
                  >
                    <Phone size={12} className="text-slate-400" />
                    {selectedRequest.telefono_contacto}
                  </a>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block uppercase tracking-wider font-semibold">Ciudad / Dirección Domiciliaria</span>
                  <p className="text-slate-700 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    {selectedRequest.ciudad_direccion}
                  </p>
                </div>
              </div>
            </div>

            {/* Mascota Vinculada */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm pb-2 border-b border-slate-100">
                <Sparkles size={16} />
                <h5>Mascota Solicitada</h5>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xl overflow-hidden shrink-0 relative">
                  {selectedRequest.mascota_foto_url ? (
                    <img
                      src={selectedRequest.mascota_foto_url}
                      alt={selectedRequest.mascota_nombre || 'Mascota'}
                      className="w-full h-full object-cover relative z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span className="text-xl select-none absolute inset-0 flex items-center justify-center z-0 bg-slate-100">
                    {selectedRequest.mascota_especie?.toLowerCase() === 'gato'
                      ? '🐱'
                      : selectedRequest.mascota_especie?.toLowerCase() === 'perro'
                      ? '🐶'
                      : '🐾'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs flex-1">
                  <div>
                    <span className="text-slate-400 block">Nombre</span>
                    <span className="font-semibold text-slate-800">{selectedRequest.mascota_nombre || `ID #${selectedRequest.mascota_id}`}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Especie y Raza</span>
                    <span className="font-medium text-slate-700">
                      {selectedRequest.mascota_especie || 'No especificada'}
                      {selectedRequest.mascota_raza ? ` (${selectedRequest.mascota_raza})` : ''}
                    </span>
                  </div>
                  {selectedRequest.mascota_estado_salud && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block">Estado de Salud</span>
                      <span className="font-medium text-slate-700">{selectedRequest.mascota_estado_salud}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Entorno Habitacional y Antecedentes */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm pb-2 border-b border-slate-100">
                <ShieldCheck size={16} />
                <h5>Evaluación Habitacional y Tenencia Responsable</h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                  <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Tipo de Vivienda</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {housingLabels[selectedRequest.tipo_vivienda] || selectedRequest.tipo_vivienda}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                  <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Patio o Espacio Cerrado</span>
                  <span
                    className={`font-semibold mt-1 block ${
                      selectedRequest.tiene_patio_espacio ? 'text-emerald-700' : 'text-slate-600'
                    }`}
                  >
                    {selectedRequest.tiene_patio_espacio ? '✓ Cuenta con patio' : '✗ Sin patio / espacio cerrado'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                  <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Experiencia Previa</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {experienceLabels[selectedRequest.experiencia_previa] || selectedRequest.experiencia_previa}
                  </span>
                </div>
              </div>

              {/* Detalle de otras mascotas */}
              <div className="p-3 rounded-lg border bg-slate-50/70 border-slate-200 text-xs">
                <span className="font-semibold text-slate-700 block mb-1">
                  Convivencia con otros animales:
                </span>
                {selectedRequest.otras_mascotas ? (
                  <div className="text-slate-700">
                    <span className="inline-block px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 font-semibold mr-1.5 text-[11px]">
                      Sí conviven mascotas
                    </span>
                    <span>{selectedRequest.descripcion_otras_mascotas || 'No se especificaron detalles.'}</span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">No tiene otras mascotas en el hogar actualmente.</span>
                )}
              </div>
            </div>

            {/* Motivo de Adopción */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm pb-2 border-b border-slate-100">
                <FileText size={16} />
                <h5>Motivación y Carta de Postulación</h5>
              </div>
              <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-100 text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                {selectedRequest.motivo_adopcion}
              </div>
            </div>

            {/* Barra de Decisiones del Evaluador */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar Expediente
              </button>

              <div className="flex items-center gap-2">
                {selectedRequest.estado_solicitud !== 'rechazada' && (
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={async () => {
                      const ok = await handleStatusChange(selectedRequest.id, 'rechazada');
                      if (ok) setSelectedRequest(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <X size={16} />
                    <span>Rechazar</span>
                  </button>
                )}

                {selectedRequest.estado_solicitud !== 'pendiente' && (
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={async () => {
                      const ok = await handleStatusChange(selectedRequest.id, 'pendiente');
                      if (ok) setSelectedRequest(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Clock size={16} />
                    <span>Marcar Pendiente</span>
                  </button>
                )}

                {selectedRequest.estado_solicitud !== 'aprobada' && (
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={async () => {
                      const ok = await handleStatusChange(selectedRequest.id, 'aprobada');
                      if (ok) setSelectedRequest(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Check size={16} />
                    <span>Aprobar Solicitud</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

