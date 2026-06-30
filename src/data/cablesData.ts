import { Cable } from '../types';

export function getInitialCables(): Cable[] {
  const cables: Cable[] = [];

  // Helper to calculate progress based on checklist
  const calcProgressAndState = (
    tendido: string,
    conexionado: string,
    etiquetado: string,
    certificado: string,
    validado: string
  ): { avance: number; estado: 'Pendiente' | 'En ejecución' | 'Terminado' | 'Observado' } => {
    const steps = [tendido, conexionado, etiquetado, certificado, validado];
    const yesCount = steps.filter(s => s === 'Sí').length;
    const naCount = steps.filter(s => s === 'N/A').length;
    const obsCount = steps.filter(s => s === 'Observado').length;

    const totalActiveSteps = 5 - naCount;
    let avance = 0;
    if (totalActiveSteps > 0) {
      avance = Math.round((yesCount / totalActiveSteps) * 100);
    }

    let estado: 'Pendiente' | 'En ejecución' | 'Terminado' | 'Observado' = 'Pendiente';
    if (obsCount > 0) {
      estado = 'Observado';
    } else if (yesCount === totalActiveSteps && totalActiveSteps > 0) {
      estado = 'Terminado';
    } else if (yesCount > 0 || steps.some(s => s === 'Sí' || s === 'Observado')) {
      estado = 'En ejecución';
    }

    return { avance, estado };
  };

  // Pre-seed some status mixes for beautiful initial dashboards
  const getPreseededChecks = (idNum: number): {
    tendido: 'Sí' | 'No' | 'Observado' | 'N/A';
    conexionado: 'Sí' | 'No' | 'Observado' | 'N/A';
    etiquetado: 'Sí' | 'No' | 'Observado' | 'N/A';
    certificado: 'Sí' | 'No' | 'Observado' | 'N/A';
    validadoSupervisor: 'Sí' | 'No' | 'Observado' | 'N/A';
    turno?: string;
    responsable?: string;
    obs?: string;
  } => {
    // 35% finished, 20% in execution, 5% observed, 40% pending
    if (idNum % 7 === 0) {
      return {
        tendido: 'Sí',
        conexionado: 'Sí',
        etiquetado: 'Sí',
        certificado: 'Sí',
        validadoSupervisor: 'Sí',
        turno: 'Turno A',
        responsable: 'Joaquín Ramírez',
        obs: 'Certificación de atenuación aprobada sin observaciones.'
      };
    } else if (idNum % 13 === 0) {
      return {
        tendido: 'Sí',
        conexionado: 'Sí',
        etiquetado: 'Observado',
        certificado: 'No',
        validadoSupervisor: 'No',
        turno: 'Turno B',
        responsable: 'Responsable Terreno',
        obs: 'Etiqueta ilegible, requiere re-impresión.'
      };
    } else if (idNum % 5 === 0) {
      return {
        tendido: 'Sí',
        conexionado: 'Sí',
        etiquetado: 'Sí',
        certificado: 'No',
        validadoSupervisor: 'No',
        turno: 'Turno A',
        responsable: 'Supervisor Turno A',
        obs: 'Fusionado completado, pendiente realizar pruebas reflectométricas (OTDR).'
      };
    } else if (idNum % 9 === 0) {
      return {
        tendido: 'Sí',
        conexionado: 'No',
        etiquetado: 'No',
        certificado: 'No',
        validadoSupervisor: 'No',
        turno: 'Turno B',
        responsable: 'Supervisor Turno B',
        obs: 'Cable tendido en escalerilla de comunicaciones.'
      };
    }
    return {
      tendido: 'No',
      conexionado: 'No',
      etiquetado: 'No',
      certificado: 'No',
      validadoSupervisor: 'No'
    };
  };

  // 1. CP-FO-001 to CP-FO-024 (ODF1 Communications)
  for (let i = 1; i <= 24; i++) {
    const id = `CP-FO-${String(i).padStart(3, '0')}`;
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id,
      subestacion: 'SE Carrera Pinto 220kV',
      tipo: 'Fibra Óptica',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0138',
      pagina: 12,
      areaTablero: 'Armario/ODF comunicaciones',
      origen: 'ODF1',
      puertoOrigen: `Puerto ${i}`,
      destino: 'Por completar en terreno',
      puertoDestino: '',
      tipoCable: 'Fibra óptica / patch cord',
      medioConector: 'DIO 24 puertas / Opticoax',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto ODF identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 2. CP-FO-025 to CP-FO-048 (ODF2 Communications)
  for (let i = 25; i <= 48; i++) {
    const id = `CP-FO-${String(i).padStart(3, '0')}`;
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id,
      subestacion: 'SE Carrera Pinto 220kV',
      tipo: 'Fibra Óptica',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0138',
      pagina: 13,
      areaTablero: 'Armario/ODF comunicaciones',
      origen: 'ODF2',
      puertoOrigen: `Puerto ${i - 24}`,
      destino: 'Por completar en terreno',
      puertoDestino: '',
      tipoCable: 'Fibra óptica / patch cord',
      medioConector: 'DIO 24 puertas / Opticoax',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto ODF identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 3. CP-FO-049 to CP-FO-072 (ODF3 Communications)
  for (let i = 49; i <= 72; i++) {
    const id = `CP-FO-${String(i).padStart(3, '0')}`;
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id,
      subestacion: 'SE Carrera Pinto 220kV',
      tipo: 'Fibra Óptica',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0138',
      pagina: 18,
      areaTablero: 'Armario/ODF comunicaciones',
      origen: 'ODF3',
      puertoOrigen: `Puerto ${i - 48}`,
      destino: 'Por completar en terreno',
      puertoDestino: '',
      tipoCable: 'Fibra óptica / patch cord',
      medioConector: 'DIO 24 puertas / Opticoax',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto ODF identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 4. CP-FO-073 to CP-FO-078 (Protecciones)
  const cpProtecciones = [
    { name: 'SPJ22-S1', desc: 'Schneider P546' },
    { name: 'SPJ22-S2', desc: 'Schneider P546' },
    { name: '50BF-J22', desc: 'Schneider P443' },
    { name: '50BF-J23', desc: 'Schneider P443' },
    { name: '87B1-J23', desc: 'Schneider P743' },
    { name: '87B2-J2', desc: 'Schneider P743' }
  ];
  cpProtecciones.forEach((p, idx) => {
    const i = 73 + idx;
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id: `CP-FO-${String(i).padStart(3, '0')}`,
      subestacion: 'SE Carrera Pinto 220kV',
      tipo: 'Fibra Óptica',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0138',
      pagina: i === 73 || i === 74 ? 14 : i === 75 || i === 76 ? 16 : 17,
      areaTablero: 'Protecciones',
      origen: p.name,
      puertoOrigen: 'Puertos ópticos / TX-RX',
      destino: 'ODF correspondiente',
      puertoDestino: '',
      tipoCable: 'Patch cord F.O.',
      medioConector: p.desc,
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Equipo/página detectado en plano; completar puerto exacto si aplica.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  });

  // 5. CP-FO-079 to CP-FO-084 (Control paño J22/J23)
  for (let i = 79; i <= 84; i++) {
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    const subIdx = i - 79;
    const equipment = subIdx < 3 ? 'CP1-J22/J23' : 'CP2-J22/J23';
    const tx = `TX${(subIdx % 3) + 1}`;
    cables.push({
      id: `CP-FO-${String(i).padStart(3, '0')}`,
      subestacion: 'SE Carrera Pinto 220kV',
      tipo: 'Fibra Óptica',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0138',
      pagina: 15,
      areaTablero: 'Control paño J22/J23',
      origen: equipment,
      puertoOrigen: tx,
      destino: 'ODF / Switch correspondiente',
      puertoDestino: '',
      tipoCable: 'Patch cord F.O.',
      medioConector: 'Schneider C264',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto TX identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 6. CP-ETH-085 to CP-ETH-092 (Servidor / HMI)
  for (let i = 85; i <= 92; i++) {
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id: `CP-ETH-${String(i).padStart(3, '0')}`,
      subestacion: 'SE Carrera Pinto 220kV',
      tipo: 'Ethernet',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0138',
      pagina: 7,
      areaTablero: 'Servidor / HMI',
      origen: 'SERV1 ECU4784 / ADVANTECH',
      puertoOrigen: `LAN ${i - 84}`,
      destino: 'Switch / red PRP',
      puertoDestino: '',
      tipoCable: 'Patchcord LAN',
      medioConector: 'RJ45',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto LAN identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 7. CP-ETH-093 to CP-ETH-096 (Control paño J22/J23 Ethernet)
  for (let i = 93; i <= 96; i++) {
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    const equip = i < 95 ? 'CP1-J22/J23' : 'CP2-J22/J23';
    const eth = `ETH${(i - 93) % 2 === 0 ? '1' : '2'}`;
    cables.push({
      id: `CP-ETH-${String(i).padStart(3, '0')}`,
      subestacion: 'SE Carrera Pinto 220kV',
      tipo: 'Ethernet',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0138',
      pagina: 15,
      areaTablero: 'Control paño J22/J23',
      origen: equip,
      puertoOrigen: eth,
      destino: 'Switch / red PRP',
      puertoDestino: '',
      tipoCable: 'Patchcord LAN',
      medioConector: 'RJ45',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto ETH identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 8. CP-ETH-097 to CP-FO-105 (Material Stock Cables)
  const cpMaterials = [
    { id: 'CP-ETH-097', tipo: 'Ethernet', desc: 'Material CP 1', label: 'Patchcord LAN CAT5e U/UTP 24AWG interno RJ45 macho/macho', conn: 'RJ45', q: 7, p: 26, cat: 'Cables internos a tableros' },
    { id: 'CP-ETH-098', tipo: 'Ethernet', desc: 'Material CP 2', label: 'Patchcord LAN CAT6 U/UTP 24AWG punto a punto RJ45 macho/hembra', conn: 'RJ45', q: 4, p: 26, cat: 'Cables externos' },
    { id: 'CP-ETH-099', tipo: 'Ethernet', desc: 'Material CP 3', label: 'Patchcord LAN CAT6 U/UTP 24AWG interno RJ45 macho/hembra', conn: 'RJ45', q: 1, p: 26, cat: 'Cables externos' },
    { id: 'CP-FO-100', tipo: 'Fibra Óptica', desc: 'Material CP 4', label: 'Patch cord F.O. duplex multimodo 62,5/125 LC-SC', conn: 'LC-SC', q: 10, p: 26, cat: 'Cables externos' },
    { id: 'CP-FO-101', tipo: 'Fibra Óptica', desc: 'Material CP 5', label: 'Patch cord F.O. duplex monomodo 9/125 LC-ST', conn: 'LC-ST', q: 4, p: 26, cat: 'Cables externos' },
    { id: 'CP-FO-102', tipo: 'Fibra Óptica', desc: 'Material CP 6', label: 'Patch cord F.O. duplex multimodo 9/125 LC-LC', conn: 'LC-LC', q: 8, p: 26, cat: 'Cables externos' },
    { id: 'CP-FO-103', tipo: 'Fibra Óptica', desc: 'Material CP 7', label: 'Patch cord F.O. duplex multimodo 62,5/125 SC-LC', conn: 'SC-LC', q: 2, p: 26, cat: 'Cables externos' },
    { id: 'CP-FO-104', tipo: 'Fibra Óptica', desc: 'Material CP 8', label: 'Patch cord F.O. duplex monomodo 9/125 LC-LC', conn: 'LC-LC', q: 4, p: 26, cat: 'Cables externos' },
    { id: 'CP-FO-105', tipo: 'Fibra Óptica', desc: 'Material CP 9', label: 'Patch cord F.O. duplex multimodo 62,5/125 SC-LC', conn: 'SC-LC', q: 4, p: 26, cat: 'Cables externos' }
  ];
  cpMaterials.forEach((m, idx) => {
    const checks = getPreseededChecks(100 + idx);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id: m.id,
      subestacion: 'SE Carrera Pinto 220kV',
      tipo: m.tipo,
      plano: 'T2025-0174-01-IDCS-CYP-DI-0138',
      pagina: m.p,
      areaTablero: m.cat,
      origen: m.desc,
      puertoOrigen: 'Stock/instalación',
      destino: 'Uso según plano',
      puertoDestino: '',
      tipoCable: m.label,
      medioConector: m.conn,
      cantidadMetros: m.q,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Cantidad tomada desde resumen de cables del plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  });

  // 9. COP-FO-106 to COP-FO-129 (SE Copsol 33/220kV, ODF1)
  for (let i = 106; i <= 129; i++) {
    const id = `COP-FO-${String(i).padStart(3, '0')}`;
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id,
      subestacion: 'SE Copsol 33/220kV',
      tipo: 'Fibra Óptica',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0103',
      pagina: 30,
      areaTablero: 'Armario/ODF comunicaciones',
      origen: 'ODF1',
      puertoOrigen: `Puerto ${i - 105}`,
      destino: 'Por completar en terreno',
      puertoDestino: '',
      tipoCable: 'Fibra óptica / patch cord',
      medioConector: 'DIO 24 puertas / MIPP/Opticoax',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto ODF identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 10. COP-FO-130 to COP-FO-153 (SE Copsol 33/220kV, ODF2)
  for (let i = 130; i <= 153; i++) {
    const id = `COP-FO-${String(i).padStart(3, '0')}`;
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id,
      subestacion: 'SE Copsol 33/220kV',
      tipo: 'Fibra Óptica',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0103',
      pagina: 11,
      areaTablero: 'Armario/ODF comunicaciones',
      origen: 'ODF2',
      puertoOrigen: `Puerto ${i - 129}`,
      destino: 'Por completar en terreno',
      puertoDestino: '',
      tipoCable: 'Fibra óptica / patch cord',
      medioConector: 'DIO 24 puertas / MIPP/Opticoax',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto ODF identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 11. COP-FO-154 to COP-FO-177 (SE Copsol 33/220kV, ODF3)
  for (let i = 154; i <= 177; i++) {
    const id = `COP-FO-${String(i).padStart(3, '0')}`;
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id,
      subestacion: 'SE Copsol 33/220kV',
      tipo: 'Fibra Óptica',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0103',
      pagina: 11,
      areaTablero: 'Armario/ODF comunicaciones',
      origen: 'ODF3',
      puertoOrigen: `Puerto ${i - 153}`,
      destino: 'Por completar en terreno',
      puertoDestino: '',
      tipoCable: 'Fibra óptica / patch cord',
      medioConector: 'DIO 24 puertas / MIPP/Opticoax',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto ODF identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 12. COP-FO-178 to COP-FO-183 (SE Copsol Protecciones)
  const copProtecciones = [
    { name: 'SPJT1-S1', desc: 'Schneider P645', p: 20 },
    { name: 'SPJT1-S2', desc: 'Schneider P645', p: 20 },
    { name: 'SPJT2-S1', desc: 'Schneider P645', p: 23 },
    { name: 'SPJT2-S2', desc: 'Schneider P645', p: 23 },
    { name: 'SPJ5-S1', desc: 'Schneider P546', p: 27 },
    { name: 'SPJ5-S2', desc: 'Schneider P546', p: 27 }
  ];
  copProtecciones.forEach((p, idx) => {
    const i = 178 + idx;
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id: `COP-FO-${String(i).padStart(3, '0')}`,
      subestacion: 'SE Copsol 33/220kV',
      tipo: 'Fibra Óptica',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0103',
      pagina: p.p,
      areaTablero: 'Protecciones',
      origen: p.name,
      puertoOrigen: 'Puertos ópticos / TX-RX',
      destino: 'ODF correspondiente',
      puertoDestino: '',
      tipoCable: 'Patch cord F.O.',
      medioConector: p.desc,
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Equipo/página detectado en plano; completar puerto exacto si aplica.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  });

  // 13. COP-FO-184 to COP-FO-222 (SE Copsol Control C264)
  const copControls = ['CP1-J5', 'CP2-J5', 'CP1-J1', 'CP2-J1', 'CP2-J2', 'CP1-J2', 'CP2-JT1', 'CP1-JT1', 'CP1-JT2', 'CP2-JT2', 'CP1-J3', 'CP2-J3', 'CP-SSAA'];
  let currentId = 184;
  copControls.forEach((c) => {
    for (let txNum = 1; txNum <= 3; txNum++) {
      if (currentId > 222) break;
      const checks = getPreseededChecks(currentId);
      const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
      cables.push({
        id: `COP-FO-${String(currentId).padStart(3, '0')}`,
        subestacion: 'SE Copsol 33/220kV',
        tipo: 'Fibra Óptica',
        plano: 'T2025-0174-01-IDCS-CYP-DI-0103',
        pagina: currentId <= 189 ? 17 : currentId <= 195 ? 18 : currentId <= 201 ? 19 : currentId <= 207 ? 22 : currentId <= 213 ? 25 : currentId <= 219 ? 26 : 28,
        areaTablero: 'Control / C264',
        origen: c,
        puertoOrigen: `TX${txNum}`,
        destino: 'ODF / Switch correspondiente',
        puertoDestino: '',
        tipoCable: 'Patch cord F.O.',
        medioConector: 'Schneider C264',
        cantidadMetros: 1,
        tendido: checks.tendido,
        conexionado: checks.conexionado,
        etiquetado: checks.etiquetado,
        certificado: checks.certificado,
        validadoSupervisor: checks.validadoSupervisor,
        avance,
        estadoGeneral: estado,
        turno: checks.turno,
        responsable: checks.responsable,
        observaciones: checks.obs || 'Puerto TX identificado en plano.',
        fechaActualizacion: checks.turno ? '2026-06-30' : undefined
      });
      currentId++;
    }
  });

  // 14. COP-ETH-223 to COP-ETH-238 (SE Copsol Servidor / HMI)
  for (let i = 223; i <= 238; i++) {
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    const serverName = i <= 230 ? 'SERV1 ECU4784 / ADVANTECH' : 'SERV2 ECU4784 / ADVANTECH';
    const portName = `LAN ${(i - 223) % 8 + 1}`;
    cables.push({
      id: `COP-ETH-${String(i).padStart(3, '0')}`,
      subestacion: 'SE Copsol 33/220kV',
      tipo: 'Ethernet',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0103',
      pagina: 12,
      areaTablero: 'Servidor / HMI',
      origen: serverName,
      puertoOrigen: portName,
      destino: 'Switch / red PRP',
      puertoDestino: '',
      tipoCable: 'Patchcord LAN',
      medioConector: 'RJ45',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Puerto LAN identificado en plano.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  }

  // 15. COP-ETH-239 to COP-ETH-264 (SE Copsol Control C264 Ethernet)
  const copEthControls = ['CP1-J5', 'CP2-J5', 'CP1-J1', 'CP2-J1', 'CP2-J2', 'CP1-J2', 'CP2-JT1', 'CP1-JT1', 'CP1-JT2', 'CP2-JT2', 'CP1-J3', 'CP2-J3', 'CP-SSAA'];
  currentId = 239;
  copEthControls.forEach((c) => {
    for (let ethNum = 1; ethNum <= 2; ethNum++) {
      if (currentId > 264) break;
      const checks = getPreseededChecks(currentId);
      const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
      cables.push({
        id: `COP-ETH-${String(currentId).padStart(3, '0')}`,
        subestacion: 'SE Copsol 33/220kV',
        tipo: 'Ethernet',
        plano: 'T2025-0174-01-IDCS-CYP-DI-0103',
        pagina: currentId <= 242 ? 17 : currentId <= 246 ? 18 : currentId <= 250 ? 19 : currentId <= 254 ? 22 : currentId <= 258 ? 25 : currentId <= 262 ? 26 : 28,
        areaTablero: 'Control / C264',
        origen: c,
        puertoOrigen: `ETH${ethNum}`,
        destino: 'Switch / red PRP',
        puertoDestino: '',
        tipoCable: 'Patchcord LAN',
        medioConector: 'RJ45',
        cantidadMetros: 1,
        tendido: checks.tendido,
        conexionado: checks.conexionado,
        etiquetado: checks.etiquetado,
        certificado: checks.certificado,
        validadoSupervisor: checks.validadoSupervisor,
        avance,
        estadoGeneral: estado,
        turno: checks.turno,
        responsable: checks.responsable,
        observaciones: checks.obs || 'Puerto ETH identificado en plano.',
        fechaActualizacion: checks.turno ? '2026-06-30' : undefined
      });
      currentId++;
    }
  });

  // 16. COP-ETH-265 to COP-ETH-360 (Switchgear / Protecciones SPF)
  const spfEquips = [
    'SPF1', 'SPF2', 'SPF3', 'SPF4', 'SPF5', 'SPF6', 'SPFT1A', 'SPF7', 'SPF8', 'SPF9', 'SPF10',
    'SPF11', 'SPF12', 'SPF13', 'SPF14', 'SPF15', 'SPFT1B', 'SPF16', 'SPF17',
    'SPF18', 'SPF19', 'SPF20', 'SPF21', 'SPF22', 'SPF23', 'SPF24', 'SPF25', 'SPF26', 'SPF27', 'SPF28',
    'SPFT2A', 'SPF29', 'SPF30', 'SPF31', 'SPF32', 'SPF33', 'SPF34', 'SPF35', 'SPF36', 'SPF37', 'SPF38', 'SPF39', 'SPFT2B',
    'SPF40', 'SPF41', 'SPF42', 'SPF43', 'SPF44'
  ];
  currentId = 265;
  spfEquips.forEach((spf) => {
    for (let ethNum = 1; ethNum <= 2; ethNum++) {
      if (currentId > 360) break;
      const checks = getPreseededChecks(currentId);
      const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
      cables.push({
        id: `COP-ETH-${String(currentId).padStart(3, '0')}`,
        subestacion: 'SE Copsol 33/220kV',
        tipo: 'Ethernet',
        plano: 'T2025-0174-01-IDCS-CYP-DI-0103',
        pagina: currentId <= 276 ? 40 : currentId <= 286 ? 41 : currentId <= 290 ? 42 : currentId <= 302 ? 43 : currentId <= 312 ? 44 : currentId <= 324 ? 45 : currentId <= 334 ? 46 : currentId <= 338 ? 47 : currentId <= 350 ? 48 : 49,
        areaTablero: 'Switchgear / protecciones SPF',
        origen: spf,
        puertoOrigen: `ETH${ethNum}`,
        destino: 'Medidor / switch / red de comunicaciones',
        puertoDestino: '',
        tipoCable: 'Patchcord LAN',
        medioConector: 'RJ45 / ETH',
        cantidadMetros: 1,
        tendido: checks.tendido,
        conexionado: checks.conexionado,
        etiquetado: checks.etiquetado,
        certificado: checks.certificado,
        validadoSupervisor: checks.validadoSupervisor,
        avance,
        estadoGeneral: estado,
        turno: checks.turno,
        responsable: checks.responsable,
        observaciones: checks.obs || 'Dispositivo SPF con ETH1/ETH2 detectado en plano.',
        fechaActualizacion: checks.turno ? '2026-06-30' : undefined
      });
      currentId++;
    }
  });

  // 17. COP-ETH-361 to COP-ETH-364 (Switches Red)
  const switches = ['SWRB1', 'SWRB2', 'SWRB3', 'SWRB4'];
  switches.forEach((sw, idx) => {
    const i = 361 + idx;
    const checks = getPreseededChecks(i);
    const { avance, estado } = calcProgressAndState(checks.tendido, checks.conexionado, checks.etiquetado, checks.certificado, checks.validadoSupervisor);
    cables.push({
      id: `COP-ETH-${String(i).padStart(3, '0')}`,
      subestacion: 'SE Copsol 33/220kV',
      tipo: 'Ethernet',
      plano: 'T2025-0174-01-IDCS-CYP-DI-0103',
      pagina: sw === 'SWRB1' ? 11 : sw === 'SWRB2' ? 31 : sw === 'SWRB3' ? 32 : 33,
      areaTablero: 'Switches red',
      origen: sw,
      puertoOrigen: 'Puertos switch',
      destino: 'Red PRP / equipos asociados',
      puertoDestino: '',
      tipoCable: 'Patchcord LAN / fibra según puerto',
      medioConector: 'RSPE35 / Belden',
      cantidadMetros: 1,
      tendido: checks.tendido,
      conexionado: checks.conexionado,
      etiquetado: checks.etiquetado,
      certificado: checks.certificado,
      validadoSupervisor: checks.validadoSupervisor,
      avance,
      estadoGeneral: estado,
      turno: checks.turno,
      responsable: checks.responsable,
      observaciones: checks.obs || 'Switch detectado en plano; completar puertos físicos de terreno.',
      fechaActualizacion: checks.turno ? '2026-06-30' : undefined
    });
  });

  return cables;
}
