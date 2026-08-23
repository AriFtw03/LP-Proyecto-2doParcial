// APORTE: MATIAS COLLAGUAZO
import { request } from './api';
import type { AdoptionRequest, AdoptionInput, RequestStatus } from '../types/adoption';

export const adoptionService = {
  getAll: (status?: RequestStatus, signal?: AbortSignal) => {
    const query = status ? `?estado_solicitud=${encodeURIComponent(status)}` : '';
    return request<AdoptionRequest[]>(`/adopciones.php${query}`, { signal });
  },

  getByPet: (petId: number, signal?: AbortSignal) =>
    request<AdoptionRequest[]>(`/adopciones.php?mascota_id=${petId}`, { signal }),

  create: (data: AdoptionInput) =>
    request<{ mensaje: string; id: number }>('/adopciones.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, estado_solicitud: RequestStatus) =>
    request<{ mensaje: string }>('/adopciones.php', {
      method: 'PUT',
      body: JSON.stringify({ id, estado_solicitud }),
    }),

  delete: (id: number) =>
    request<{ mensaje: string }>('/adopciones.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};
