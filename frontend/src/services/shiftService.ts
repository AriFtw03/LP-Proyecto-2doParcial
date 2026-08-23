// APORTE: DIEGO ALFONZO
import { request } from './api';
import type { Shift, ShiftInput, ShiftFilterParams } from '../types/shift';

export const shiftService = {
  getAll: (filter?: ShiftFilterParams, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (filter?.fecha) params.append('fecha', filter.fecha);
    if (filter?.voluntario) params.append('voluntario', filter.voluntario);
    if (filter?.inicio && filter?.fin) {
      params.append('fecha_inicio', filter.inicio);
      params.append('fecha_fin', filter.fin);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Shift[]>(`/turnos.php${query}`, { signal });
  },

  getById: (id: number, signal?: AbortSignal) =>
    request<Shift>(`/turnos.php?id=${id}`, { signal }),

  create: (data: ShiftInput) =>
    request<{ mensaje: string; id: number }>('/turnos.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ShiftInput>) =>
    request<{ mensaje: string }>('/turnos.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    }),

  delete: (id: number) =>
    request<{ mensaje: string }>('/turnos.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};
