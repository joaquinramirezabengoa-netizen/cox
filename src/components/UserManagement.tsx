import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  UserPlus,
  ShieldAlert,
  UserCheck,
  UserX,
  Edit,
  Lock,
  FileText,
  AlertTriangle,
  RotateCcw,
  Database,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  currentUser: User | null;
  onSaveUser: (user: User) => void;
  onToggleUserStatus: (rut: string) => void;
  onResetProgressZero?: () => Promise<void>;
  onReSeedDatabase?: () => Promise<void>;
}

export default function UserManagement({
  users,
  currentUser,
  onSaveUser,
  onToggleUserStatus,
  onResetProgressZero,
  onReSeedDatabase
}: UserManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Danger zone action loading states
  const [isResetting, setIsResetting] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reset' | 'reseed' | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [rol, setRol] = useState<UserRole>('TURNO');
  const [activo, setActivo] = useState<'SÍ' | 'NO'>('SÍ');
  const [clave, setClave] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Validate permission
  const canManage = currentUser?.rol === 'ADMIN' || currentUser?.rol === 'DESARROLLADOR';

  const handleOpenCreate = () => {
    setEditingUser(null);
    setNombre('');
    setRut('');
    setRol('TURNO');
    setActivo('SÍ');
    setClave('');
    setObservaciones('');
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setNombre(u.nombre);
    setRut(u.rut);
    setRol(u.rol);
    setActivo(u.activo);
    setClave(u.clave || '');
    setObservaciones(u.observaciones || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !rut.trim()) return;

    // Define canEdit based on role selection
    const puedeEditar = rol !== 'VISITA';

    onSaveUser({
      nombre: nombre.trim(),
      rut: rut.trim(),
      rol,
      activo,
      puedeEditar,
      clave: clave || undefined,
      observaciones: observaciones.trim()
    });

    setShowModal(false);
  };

  if (!canManage) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto mt-10">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-200">Acceso Restringido</h3>
        <p className="text-slate-400 text-sm mt-2">
          Solo los roles de <strong className="text-teal-400">ADMINISTRADOR</strong> o <strong className="text-sky-400">DESARROLLADOR</strong> están autorizados para administrar cuentas de usuario del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="user-management-view">
      {/* Head section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-slate-200">Administración de Usuarios</h2>
          <p className="text-slate-400 text-xs mt-1">
            Crea, edita y gestiona las credenciales y permisos de acceso para supervisores de turno y visitas de terreno.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-450 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/10 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Nuevo Usuario
        </button>
      </div>

      {/* Users table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 text-xs font-semibold uppercase">
                <th className="py-3.5 px-4">Nombre Completo</th>
                <th className="py-3.5 px-4">RUT (ID de Ingreso)</th>
                <th className="py-3.5 px-4">Rol del Sistema</th>
                <th className="py-3.5 px-4">Acceso</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Observaciones</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-xs text-slate-300">
              {users.map((u) => {
                const roleColors = {
                  'ADMIN': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  'DESARROLLADOR': 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
                  'RESPONSABLE': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                  'TURNO': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                  'VISITA': 'bg-slate-800 text-slate-400 border-slate-700/60'
                };

                return (
                  <tr key={u.rut} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {u.nombre}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {u.rut}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleColors[u.rol]}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {u.puedeEditar ? (
                        <span className="text-emerald-400">Modifica Avances</span>
                      ) : (
                        <span className="text-slate-400">Solo Visualiza</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onToggleUserStatus(u.rut)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-[11px] cursor-pointer transition-all ${
                          u.activo === 'SÍ'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                        title="Click para cambiar estado"
                      >
                        {u.activo === 'SÍ' ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Activo
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-400 italic">
                      {u.observaciones || 'Sin comentarios.'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-all cursor-pointer inline-flex items-center gap-1 text-xs"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. DANGER ZONE - START FROM ZERO (ADMINS/DESARROLLADORES ONLY) */}
      <div className="bg-slate-900 border border-rose-950/40 rounded-2xl p-6 shadow-xl space-y-4" id="admin-danger-zone">
        <div className="flex items-center gap-2.5 border-b border-rose-950/30 pb-3">
          <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
          <div>
            <h3 className="text-base font-bold text-slate-200">Zona de Peligro: Empezar de Cero</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Herramientas de administración global para reiniciar el avance del proyecto o re-inicializar el almacenamiento de datos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
          {/* Action 1: Reset Progress to 0% */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4.5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                <RotateCcw className="w-4 h-4 text-rose-500" />
                Reiniciar Avance a 0%
              </div>
              <p className="text-slate-400 leading-relaxed">
                Establece el estado de todos los circuitos a <strong>"Pendiente"</strong> y su avance a <strong>0%</strong> (Tendido=No, Conexionado=No, etc.). Útil para comenzar un nuevo hito de obras o limpiar datos de prueba.
              </p>
              <p className="text-slate-500 text-[11px] italic">
                * Las cuentas de usuario y los circuitos se mantendrán intactos. Registra una nota en la bitácora.
              </p>
            </div>
            <button
              onClick={() => setConfirmAction('reset')}
              className="w-full sm:w-auto self-start mt-2 px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-black rounded-xl text-xs transition-all border border-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Progreso de Circuitos
            </button>
          </div>

          {/* Action 2: Hard Reseed Database */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4.5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                <Database className="w-4 h-4 text-rose-500" />
                Borrar y Re-Sembrar Base de Datos
              </div>
              <p className="text-slate-400 leading-relaxed">
                Elimina <strong>TODOS</strong> los circuitos, usuarios y bitácoras de la base de datos de Firebase, y carga el set de datos inicial estándar de COX. Ideal si cambiaste de base de datos o quieres un inicio limpio.
              </p>
              <p className="text-slate-500 text-[11px] italic">
                * Acción irreversible. Sobreescribirá cualquier cambio manual en la base de datos <strong>coxavance</strong>.
              </p>
            </div>
            <button
              onClick={() => setConfirmAction('reseed')}
              className="w-full sm:w-auto self-start mt-2 px-4 py-2.5 bg-rose-950/60 hover:bg-rose-600 text-rose-400 hover:text-white font-black rounded-xl text-xs transition-all border border-rose-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Borrar y Re-Sembrar Todo
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODALS FOR PRESTIGE USER EXPERIENCE */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-500 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-200">
                  {confirmAction === 'reset' ? '¿Confirmar Reinicio de Avance?' : '¿Confirmar Borrado y Re-Sembrado?'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {confirmAction === 'reset'
                    ? 'Esta acción reiniciará el avance de todos los circuitos a "Pendiente" (0%). ¿Estás absolutamente seguro de que deseas continuar?'
                    : 'Esta acción borrará por completo las colecciones de cables, usuarios e historial en Firebase, restableciendo el sistema al estado inicial de fábrica. Esta operación no se puede deshacer.'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isResetting || isReseeding}
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isResetting || isReseeding}
                onClick={async () => {
                  if (confirmAction === 'reset' && onResetProgressZero) {
                    setIsResetting(true);
                    try {
                      await onResetProgressZero();
                    } catch (err) {
                      console.error('Error resetting progress:', err);
                    } finally {
                      setIsResetting(false);
                      setConfirmAction(null);
                    }
                  } else if (confirmAction === 'reseed' && onReSeedDatabase) {
                    setIsReseeding(true);
                    try {
                      await onReSeedDatabase();
                    } catch (err) {
                      console.error('Error re-seeding:', err);
                    } finally {
                      setIsReseeding(false);
                      setConfirmAction(null);
                    }
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-slate-950 hover:text-white font-extrabold rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/15"
              >
                {(isResetting || isReseeding) ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar y Proceder'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200">
                {editingUser ? 'Editar Cuenta de Usuario' : 'Registrar Nuevo Usuario'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Pedro Martínez G."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* RUT */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">RUT (Usuario de Ingreso)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="Ej: 12.345.678-9"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-55 disabled:cursor-not-allowed"
                />
                {!editingUser && (
                  <p className="text-[10px] text-slate-500">Este valor se usará para iniciar sesión y registrar el historial.</p>
                )}
              </div>

              {/* Rol */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Rol de Operación</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN (Acceso Total)</option>
                  <option value="DESARROLLADOR">DESARROLLADOR (Acceso Total)</option>
                  <option value="RESPONSABLE">RESPONSABLE (Avance + Terreno)</option>
                  <option value="TURNO">TURNO (Avance de Turno)</option>
                  <option value="VISITA">VISITA (Solo Lectura)</option>
                </select>
              </div>

              {/* Activo / Inactivo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Estado de Cuenta</label>
                <select
                  value={activo}
                  onChange={(e) => setActivo(e.target.value as 'SÍ' | 'NO')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="SÍ">Activo (SÍ)</option>
                  <option value="NO">Bloqueado / Suspendido (NO)</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {editingUser ? 'Nueva Clave (Opcional)' : 'Clave de Acceso'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder={editingUser ? 'Dejar en blanco para mantener' : 'Ej: TurnoA123*'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Observaciones */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas internas..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Actions footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-450 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-teal-500/10"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
