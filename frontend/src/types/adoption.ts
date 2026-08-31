// APORTE: MATIAS COLLAGUAZO
export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada';

export type HousingType =
  | 'casa_propia'
  | 'casa_alquiler'
  | 'departamento_propio'
  | 'departamento_alquiler'
  | 'otro';

export type ExperienceLevel =
  | 'primera_vez'
  | 'ha_tenido_antes'
  | 'cuidador_experimentado';

export interface AdoptionRequest {
  id: number;
  mascota_id: number;
  mascota_nombre?: string;
  mascota_especie?: string;
  mascota_raza?: string;
  mascota_foto_url?: string | null;
  mascota_estado_salud?: string;
  mascota_estado_adopcion?: string;
  nombre_solicitante: string;
  correo_contacto: string;
  telefono_contacto: string;
  ciudad_direccion: string;
  tipo_vivienda: HousingType;
  tiene_patio_espacio: boolean | number;
  otras_mascotas: boolean | number;
  descripcion_otras_mascotas?: string | null;
  experiencia_previa: ExperienceLevel;
  motivo_adopcion: string;
  estado_solicitud: RequestStatus;
  fecha_solicitud: string;
}

export type AdoptionInput = {
  mascota_id: number;
  nombre_solicitante: string;
  correo_contacto: string;
  telefono_contacto: string;
  ciudad_direccion: string;
  tipo_vivienda: HousingType;
  tiene_patio_espacio: boolean | number;
  otras_mascotas: boolean | number;
  descripcion_otras_mascotas?: string | null;
  experiencia_previa: ExperienceLevel;
  motivo_adopcion: string;
  estado_solicitud?: RequestStatus;
};

export interface AdoptionFilterParams {
  estado_solicitud?: RequestStatus;
  mascota_id?: number;
}

