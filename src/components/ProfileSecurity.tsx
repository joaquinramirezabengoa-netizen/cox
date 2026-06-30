import React, { useState } from 'react';
import { User } from '../types';
import {
  ShieldCheck,
  User as UserIcon,
  Key,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ProfileSecurityProps {
  currentUser: User | null;
  onChangePassword: (oldPass: string, newPass: string) => Promise<boolean>;
}

export default function ProfileSecurity({ currentUser, onChangePassword }: ProfileSecurityProps) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPass !== confirmPass) {
      setMessage({ text: 'Las contraseñas nuevas no coinciden.', type: 'error' });
      return;
    }

    if (newPass.length < 6) {
      setMessage({ text: 'La contraseña nueva debe tener al menos 6 caracteres.', type: 'error' });
      return;
    }

    const success = await onChangePassword(oldPass, newPass);
    if (success) {
      setMessage({ text: 'Contraseña cambiada exitosamente.', type: 'success' });
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setMessage({ text: 'La contraseña actual es incorrecta o falló la conexión con la base de datos.', type: 'error' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="profile-security-view">
      {/* Profile Details & Permissions */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-teal-400" />
            Perfil de Usuario
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Usuario Activo</span>
              <span className="text-sm font-bold text-slate-200 block mt-0.5">{currentUser?.nombre}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">RUT de Ingreso</span>
              <span className="text-xs font-mono text-slate-300 block mt-0.5">{currentUser?.rut}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Rol Asignado</span>
              <span className="inline-block bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1">
                {currentUser?.rol}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Notas / Observaciones</span>
              <span className="text-xs text-slate-400 block mt-0.5 italic">
                {currentUser?.observaciones || 'Sin observaciones registradas.'}
              </span>
            </div>
          </div>
        </div>

        {/* Roles details list */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            Esquema de Permisos
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850">
              <strong className="text-rose-400">ADMIN / DESARROLLADOR</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">Control absoluto de avance de obra, registro de evidencias y gestión de usuarios del sistema.</p>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850">
              <strong className="text-teal-400">RESPONSABLE</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">Permisos para actualizar checklist de tendido, conexionado, etiquetado y pruebas, además de subir evidencias.</p>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850">
              <strong className="text-sky-400">TURNO</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">Permisos para registrar avances diarios de tendido correspondientes a su cuadrilla.</p>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850">
              <strong className="text-slate-400">VISITA</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">Acceso exclusivo a paneles de métricas, listados de cables y exportación de planillas (sin edición).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Password change form */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            Cambiar Contraseña
          </h3>
          <p className="text-xs text-slate-400">
            Actualiza tu clave única de acceso al sistema para resguardar la seguridad del registro de avances.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {message && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-xs border ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400">Contraseña Actual</label>
                <input
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  placeholder="Ingresa tu clave actual"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/60">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-450 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-teal-500/10"
              >
                <Key className="w-4 h-4" />
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
