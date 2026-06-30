import React, { useState } from 'react';
import { Cable } from '../types';
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  Layers,
  Network,
  Zap,
  Database,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardProps {
  cables: Cable[];
  onSelectCable: (cable: Cable) => void;
  onReSeedDatabase?: () => Promise<void>;
}

export default function Dashboard({ cables, onSelectCable, onReSeedDatabase }: DashboardProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Aggregate KPIs safely
  const totalCables = Array.isArray(cables) ? cables.length : 0;
  const avgProgress = totalCables
    ? Math.round(cables.reduce((acc, c) => acc + (Number(c.avance) || 0), 0) / totalCables)
    : 0;

  const fiberCables = cables.filter(c => c && c.tipo && typeof c.tipo === 'string' && c.tipo.toLowerCase().includes('fibra'));
  const ethCables = cables.filter(c => c && c.tipo && typeof c.tipo === 'string' && c.tipo.toLowerCase().includes('ethernet'));

  const avgFiber = fiberCables.length
    ? Math.round(fiberCables.reduce((acc, c) => acc + (Number(c.avance) || 0), 0) / fiberCables.length)
    : 0;
  const avgEth = ethCables.length
    ? Math.round(ethCables.reduce((acc, c) => acc + (Number(c.avance) || 0), 0) / ethCables.length)
    : 0;

  // Status distributions safely
  const pendingCount = cables.filter(c => c && c.estadoGeneral === 'Pendiente').length;
  const inProgressCount = cables.filter(c => c && c.estadoGeneral === 'En ejecución').length;
  const doneCount = cables.filter(c => c && c.estadoGeneral === 'Terminado').length;
  const obsCount = cables.filter(c => c && c.estadoGeneral === 'Observado').length;

  const statusPieData = [
    { name: 'Terminados', value: doneCount, color: '#10b981' }, // emerald-500
    { name: 'En Ejecución', value: inProgressCount, color: '#0ea5e9' }, // sky-500
    { name: 'Pendientes', value: pendingCount, color: '#94a3b8' }, // slate-400
    { name: 'Observados', value: obsCount, color: '#ef4444' } // red-500
  ].filter(d => d.value > 0);

  // Substation progress safely
  const cpCables = cables.filter(c => c && c.subestacion && typeof c.subestacion === 'string' && c.subestacion.includes('Carrera Pinto'));
  const copCables = cables.filter(c => c && c.subestacion && typeof c.subestacion === 'string' && c.subestacion.includes('Copsol'));

  const cpAvg = cpCables.length
    ? Math.round(cpCables.reduce((acc, c) => acc + (Number(c.avance) || 0), 0) / cpCables.length)
    : 0;
  const copAvg = copCables.length
    ? Math.round(copCables.reduce((acc, c) => acc + (Number(c.avance) || 0), 0) / copCables.length)
    : 0;

  const substationData = [
    { name: 'SE Carrera Pinto 220kV', 'Avance %': cpAvg, cables: cpCables.length },
    { name: 'SE Copsol 33/220kV', 'Avance %': copAvg, cables: copCables.length }
  ];

  // ODF / Area level progress safely
  const cpAreas = Array.from(new Set(cpCables.map(c => c.areaTablero || 'Otros'))).filter(Boolean);
  const copAreas = Array.from(new Set(copCables.map(c => c.areaTablero || 'Otros'))).filter(Boolean);

  const areaProgressData = [...cpAreas, ...copAreas].map(area => {
    const areaCables = cables.filter(c => c && (c.areaTablero || 'Otros') === area);
    const avg = areaCables.length
      ? Math.round(areaCables.reduce((acc, c) => acc + (Number(c.avance) || 0), 0) / areaCables.length)
      : 0;
    const cleanAreaName = area ? String(area) : 'Otros';
    return {
      area: cleanAreaName.length > 25 ? cleanAreaName.substring(0, 25) + '...' : cleanAreaName,
      'Avance %': avg,
      cables: areaCables.length
    };
  }).sort((a, b) => b['Avance %'] - a['Avance %']);

  // Critical/Observed items list (limit to 8) safely
  const criticalCables = cables
    .filter(c => c && c.estadoGeneral === 'Observado')
    .slice(0, 8);

  const pendingCables = cables
    .filter(c => c && c.estadoGeneral === 'Pendiente')
    .slice(0, 8);

  return (
    <div className="space-y-6" id="dashboard-view">
      {totalCables === 0 && (
        <div className="bg-slate-900 border-2 border-dashed border-teal-500/30 rounded-3xl p-8 text-center space-y-5 shadow-xl relative overflow-hidden" id="onboarding-seed-banner">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-md mx-auto space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
              <Database className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">¡Inicialización del Sistema Requerida!</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              La base de datos de Firebase actualmente no tiene circuitos registrados. Puedes inicializarla y sembrar todo el set de cables de subestaciones estándar en un segundo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              disabled={isInitializing}
              onClick={async () => {
                if (onReSeedDatabase) {
                  setIsInitializing(true);
                  try {
                    await onReSeedDatabase();
                    setSuccessMsg(true);
                  } catch (err) {
                    console.error("Initialization seed failed:", err);
                  } finally {
                    setIsInitializing(false);
                  }
                }
              }}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-teal-500/15"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Cargando Base de Datos...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Sembrar Datos de Subestaciones (Inicializar 0)
                </>
              )}
            </button>
          </div>
          {successMsg && (
            <p className="text-xs text-emerald-400 font-semibold animate-pulse">
              ¡Base de datos cargada correctamente! Los circuitos de Carrera Pinto y Copsol ya están listos.
            </p>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* Total Item Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden" id="kpi-total">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-3 translate-y-3">
            <Layers className="w-36 h-36 text-teal-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Total de Tendidos</p>
              <h3 className="text-3xl font-bold text-white mt-1">{totalCables}</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Network className="w-3 h-3 text-teal-500" />
                Fibra y Ethernet programados
              </p>
            </div>
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
              <Layers className="w-6 h-6 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden" id="kpi-progress">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-3 translate-y-3">
            <Award className="w-36 h-36 text-teal-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Avance General</p>
              <h3 className="text-3xl font-bold text-white mt-1">{avgProgress}%</h3>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-sky-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
            </div>
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
              <Award className="w-6 h-6 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Fiber Progress Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden" id="kpi-fibra">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-3 translate-y-3">
            <Zap className="w-36 h-36 text-amber-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Fibra Óptica (F.O.)</p>
              <h3 className="text-3xl font-bold text-white mt-1">{avgFiber}%</h3>
              <p className="text-xs text-slate-500 mt-1">{fiberCables.length} cables programados</p>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${avgFiber}%` }}
                />
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Ethernet Progress Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden" id="kpi-ethernet">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-3 translate-y-3">
            <Network className="w-36 h-36 text-sky-400" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Ethernet</p>
              <h3 className="text-3xl font-bold text-white mt-1">{avgEth}%</h3>
              <p className="text-xs text-slate-500 mt-1">{ethCables.length} cables programados</p>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${avgEth}%` }}
                />
              </div>
            </div>
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
              <Network className="w-6 h-6 text-sky-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-grid">
        {/* Substation Progress Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            Avance por Subestación
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={substationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="Avance %" fill="url(#substColor)" radius={[8, 8, 0, 0]}>
                  {substationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#14b8a6' : '#0ea5e9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-800/80 pt-4">
            <div className="text-center">
              <span className="text-xs text-slate-400">SE Carrera Pinto</span>
              <p className="text-lg font-bold text-teal-400">{cpAvg}% <span className="text-xs font-normal text-slate-500">({cpCables.length} cables)</span></p>
            </div>
            <div className="text-center">
              <span className="text-xs text-slate-400">SE Copsol</span>
              <p className="text-lg font-bold text-sky-400">{copAvg}% <span className="text-xs font-normal text-slate-500">({copCables.length} cables)</span></p>
            </div>
          </div>
        </div>

        {/* Status Share Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            Estado General de Trabajos
          </h3>
          <div className="h-60 flex justify-center items-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col justify-center items-center pointer-events-none">
              <span className="text-xs text-slate-500">COMPLETADO</span>
              <span className="text-2xl font-black text-slate-200">
                {totalCables ? Math.round((doneCount / totalCables) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-2 border-t border-slate-800 pt-3">
            {statusPieData.map((st, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                <span className="truncate">{st.name}: <strong>{st.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic List and Alert Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="critical-items-view">
        {/* Critical / Observed Cables List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Observados en Terreno ({criticalCables.length})
            </h3>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
            {criticalCables.length === 0 ? (
              <div className="text-center py-10 text-slate-500 flex flex-col items-center justify-center">
                <CheckCircle className="w-12 h-12 text-teal-500 opacity-40 mb-2" />
                <p className="text-sm font-medium">¡Excelente!</p>
                <p className="text-xs">No hay cables reportados con observaciones actualmente.</p>
              </div>
            ) : (
              criticalCables.map(cable => (
                <div
                  key={cable.id}
                  onClick={() => onSelectCable(cable)}
                  className="bg-slate-800/40 hover:bg-slate-800 border border-red-500/20 hover:border-red-500/40 rounded-xl p-3 cursor-pointer transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                      {cable.id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Pág. {cable.pagina}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 mt-2 line-clamp-1">{cable.areaTablero}</h4>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {cable.origen} → {cable.destino}
                  </p>
                  <div className="mt-2 bg-red-950/30 border border-red-900/30 text-red-300 p-2 rounded-lg text-xs leading-relaxed italic">
                    {cable.observaciones || 'Reportado como observado.'}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-mono">
                    <span>{cable.responsable || 'Sin responsable'}</span>
                    <span>{cable.turno || ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Areas / Tasks List Ranking */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-1">
          <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            Avance por Componentes ({areaProgressData.length})
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
            {areaProgressData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <span className="truncate pr-2 font-medium">{item.area}</span>
                  <span className="text-slate-400">{item['Avance %']}% <span className="text-[10px] text-slate-500">({item.cables} u)</span></span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full`}
                    style={{
                      width: `${item['Avance %']}%`,
                      backgroundColor: item['Avance %'] > 80 ? '#10b981' : item['Avance %'] > 40 ? '#0ea5e9' : '#b45309'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks Quick List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-1">
          <h3 className="text-base font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Pendientes Recientes ({pendingCables.length})
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
            {pendingCables.length === 0 ? (
              <div className="text-center py-10 text-slate-500 flex flex-col items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 opacity-40 mb-2" />
                <p className="text-sm font-medium">¡Al día!</p>
                <p className="text-xs">No quedan tareas pendientes en el rango de visibilidad.</p>
              </div>
            ) : (
              pendingCables.map(cable => (
                <div
                  key={cable.id}
                  onClick={() => onSelectCable(cable)}
                  className="bg-slate-800/30 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-3 cursor-pointer transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-700/30 px-2 py-0.5 rounded">
                      {cable.id}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {cable.tipo}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300 mt-2 line-clamp-1">{cable.areaTablero}</h4>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {cable.origen} → {cable.destino}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500">
                    <span>{cable.subestacion}</span>
                    <span className="text-teal-400 hover:underline">Ver detalle</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
