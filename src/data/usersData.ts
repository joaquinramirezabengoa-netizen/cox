import { User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    nombre: 'Joaquín Ramírez',
    rut: '11111111-1',
    rol: 'ADMIN',
    activo: 'SÍ',
    puedeEditar: true,
    clave: 'Admin1234*',
    email: 'joaquinramirez.abengoa@gmail.com',
    observaciones: 'Administrador principal del sistema (Acceso Google habilitado)'
  },
  {
    nombre: 'Responsable Terreno',
    rut: '22222222-2',
    rol: 'RESPONSABLE',
    activo: 'SÍ',
    puedeEditar: true,
    clave: 'Resp1234*',
    email: 'responsable@cox.cl',
    observaciones: 'Encargado de coordinar tendidos de terreno'
  },
  {
    nombre: 'Supervisor Turno A',
    rut: '33333333-3',
    rol: 'TURNO',
    activo: 'SÍ',
    puedeEditar: true,
    clave: 'TurnoA123*',
    email: 'turnoa@cox.cl',
    observaciones: 'Ingreso de avance para el Turno A'
  },
  {
    nombre: 'Supervisor Turno B',
    rut: '44444444-4',
    rol: 'TURNO',
    activo: 'SÍ',
    puedeEditar: true,
    clave: 'TurnoB123*',
    email: 'turnob@cox.cl',
    observaciones: 'Ingreso de avance para el Turno B'
  },
  {
    nombre: 'Visitante General',
    rut: '55555555-5',
    rol: 'VISITA',
    activo: 'SÍ',
    puedeEditar: false,
    clave: 'Visita123*',
    email: 'visita@cox.cl',
    observaciones: 'Acceso corporativo para visualización y descarga'
  }
];
