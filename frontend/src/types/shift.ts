// APORTE: DIEGO ALFONZO
export interface Shift {
  id: number;
  nombre_voluntario: string;
  tarea_asignada: string;
  fecha_turno: string;
  hora_inicio: string;
}

export type ShiftInput = Omit<Shift, 'id'>;

export interface ShiftFilterParams {
  fecha?: string;
  voluntario?: string;
  inicio?: string;
  fin?: string;
}
