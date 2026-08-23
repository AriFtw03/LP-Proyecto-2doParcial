// APORTE: MATIAS COLLAGUAZO
export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface AdoptionRequest {
  id: number;
  mascota_id: number;
  mascota_nombre?: string;
  mascota_especie?: string;
  nombre_solicitante: string;
  correo_contacto: string;
  estado_solicitud: RequestStatus;
  fecha_solicitud: string;
}

export type AdoptionInput = Pick<AdoptionRequest, 'mascota_id' | 'nombre_solicitante' | 'correo_contacto'> & {
  estado_solicitud?: RequestStatus;
};

export interface AdoptionFilterParams {
  estado_solicitud?: RequestStatus;
  mascota_id?: number;
}
