export type UserRole = 'ADMIN' | 'DESARROLLADOR' | 'RESPONSABLE' | 'TURNO' | 'VISITA';

export interface User {
  nombre: string;
  rut: string;
  rol: UserRole;
  activo: 'SÍ' | 'NO';
  puedeEditar: boolean;
  ultimoLogin?: string;
  observaciones?: string;
  clave?: string; // stored simple password
  email?: string; // mapped email for Google authentication
}

export interface Cable {
  id: string; // e.g. "CP-FO-001"
  subestacion: string; // e.g. "SE Carrera Pinto 220kV"
  tipo: 'Fibra Óptica' | 'Ethernet' | string;
  plano: string;
  pagina: number | string;
  areaTablero: string;
  origen: string;
  puertoOrigen: string;
  destino: string;
  puertoDestino: string;
  tipoCable: string;
  medioConector: string;
  cantidadMetros: number;
  turno?: string;
  responsable?: string;
  tendido: 'Sí' | 'No' | 'Observado' | 'N/A';
  conexionado: 'Sí' | 'No' | 'Observado' | 'N/A';
  etiquetado: 'Sí' | 'No' | 'Observado' | 'N/A';
  certificado: 'Sí' | 'No' | 'Observado' | 'N/A';
  validadoSupervisor: 'Sí' | 'No' | 'Observado' | 'N/A';
  avance: number; // e.g. 0 to 100
  estadoGeneral: 'Pendiente' | 'En ejecución' | 'Terminado' | 'Observado';
  fechaActualizacion?: string;
  evidencia?: string;
  observaciones?: string;
}

export interface HistoryLog {
  id: string;
  cableId: string;
  usuario: string;
  rut: string;
  rol: string;
  fecha: string;
  detalle: string;
  anteriorEstado: string;
  nuevoEstado: string;
}
