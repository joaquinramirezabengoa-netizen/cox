import React, { useState, useMemo } from 'react';
import { Cable, User } from '../types';
import {
  Search,
  Filter,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Zap,
  Network,
  XCircle,
  Eye,
  FileSpreadsheet,
  Plus
} from 'lucide-react';

interface CableTableProps {
  cables: Cable[];
  user: User | null;
  onSelectCable: (cable: Cable) => void;
}

type SortField = 'id' | 'subestacion' | 'tipo' | 'areaTablero' | 'origen' | 'destino' | 'avance' | 'estadoGeneral';
type SortOrder = 'asc' | 'desc';

export default function CableTable({ cables, user, onSelectCable }: CableTableProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [subestacionFilter, setSubestacionFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [turnoFilter, setTurnoFilter] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dynamic filter options based on the full dataset safely
  const subestacionOptions = useMemo(() => {
    const list = Array.isArray(cables) ? cables : [];
    return Array.from(new Set(list.map(c => c && c.subestacion).filter(Boolean))).sort();
  }, [cables]);

  const tipoOptions = useMemo(() => {
    const list = Array.isArray(cables) ? cables : [];
    return Array.from(new Set(list.map(c => c && c.tipo).filter(Boolean))).sort();
  }, [cables]);

  const estadoOptions = ['Pendiente', 'En ejecución', 'Terminado', 'Observado'];
  const turnoOptions = ['Turno A', 'Turno B'];

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and Sort dataset
  const filteredAndSortedCables = useMemo(() => {
    let result = [...cables];

    // Text search filter safely (case insensitive across multiple key fields)
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(c => {
        if (!c) return false;
        const idStr = String(c.id || '').toLowerCase();
        const subestacionStr = String(c.subestacion || '').toLowerCase();
        const areaTableroStr = String(c.areaTablero || '').toLowerCase();
        const origenStr = String(c.origen || '').toLowerCase();
        const destinoStr = String(c.destino || '').toLowerCase();
        const responsableStr = String(c.responsable || '').toLowerCase();
        const observacionesStr = String(c.observaciones || '').toLowerCase();

        return (
          idStr.includes(q) ||
          subestacionStr.includes(q) ||
          areaTableroStr.includes(q) ||
          origenStr.includes(q) ||
          destinoStr.includes(q) ||
          responsableStr.includes(q) ||
          observacionesStr.includes(q)
        );
      });
    }

    // Dropdown filters safely
    if (subestacionFilter) {
      result = result.filter(c => c && c.subestacion === subestacionFilter);
    }
    if (tipoFilter) {
      result = result.filter(c => c && c.tipo === tipoFilter);
    }
    if (estadoFilter) {
      result = result.filter(c => c && c.estadoGeneral === estadoFilter);
    }
    if (turnoFilter) {
      result = result.filter(c => c && c.turno === turnoFilter);
    }

    // Apply sorting safely
    result.sort((a, b) => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;

      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'avance') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [cables, searchTerm, subestacionFilter, tipoFilter, estadoFilter, turnoFilter, sortField, sortOrder]);

  // Pagination bounds
  const totalRows = filteredAndSortedCables.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  const paginatedCables = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedCables.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedCables, currentPage, rowsPerPage]);

  // Sync current page if filters overflow
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Clean all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSubestacionFilter('');
    setTipoFilter('');
    setEstadoFilter('');
    setTurnoFilter('');
    setCurrentPage(1);
  };

  // Export visible items to CSV file
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Subestación',
      'Tipo',
      'Plano',
      'Página',
      'Área / Tablero',
      'Origen',
      'Puerto Origen',
      'Destino',
      'Puerto Destino',
      'Tipo de cable',
      'Medio / Conector',
      'Cantidad / Metros',
      'Turno',
      'Responsable',
      'Tendido',
      'Conexionado/Fusionado',
      'Etiquetado',
      'Certificado/Prueba',
      'Validado Supervisor',
      '% Avance',
      'Estado General',
      'Fecha Actualización',
      'Evidencia (link foto)',
      'Observaciones'
    ];

    const rows = filteredAndSortedCables.map(c => [
      c.id,
      c.subestacion,
      c.tipo,
      c.plano,
      c.pagina,
      c.areaTablero,
      c.origen,
      c.puertoOrigen,
      c.destino,
      c.puertoDestino,
      c.tipoCable,
      c.medioConector,
      c.cantidadMetros,
      c.turno || '',
      c.responsable || '',
      c.tendido,
      c.conexionado,
      c.etiquetado,
      c.certificado,
      c.validadoSupervisor,
      `${c.avance}%`,
      c.estadoGeneral,
      c.fechaActualizacion || '',
      c.evidencia || '',
      (c.observaciones || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(val => `"${val}"`).join(';'))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `control_avance_tendidos_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4" id="table-view">
      {/* Search and Filters Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3" id="filters-toolbar">
        {/* Keyword Search Input */}
        <div className="relative md:col-span-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID, tablero, origen, destino, responsable..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Substation Dropdown */}
        <div className="relative md:col-span-2">
          <select
            value={subestacionFilter}
            onChange={(e) => setSubestacionFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
          >
            <option value="">Todas las subestaciones</option>
            {subestacionOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Cable Type Dropdown */}
        <div className="relative md:col-span-2">
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            {tipoOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* State Dropdown */}
        <div className="relative md:col-span-2">
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {estadoOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Shift Dropdown */}
        <div className="relative md:col-span-2">
          <select
            value={turnoFilter}
            onChange={(e) => setTurnoFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
          >
            <option value="">Todos los turnos</option>
            {turnoOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Stats and Exporter bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
        <div className="text-xs text-slate-400">
          Encontrados: <strong className="text-teal-400">{totalRows}</strong> cables de <span className="text-slate-300 font-semibold">{cables.length}</span> totales
          {(searchTerm || subestacionFilter || tipoFilter || estadoFilter || turnoFilter) && (
            <button
              onClick={handleClearFilters}
              className="ml-3 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-all cursor-pointer underline underline-offset-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {user?.puedeEditar && (
            <button
              onClick={() => {
                const emptyCable: Cable = {
                  id: '',
                  subestacion: 'SE Carrera Pinto 220kV',
                  tipo: 'Fibra Óptica',
                  plano: '',
                  pagina: '',
                  areaTablero: '',
                  origen: '',
                  puertoOrigen: '',
                  destino: '',
                  puertoDestino: '',
                  tipoCable: '',
                  medioConector: '',
                  cantidadMetros: 0,
                  tendido: 'No',
                  conexionado: 'No',
                  etiquetado: 'No',
                  certificado: 'No',
                  validadoSupervisor: 'No',
                  avance: 0,
                  estadoGeneral: 'Pendiente',
                  turno: 'Turno A',
                  responsable: ''
                };
                onSelectCable(emptyCable);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-350 rounded-xl px-3.5 py-1.5 transition-all duration-150 cursor-pointer w-full sm:w-auto justify-center shadow-lg hover:shadow-teal-500/10"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3px]" />
              Agregar Circuito
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-1.5 transition-all duration-150 cursor-pointer w-full sm:w-auto justify-center"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Exportar CSV ({totalRows})
          </button>
        </div>
      </div>

      {/* Responsive Table Wrap */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 select-none">
              <th className="py-3 px-4 font-semibold text-xs font-mono cursor-pointer hover:bg-slate-900" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1.5">ID <ArrowUpDown className="w-3.5 h-3.5 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 font-semibold text-xs cursor-pointer hover:bg-slate-900" onClick={() => handleSort('subestacion')}>
                <div className="flex items-center gap-1.5">Subestación <ArrowUpDown className="w-3.5 h-3.5 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 font-semibold text-xs cursor-pointer hover:bg-slate-900" onClick={() => handleSort('tipo')}>
                <div className="flex items-center gap-1.5">Tipo <ArrowUpDown className="w-3.5 h-3.5 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 font-semibold text-xs cursor-pointer hover:bg-slate-900" onClick={() => handleSort('areaTablero')}>
                <div className="flex items-center gap-1.5">Área / Tablero <ArrowUpDown className="w-3.5 h-3.5 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 font-semibold text-xs cursor-pointer hover:bg-slate-900" onClick={() => handleSort('origen')}>
                <div className="flex items-center gap-1.5">Origen <ArrowUpDown className="w-3.5 h-3.5 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 font-semibold text-xs">Pto. Origen</th>
              <th className="py-3 px-4 font-semibold text-xs cursor-pointer hover:bg-slate-900" onClick={() => handleSort('destino')}>
                <div className="flex items-center gap-1.5">Destino <ArrowUpDown className="w-3.5 h-3.5 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 font-semibold text-xs cursor-pointer hover:bg-slate-900" onClick={() => handleSort('avance')}>
                <div className="flex items-center gap-1.5">Avance <ArrowUpDown className="w-3.5 h-3.5 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 font-semibold text-xs cursor-pointer hover:bg-slate-900" onClick={() => handleSort('estadoGeneral')}>
                <div className="flex items-center gap-1.5">Estado <ArrowUpDown className="w-3.5 h-3.5 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 font-semibold text-xs text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {paginatedCables.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <XCircle className="w-10 h-10 mx-auto text-rose-500 opacity-40 mb-2" />
                  <p className="text-sm font-semibold">No se encontraron cables</p>
                  <p className="text-xs">Intente cambiando los términos de búsqueda o filtros.</p>
                </td>
              </tr>
            ) : (
              paginatedCables.map((cable) => {
                const isFiber = cable.tipo.toLowerCase().includes('fibra');
                const stateColors = {
                  'Terminado': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  'En ejecución': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                  'Pendiente': 'bg-slate-800 text-slate-400 border-slate-700/50',
                  'Observado': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                };

                return (
                  <tr key={cable.id} className="hover:bg-slate-800/45 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-300">
                      {cable.id}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-[150px] truncate">
                      {cable.subestacion}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] ${isFiber ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                        {isFiber ? <Zap className="w-3 h-3" /> : <Network className="w-3 h-3" />}
                        {cable.tipo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-[150px] truncate" title={cable.areaTablero}>
                      {cable.areaTablero}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-[120px] truncate" title={cable.origen}>
                      {cable.origen}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-[110px] truncate" title={cable.puertoOrigen}>
                      {cable.puertoOrigen}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-[120px] truncate" title={cable.destino}>
                      {cable.destino}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-sky-500 h-full rounded-full"
                            style={{ width: `${cable.avance}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300 font-bold">{cable.avance}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${stateColors[cable.estadoGeneral]}`}>
                        {cable.estadoGeneral}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onSelectCable(cable)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          user?.puedeEditar
                            ? 'bg-teal-500 hover:bg-teal-450 text-slate-950 hover:shadow-lg'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                        }`}
                      >
                        {user?.puedeEditar ? (
                          <>Actualizar</>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-800" id="pagination-controls">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filas por página:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 appearance-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">
            Mostrando <strong className="text-slate-200">{(currentPage - 1) * rowsPerPage + 1}</strong> - <strong className="text-slate-200">{Math.min(currentPage * rowsPerPage, totalRows)}</strong> de <strong className="text-slate-200">{totalRows}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:text-slate-400 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-300 font-medium px-2">
              Pág. {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:text-slate-400 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
