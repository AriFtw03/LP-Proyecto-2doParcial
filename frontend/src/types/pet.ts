// APORTE: ARIANNA FEIJOO
export type AdoptionStatus = 'disponible' | 'en proceso' | 'adoptado';

export interface Pet {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
  estado_salud: string;
  estado_adopcion: AdoptionStatus;
  foto_url?: string | null;
  fecha_ingreso: string;
}

export type PetInput = Omit<Pet, 'id' | 'fecha_ingreso'>;

export interface PetFilterParams {
  estado_adopcion?: AdoptionStatus;
}
