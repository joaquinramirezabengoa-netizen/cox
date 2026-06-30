import React, { useState, useEffect } from 'react';
import { Cable, User } from '../types';
import {
  X,
  FileText,
  MapPin,
  Compass,
  FileSpreadsheet,
  Link,
  UploadCloud,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  FileImage,
  User as UserIcon,
  Check
} from 'lucide-react';

interface CableModalProps {
  cable: Cable;
  user: User | null;
  onClose: () => void;
  onSave: (updatedCable: Cable) => void;
}

export default function CableModal({ cable, user, onClose, onSave }: CableModalProps) {
  // Check permission
  const canEdit = user?.puedeEditar || false;
  const isNew = cable.id === '';

  // New specifications states (only for creation)
  const [newId, setNewId] = useState(cable.id || '');
  const [subestacion, setSubestacion] = useState(cable.subestacion || 'SE Carrera Pinto 220kV');
  const [tipo, setTipo] = useState(cable.tipo || 'Fibra Óptica');
  const [plano, setPlano] = useState(cable.plano || '');
  const [pagina, setPagina] = useState(cable.pagina || '');
  const [areaTablero, setAreaTablero] = useState(cable.areaTablero || '');
  const [tipoCable, setTipoCable] = useState(cable.tipoCable || '');
  const [origen, setOrigen] = useState(cable.origen || '');
  const [puertoOrigen, setPuertoOrigen] = useState(cable.puertoOrigen || '');
  const [destino, setDestino] = useState(cable.destino || '');
  const [puertoDestino, setPuertoDestino] = useState(cable.puertoDestino || '');
  const [medioConector, setMedioConector] = useState(cable.medioConector || '');
  const [cantidadMetros, setCantidadMetros] = useState(cable.cantidadMetros || 0);

  // Form states
  const [turno, setTurno] = useState(cable.turno || '');
  const [responsable, setResponsable] = useState(cable.responsable || '');
  const [tendido, setTendido] = useState(cable.tendido);
  const [conexionado, setConexionado] = useState(cable.conexionado);
  const [etiquetado, setEtiquetado] = useState(cable.etiquetado);
  const [certificado, setCertificado] = useState(cable.certificado);
  const [validadoSupervisor, setValidadoSupervisor] = useState(cable.validadoSupervisor);
  const [evidencia, setEvidencia] = useState(cable.evidencia || '');
  const [observaciones, setObservaciones] = useState(cable.observaciones || '');

  // File upload simulator states
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  // Dynamic progress calculator based on current states
  const computedAvance = React.useMemo(() => {
    const steps = [tendido, conexionado, etiquetado, certificado, validadoSupervisor];
    const yesCount = steps.filter(s => s === 'Sí').length;
    const naCount = steps.filter(s => s === 'N/A').length;

    const totalActiveSteps = 5 - naCount;
    if (totalActiveSteps <= 0) return 0;
    return Math.round((yesCount / totalActiveSteps) * 100);
  }, [tendido, conexionado, etiquetado, certificado, validadoSupervisor]);

  // Sync state if cable prop changes
  useEffect(() => {
    setNewId(cable.id || '');
    setSubestacion(cable.subestacion || 'SE Carrera Pinto 220kV');
    setTipo(cable.tipo || 'Fibra Óptica');
    setPlano(cable.plano || '');
    setPagina(cable.pagina || '');
    setAreaTablero(cable.areaTablero || '');
    setTipoCable(cable.tipoCable || '');
    setOrigen(cable.origen || '');
    setPuertoOrigen(cable.puertoOrigen || '');
    setDestino(cable.destino || '');
    setPuertoDestino(cable.puertoDestino || '');
    setMedioConector(cable.medioConector || '');
    setCantidadMetros(cable.cantidadMetros || 0);

    setTurno(cable.turno || '');
    setResponsable(cable.responsable || '');
    setTendido(cable.tendido);
    setConexionado(cable.conexionado);
    setEtiquetado(cable.etiquetado);
    setCertificado(cable.certificado);
    setValidadoSupervisor(cable.validadoSupervisor);
    setEvidencia(cable.evidencia || '');
    setObservaciones(cable.observaciones || '');
    setUploadedFile(null);
  }, [cable]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateUpload(files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateUpload(files[0].name);
    }
  };

  const simulateUpload = (fileName: string) => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadedFile(fileName);
      // Generate mock direct file URL
      const mockUrl = `https://drive.google.com/drive/folders/mock-fo-advances/${fileName.replace(/\s+/g, '_')}`;
      setEvidencia(mockUrl);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (isNew && !newId.trim()) {
      alert('Por favor ingrese un código de circuito válido.');
      return;
    }

    // Calculate dynamic general state
    const steps = [tendido, conexionado, etiquetado, certificado, validadoSupervisor];
    const yesCount = steps.filter(s => s === 'Sí').length;
    const naCount = steps.filter(s => s === 'N/A').length;
    const obsCount = steps.filter(s => s === 'Observado').length;
    const totalActiveSteps = 5 - naCount;

    let estadoGeneral: 'Pendiente' | 'En ejecución' | 'Terminado' | 'Observado' = 'Pendiente';
    if (obsCount > 0) {
      estadoGeneral = 'Observado';
    } else if (yesCount === totalActiveSteps && totalActiveSteps > 0) {
      estadoGeneral = 'Terminado';
    } else if (yesCount > 0 || steps.some(s => s === 'Sí')) {
      estadoGeneral = 'En ejecución';
    }

    onSave({
      id: isNew ? newId.trim().toUpperCase() : cable.id,
      subestacion: isNew ? subestacion : cable.subestacion,
      tipo: isNew ? tipo : cable.tipo,
      plano: isNew ? plano : cable.plano,
      pagina: isNew ? (isNaN(Number(pagina)) ? pagina : Number(pagina)) : cable.pagina,
      areaTablero: isNew ? areaTablero : cable.areaTablero,
      tipoCable: isNew ? tipoCable : cable.tipoCable,
      origen: isNew ? origen : cable.origen,
      puertoOrigen: isNew ? puertoOrigen : cable.puertoOrigen,
      destino: isNew ? destino : cable.destino,
      puertoDestino: isNew ? puertoDestino : cable.puertoDestino,
      medioConector: isNew ? medioConector : cable.medioConector,
      cantidadMetros: isNew ? Number(cantidadMetros) : cable.cantidadMetros,

      turno: turno || undefined,
      responsable: responsable || undefined,
      tendido,
      conexionado,
      etiquetado,
      certificado,
      validadoSupervisor,
      avance: computedAvance,
      estadoGeneral,
      evidencia: evidencia || undefined,
      observaciones: observaciones || undefined,
      fechaActualizacion: new Date().toISOString().slice(0, 10)
    });
  };

  const stepStatusOptions = [
    { value: 'No', label: 'No', style: 'text-slate-400 bg-slate-950/40' },
    { value: 'Sí', label: 'Sí (Completado)', style: 'text-emerald-400 font-bold bg-emerald-500/10' },
    { value: 'Observado', label: 'Observado (Alerta)', style: 'text-rose-400 font-bold bg-rose-500/10' },
    { value: 'N/A', label: 'No Aplica (N/A)', style: 'text-slate-500 bg-slate-950/20' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              {isNew ? (
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded">
                  NUEVO CIRCUITO
                </span>
              ) : (
                <>
                  <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded">
                    {cable.id}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${cable.tipo.toLowerCase().includes('fibra') ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                    {cable.tipo}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-300 mt-1.5">
              {isNew ? 'Registrar Tendido de Circuito en Base de Datos' : cable.subestacion}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content wrap (Scrollable) */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 scrollbar-thin">
          {/* Section 1: Cable Specifications Card */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              Especificaciones y Ruteo de Plano
            </h4>
            
            {isNew ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Código Circuito *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: CP-FO-051"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Subestación</label>
                  <select
                    value={subestacion}
                    onChange={(e) => setSubestacion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="SE Carrera Pinto 220kV">SE Carrera Pinto 220kV</option>
                    <option value="SE Copsol 33/220kV">SE Copsol 33/220kV</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tipo de Circuito</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Fibra Óptica">Fibra Óptica</option>
                    <option value="Ethernet">Ethernet</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Plano de Referencia</label>
                  <input
                    type="text"
                    placeholder="Ej: CP-12-FO-01"
                    value={plano}
                    onChange={(e) => setPlano(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Página Plano</label>
                  <input
                    type="text"
                    placeholder="Ej: 3"
                    value={pagina}
                    onChange={(e) => setPagina(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Área / Tablero</label>
                  <input
                    type="text"
                    placeholder="Ej: ODF-01"
                    value={areaTablero}
                    onChange={(e) => setAreaTablero(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Especificación Cable</label>
                  <input
                    type="text"
                    placeholder="Ej: Multimodo 24 FO"
                    value={tipoCable}
                    onChange={(e) => setTipoCable(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Medio Conector</label>
                  <input
                    type="text"
                    placeholder="Ej: LC-LC / Fusión"
                    value={medioConector}
                    onChange={(e) => setMedioConector(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Equipo Origen</label>
                  <input
                    type="text"
                    placeholder="Ej: Sw-Core-01"
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Puerto Origen</label>
                  <input
                    type="text"
                    placeholder="Ej: Port 24"
                    value={puertoOrigen}
                    onChange={(e) => setPuertoOrigen(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Equipo Destino</label>
                  <input
                    type="text"
                    placeholder="Ej: Sw-Sala-Control"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Puerto Destino</label>
                  <input
                    type="text"
                    placeholder="Ej: Port 1"
                    value={puertoDestino}
                    onChange={(e) => setPuertoDestino(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Cantidad Metros (Aprox.)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 150"
                    value={cantidadMetros || ''}
                    onChange={(e) => setCantidadMetros(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Plano de Referencia</span>
                  <span className="font-mono text-slate-200 block mt-0.5 break-all">{cable.plano}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Página</span>
                  <span className="text-slate-200 font-bold block mt-0.5">{cable.pagina}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Área / Tablero</span>
                  <span className="text-slate-200 block mt-0.5">{cable.areaTablero}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Especificación Cable</span>
                  <span className="text-slate-300 block mt-0.5">{cable.tipoCable}</span>
                </div>

                <div className="border-t border-slate-900 pt-3">
                  <span className="text-slate-500 block">Equipo Origen</span>
                  <span className="text-slate-200 font-semibold block mt-0.5">{cable.origen}</span>
                </div>
                <div className="border-t border-slate-900 pt-3">
                  <span className="text-slate-500 block">Puerto Origen</span>
                  <span className="font-mono text-slate-300 block mt-0.5">{cable.puertoOrigen}</span>
                </div>
                <div className="border-t border-slate-900 pt-3">
                  <span className="text-slate-500 block">Equipo Destino</span>
                  <span className="text-slate-200 font-semibold block mt-0.5">{cable.destino || 'En terreno'}</span>
                </div>
                <div className="border-t border-slate-900 pt-3">
                  <span className="text-slate-500 block">Conector / Medio</span>
                  <span className="text-slate-300 block mt-0.5">{cable.medioConector}</span>
                </div>
              </div>
            )}
          </div>

          {/* Form container */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 2: Progress Checklist */}
            <div className="bg-slate-950/20 rounded-xl border border-slate-800 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  Control de Avance por Etapas de Instalación
                </h4>

                {/* Progress bar and numeric badge */}
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800/85 px-4 py-1.5 rounded-xl">
                  <span className="text-[11px] text-slate-400">Avance Dinámico:</span>
                  <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-sky-500 h-full rounded-full transition-all"
                      style={{ width: `${computedAvance}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-black text-teal-400">{computedAvance}%</span>
                </div>
              </div>

              {/* Steps selection layout */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {/* 1. Tendido */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">1. Tendido Cable</span>
                  <select
                    disabled={!canEdit}
                    value={tendido}
                    onChange={(e) => setTendido(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-200"
                  >
                    {stepStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Conexionado */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">2. Conexionado / Fusión</span>
                  <select
                    disabled={!canEdit}
                    value={conexionado}
                    onChange={(e) => setConexionado(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-200"
                  >
                    {stepStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Etiquetado */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">3. Etiquetado</span>
                  <select
                    disabled={!canEdit}
                    value={etiquetado}
                    onChange={(e) => setEtiquetado(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-200"
                  >
                    {stepStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Certificación */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">4. Prueba / Certif.</span>
                  <select
                    disabled={!canEdit}
                    value={certificado}
                    onChange={(e) => setCertificado(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-200"
                  >
                    {stepStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Validación Supervisor */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">5. Validado Sup.</span>
                  <select
                    disabled={!canEdit}
                    value={validadoSupervisor}
                    onChange={(e) => setValidadoSupervisor(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-200"
                  >
                    {stepStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Responsible & Evidences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Operator details & Observations */}
              <div className="space-y-4">
                <div className="bg-slate-950/20 rounded-xl border border-slate-800 p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-teal-400" />
                    Responsables del Reporte
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 block">Turno Ejecutor</label>
                      <select
                        disabled={!canEdit}
                        value={turno}
                        onChange={(e) => setTurno(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="">Sin turno asignado</option>
                        <option value="Turno A">Turno A (Día)</option>
                        <option value="Turno B">Turno B (Noche)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 block">Nombre Responsable</label>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={responsable}
                        onChange={(e) => setResponsable(e.target.value)}
                        placeholder="Ej: J. Ramírez"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Observations */}
                <div className="bg-slate-950/20 rounded-xl border border-slate-800 p-5 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Observaciones de Campo</label>
                  <textarea
                    disabled={!canEdit}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Detalla cualquier obstrucción en canalizaciones, problemas de espacio en ODF, resultados de atenuación, etc..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                  />
                </div>
              </div>

              {/* File Evidences */}
              <div className="bg-slate-950/20 rounded-xl border border-slate-800 p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-teal-400" />
                  Evidencia Visual (Foto de terreno)
                </h4>

                {/* Drag-and-drop box */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    canEdit
                      ? 'border-slate-800 hover:border-teal-500/50 bg-slate-950/40 cursor-pointer'
                      : 'border-slate-850 bg-slate-950/10 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="file"
                    id="file-input"
                    disabled={!canEdit}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  {uploading ? (
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
                      <p>Subiendo archivo a la carpeta Drive...</p>
                    </div>
                  ) : uploadedFile ? (
                    <div className="space-y-2 text-xs">
                      <FileImage className="w-10 h-10 text-emerald-400 mx-auto" />
                      <p className="font-semibold text-slate-200">¡Foto cargada con éxito!</p>
                      <p className="text-slate-500 text-[10px] truncate">{uploadedFile}</p>
                    </div>
                  ) : (
                    <label htmlFor="file-input" className="space-y-2 text-xs text-slate-400 block cursor-pointer">
                      <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="font-medium text-slate-300">Arrastra una imagen aquí o <span className="text-teal-400 font-bold underline">selecciona archivo</span></p>
                      <p className="text-[10px] text-slate-500">Formatos recomendados: JPEG, PNG o PDF (Max. 5MB)</p>
                    </label>
                  )}
                </div>

                {/* Evidence link URL input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Link className="w-3.5 h-3.5" />
                    Enlace de Carpeta Drive u OTDR
                  </label>
                  <input
                    type="url"
                    disabled={!canEdit}
                    value={evidencia}
                    onChange={(e) => setEvidencia(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {evidencia && (
                    <a
                      href={evidencia}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[11px] text-teal-400 hover:underline pt-1"
                    >
                      Abrir enlace de evidencia externa ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with modal action buttons */}
            <div className="bg-slate-950/60 px-6 py-4 border-t border-slate-800 flex justify-between items-center flex-shrink-0 -mx-6 -mb-6">
              <span className="text-xs text-slate-500">
                {cable.fechaActualizacion
                  ? `Último cambio: ${cable.fechaActualizacion} por ${cable.responsable || 'Equipo'}`
                  : 'Sin modificaciones previas registrada.'}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-all"
                >
                  {canEdit ? 'Cancelar' : 'Cerrar'}
                </button>
                {canEdit && (
                  <button
                    type="submit"
                    className="flex items-center gap-1 bg-teal-500 hover:bg-teal-450 text-slate-950 font-black px-5 py-2 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/15 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
