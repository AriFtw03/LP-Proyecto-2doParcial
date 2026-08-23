// APORTE: ARIANNA FEIJOO
import { request } from './api';
import type { Pet, PetInput, AdoptionStatus } from '../types/pet';

export const petService = {
  getAll: (status?: AdoptionStatus, signal?: AbortSignal) => {
    const query = status ? `?estado_adopcion=${encodeURIComponent(status)}` : '';
    return request<Pet[]>(`/mascotas.php${query}`, { signal });
  },

  getById: (id: number, signal?: AbortSignal) =>
    request<Pet>(`/mascotas.php?id=${id}`, { signal }),

  create: (data: PetInput) =>
    request<{ mensaje: string; id: number }>('/mascotas.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<PetInput>) =>
    request<{ mensaje: string }>('/mascotas.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    }),

  delete: (id: number) =>
    request<{ mensaje: string }>('/mascotas.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};
