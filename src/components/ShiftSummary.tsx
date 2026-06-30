import React, { useState, useMemo } from 'react';
import { Cable, HistoryLog, User as UserType } from '../types';
import {
  CalendarDays,
  Clock,
  User,
  GitCommit,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Search,
  ClipboardList,
  Send
} from 'lucide-react';

interface ShiftSummaryProps {
  cables: Cable[];
  historyLogs: HistoryLog[];
  user: UserType | null;
  onAddManualLog?: (log: HistoryLog) => Promise<void>;
}

export default function ShiftSummary({ cables, historyLogs, user, onAddManualLog }: ShiftSummaryProps) {
  const [logSearch, setLogSearch] = useState('');

  // Manual Log Entry form state
  const [selectedCableId, setSelectedCableId] = useState('GENERAL');
  const [logDetail, setLogDetail] = useState('');
  const [logType, setLogType] = useState('INFORMATIVA'); // 'INFORMATIVA' | 'ALERTA'
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const handleManualLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddManualLog || !user || !logDetail.trim()) return;

    setIsSubmittingLog(true);
    try {
      const selectedCableObj = cables.find(c => c.id === selectedCableId);
      const anteriorEstado = selectedCableObj ? selectedCableObj.estadoGeneral : '-';
      const nuevoEstado = logType === 'ALERTA' ? 'Observado' : (selectedCableObj ? selectedCableObj.estadoGeneral : '-');

      const prefix = logType === 'ALERTA' ? '⚠️ [ALERTA DE TERRENO] ' : '📝 [REPORTE DE TURNO] ';

      const newLog: HistoryLog = {
        id: `LOG-MANUAL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        cableId: selectedCableId,
        usuario: user.nombre,
        rut: user.rut,
        rol: user.rol,
        fecha: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        detalle: prefix + logDetail.trim(),
        anteriorEstado,
        nuevoEstado
      };

      await onAddManualLog(newLog);
      setLogDetail('');
      setSelectedCableId('GENERAL');
      setLogType('INFORMATIVA');
    } catch (err) {
      console.error('Error adding manual log:', err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Calculate stats for Turno A vs Turno B safely
  const stats = useMemo(() => {
    const cablesList = Array.isArray(cables) ? cables : [];
    const cablesWithTurno = cablesList.filter(c => c && c.turno);

    const shiftA = cablesWithTurno.filter(c => c && c.turno === 'Turno A');
    const shiftB = cablesWithTurno.filter(c => c && c.turno === 'Turno B');

    const totalA = shiftA.length;
    const totalB = shiftB.length;

    const avgA = totalA ? Math.round(shiftA.reduce((sum, c) => sum + (Number(c.avance) || 0), 0) / totalA) : 0;
    const avgB = totalB ? Math.round(shiftB.reduce((sum, c) => sum + (Number(c.avance) || 0), 0) / totalB) : 0;

    const doneA = shiftA.filter(c => c && c.estadoGeneral === 'Terminado').length;
    const doneB = shiftB.filter(c => c && c.estadoGeneral === 'Terminado').length;

    const obsA = shiftA.filter(c => c && c.estadoGeneral === 'Observado').length;
    const obsB = shiftB.filter(c => c && c.estadoGeneral === 'Observado').length;

    return {
      turnoA: { total: totalA, avg: avgA, done: doneA, obs: obsA },
      turnoB: { total: totalB, avg: avgB, done: doneB, obs: obsB }
    };
  }, [cables]);

  // Filter history logs based on search
  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return historyLogs;
    const q = logSearch.toLowerCase().trim();
    return historyLogs.filter(l =>
      l.cableId.toLowerCase().includes(q) ||
      l.usuario.toLowerCase().includes(q) ||
      l.rol.toLowerCase().includes(q) ||
      l.detalle.toLowerCase().includes(q)
    );
  }, [historyLogs, logSearch]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="shift-summary-view">
      {/* Turnos Side by Side Comparison (Spans 3 on desktop for visual clean) */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Rendimiento Comparativo de Turnos</h2>
            <p className="text-xs text-slate-400 mt-1">
              Análisis comparativo de los avances reportados por las cuadrillas de Turno A y Turno B en terreno.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Turno A Card */}
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-24 bg-gradient-to-r from-teal-500 to-teal-400" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-lg">
                  TURNO A
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Cuadrilla Matutina</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Tendido Total</span>
                  <strong className="text-2xl text-slate-200 block mt-1">{stats.turnoA.total} <span className="text-xs font-normal text-slate-500">u</span></strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Prom. Avance</span>
                  <strong className="text-2xl text-teal-400 block mt-1">{stats.turnoA.avg}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Terminados</span>
                  <strong className="text-2xl text-emerald-400 block mt-1">{stats.turnoA.done}</strong>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="mt-5 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Porcentaje de Avance Promedio</span>
                  <span>{stats.turnoA.avg}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-teal-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.turnoA.avg}%` }}
                  />
                </div>
              </div>

              {/* Stats pill footer */}
              <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between text-xs text-slate-500">
                <span>Cables con alertas: <strong className="text-rose-400">{stats.turnoA.obs}</strong></span>
                <span>Último reporte: Hoy</span>
              </div>
            </div>

            {/* Turno B Card */}
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-24 bg-gradient-to-r from-sky-500 to-sky-400" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-lg">
                  TURNO B
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Cuadrilla Vespertina</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Tendido Total</span>
                  <strong className="text-2xl text-slate-200 block mt-1">{stats.turnoB.total} <span className="text-xs font-normal text-slate-500">u</span></strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Prom. Avance</span>
                  <strong className="text-2xl text-sky-400 block mt-1">{stats.turnoB.avg}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Terminados</span>
                  <strong className="text-2xl text-emerald-400 block mt-1">{stats.turnoB.done}</strong>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="mt-5 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Porcentaje de Avance Promedio</span>
                  <span>{stats.turnoB.avg}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-sky-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.turnoB.avg}%` }}
                  />
                </div>
              </div>

              {/* Stats pill footer */}
              <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between text-xs text-slate-500">
                <span>Cables con alertas: <strong className="text-rose-400">{stats.turnoB.obs}</strong></span>
                <span>Último reporte: Hoy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Manual Log Entry Card (Supervisor and higher only) */}
      {user?.puedeEditar ? (
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-400" />
              Agregar Nota Manual a la Bitácora de Turno
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Registra comentarios, novedades, relevos de turno o alertas de terreno detectadas durante la jornada.
            </p>
          </div>

          <form onSubmit={handleManualLogSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="md:col-span-1 space-y-1.5">
              <label className="text-slate-400 block font-semibold">Circuito Asociado</label>
              <select
                value={selectedCableId}
                onChange={(e) => setSelectedCableId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                <option value="GENERAL">General / No asociado</option>
                {cables.map(c => (
                  <option key={c.id} value={c.id}>{c.id} ({c.subestacion.split(' ')[1] || c.subestacion})</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1 space-y-1.5">
              <label className="text-slate-400 block font-semibold">Clasificación</label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                <option value="INFORMATIVA">📝 Reporte / Nota Informativa</option>
                <option value="ALERTA">⚠️ Alerta / Incidente de Terreno</option>
              </select>
            </div>

            <div className="md:col-span-2 md:row-span-2 space-y-1.5 flex flex-col">
              <label className="text-slate-400 block font-semibold">Detalle del Comentario *</label>
              <div className="flex-1 flex gap-2 items-end">
                <textarea
                  required
                  placeholder="Ej: Se completó tendido de cables entre ODF-1 y ODF-2. El conector fue pulido con éxito..."
                  value={logDetail}
                  onChange={(e) => setLogDetail(e.target.value)}
                  className="flex-1 min-h-[70px] bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none h-full"
                />
                <button
                  type="submit"
                  disabled={isSubmittingLog || !logDetail.trim()}
                  className="bg-teal-500 hover:bg-teal-450 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <Send className="w-4 h-4 text-slate-950 stroke-[2.5px]" />
                  <span>{isSubmittingLog ? 'Registrando...' : 'Registrar'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center text-xs text-slate-500">
          <p>ℹ️ El registro de notas de bitácora y control de terreno está restringido a personal de supervisión activo.</p>
        </div>
      )}

      {/* Audit Log / History View (Full-width inside layout) */}
      <div className="lg:col-span-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-400" />
                Historial de Registro de Avance (Auditoría)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bitácora de modificaciones realizadas en tiempo real por el personal autorizado.
              </p>
            </div>

            {/* Keyword Search inside Logs */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </span>
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Buscar por ID, usuario o detalle..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin registros en la bitácora</p>
                <p className="text-xs text-slate-600 mt-1">Los cambios que realice el equipo aparecerán aquí para auditoría.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const getActionIcon = () => {
                  if (log.nuevoEstado === 'Terminado') {
                    return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
                  } else if (log.nuevoEstado === 'Observado') {
                    return <AlertOctagon className="w-5 h-5 text-rose-400" />;
                  }
                  return <GitCommit className="w-5 h-5 text-teal-400" />;
                };

                return (
                  <div
                    key={log.id}
                    className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/80 hover:border-slate-800 rounded-xl p-4 flex items-start gap-4 transition-all"
                  >
                    <div className="mt-0.5 p-2 bg-slate-900 border border-slate-800 rounded-lg">
                      {getActionIcon()}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-200">
                            {log.cableId}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">|</span>
                          <span className="text-xs text-teal-400 font-semibold flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.usuario} ({log.rol})
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {log.fecha}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {log.detalle}
                      </p>
                      <div className="flex gap-2 text-[10px] font-mono">
                        <span className="text-slate-500">Estado anterior: <strong className="text-slate-400 font-semibold">{log.anteriorEstado}</strong></span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-500">Nuevo: <strong className="text-teal-400 font-semibold">{log.nuevoEstado}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
