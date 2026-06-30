import React, { useState, useEffect } from 'react';
import { Cable, User, HistoryLog } from './types';
import { getInitialCables } from './data/cablesData';
import { INITIAL_USERS } from './data/usersData';

// Import subcomponents
import Dashboard from './components/Dashboard';
import CableTable from './components/CableTable';
import UserManagement from './components/UserManagement';
import ShiftSummary from './components/ShiftSummary';
import ProfileSecurity from './components/ProfileSecurity';
import CableModal from './components/CableModal';
import CoxLogo from './components/CoxLogo';

// Import Firebase config & helpers
import { 
  db, 
  auth, 
  googleProvider, 
  seedDatabaseIfEmpty, 
  testConnection, 
  handleFirestoreError, 
  OperationType,
  cleanUndefined,
  forceReSeedDatabase,
  resetAllCablesProgress
} from './lib/firebase';
import { 
  onSnapshot, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  query 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// Import Icons
import {
  LayoutDashboard,
  TableProperties,
  ClipboardList,
  Users,
  ShieldCheck,
  LogOut,
  Zap,
  Network,
  Activity,
  CheckCircle,
  RefreshCw,
  Lock,
  ChevronRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export default function App() {
  // Global States (synchronized from Firestore in real-time)
  const [cables, setCables] = useState<Cable[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cp_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to initialize session from localStorage:", e);
    }
    return null;
  });

  // Authentication & Loading states
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // UI Navigation / Modal States
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'tendidos' | 'turnos' | 'usuarios' | 'seguridad'>('dashboard');
  const [selectedCable, setSelectedCable] = useState<Cable | null>(null);

  // Login form states
  const [rutInput, setRutInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Auto-refresh simulation state
  const [secondsToRefresh, setSecondsToRefresh] = useState(30);

  // 1. Initial Seeding, Connection test and Firebase Auth state tracking
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIsAuthLoading(false);
    }, 1500);

    const initializeAppBackend = async () => {
      try {
        await testConnection();
        await seedDatabaseIfEmpty();
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initializeAppBackend();

    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      clearTimeout(fallbackTimer);
      setFirebaseUser(fUser);
      
      if (fUser) {
        if (fUser.email) {
          // If logged in via Google, fetch/sync profile from DB
          try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const allUsers = usersSnap.docs.map(d => d.data() as User);
            let foundUser = allUsers.find(u => u.email?.toLowerCase() === fUser.email?.toLowerCase());
            const isAdminEmail = fUser.email.toLowerCase() === 'joaquinramirez.abengoa@gmail.com';
            
            if (foundUser) {
              if (isAdminEmail && (foundUser.rol !== 'ADMIN' || !foundUser.puedeEditar)) {
                foundUser.rol = 'ADMIN';
                foundUser.puedeEditar = true;
                foundUser.activo = 'SÍ';
                await setDoc(doc(db, 'users', foundUser.rut), cleanUndefined(foundUser));
              }
              setCurrentUser(foundUser);
              localStorage.setItem('cp_session', JSON.stringify(foundUser));
            } else {
              // Auto-register
              const placeholderRut = isAdminEmail ? '11111111-1' : 'G-' + fUser.uid.substring(0, 8).toUpperCase();
              const newUser: User = {
                nombre: fUser.displayName || (isAdminEmail ? 'Joaquín Ramírez' : 'Usuario Google'),
                rut: placeholderRut,
                rol: isAdminEmail ? 'ADMIN' : 'VISITA',
                activo: 'SÍ',
                puedeEditar: isAdminEmail ? true : false,
                email: fUser.email,
                ultimoLogin: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
                observaciones: isAdminEmail ? 'Administrador principal (Auto-vinculado Google)' : 'Auto-registrado via Google Sign-In'
              };
              await setDoc(doc(db, 'users', placeholderRut), cleanUndefined(newUser));
              setCurrentUser(newUser);
              localStorage.setItem('cp_session', JSON.stringify(newUser));
            }
          } catch (err) {
            console.error('Error finding Google user profile:', err);
          }
        } else {
          // Anonymous login (corresponds to RUT/password session)
          const savedSession = localStorage.getItem('cp_session');
          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession);
              if (parsed && typeof parsed === 'object') {
                setCurrentUser(parsed);
              }
            } catch (e) {}
          }
        }
      } else {
        // fUser is null (no Firebase session)
        // If there's an active local session (which contains a password or is RUT/Password based), keep it!
        // Only log out if it was a Google session (had email but no local password)
        const savedSession = localStorage.getItem('cp_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed && parsed.email && !parsed.clave) {
              // Google session is logged out
              setCurrentUser(null);
              localStorage.removeItem('cp_session');
            } else if (parsed && typeof parsed === 'object') {
              // Local RUT/Password user: keep them logged in!
              setCurrentUser(parsed);
            }
          } catch (e) {
            setCurrentUser(null);
            localStorage.removeItem('cp_session');
          }
        } else {
          setCurrentUser(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // 2. Real-time Firestore synchronized listeners (active when signed in to Firebase OR logged in as local user)
  useEffect(() => {
    if (!firebaseUser && !currentUser) {
      setCables([]);
      setUsers([]);
      setHistoryLogs([]);
      return;
    }

    const unsubscribeCables = onSnapshot(collection(db, 'cables'), (snapshot) => {
      const loadedCables: Cable[] = [];
      snapshot.forEach((d) => {
        loadedCables.push(d.data() as Cable);
      });
      loadedCables.sort((a, b) => a.id.localeCompare(b.id));
      setCables(loadedCables);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'cables');
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const loadedUsers: User[] = [];
      snapshot.forEach((d) => {
        loadedUsers.push(d.data() as User);
      });
      setUsers(loadedUsers);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const unsubscribeLogs = onSnapshot(collection(db, 'historyLogs'), (snapshot) => {
      const loadedLogs: HistoryLog[] = [];
      snapshot.forEach((d) => {
        loadedLogs.push(d.data() as HistoryLog);
      });
      // Sort logs descending
      loadedLogs.sort((a, b) => b.id.localeCompare(a.id));
      setHistoryLogs(loadedLogs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'historyLogs');
    });

    return () => {
      unsubscribeCables();
      unsubscribeUsers();
      unsubscribeLogs();
    };
  }, [firebaseUser, currentUser]);

  // 3. Simulated Auto-refresh Counter
  useEffect(() => {
    if (!currentUser) return;

    const timer = setInterval(() => {
      setSecondsToRefresh(prev => {
        if (prev <= 1) {
          console.log('Autorefresh: Sincronizando avance con la central...');
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser]);

  // Manual Trigger Refresh
  const handleManualRefresh = () => {
    setSecondsToRefresh(30);
    const btn = document.getElementById('refresh-btn');
    if (btn) {
      btn.classList.add('animate-spin');
      setTimeout(() => btn.classList.remove('animate-spin'), 600);
    }
  };

  // 4. Authenticate Handlers (RUT + Clave using Firestore & Anonymous Firebase Auth)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanRut = rutInput.trim();
    if (!cleanRut || !passwordInput) {
      setLoginError('RUT y Contraseña son requeridos.');
      return;
    }

    try {
      // 1. Try to sign in anonymously to satisfy any default rules
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn("Anonymous login skipped or not allowed, continuing login with public rules:", authErr);
      }

      // 2. Try fetching the user profile from users collection
      let foundUser: User | undefined;
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map(d => d.data() as User);
        foundUser = allUsers.find(u => u.rut === cleanRut && u.clave === passwordInput);
      } catch (dbErr) {
        console.warn("Could not read users from Firestore, will attempt local fallback:", dbErr);
      }

      // Fallback to hardcoded INITIAL_USERS if not found in DB or if DB fetch failed
      if (!foundUser) {
        foundUser = INITIAL_USERS.find(u => u.rut === cleanRut && u.clave === passwordInput);
      }

      if (!foundUser) {
        setLoginError('RUT o Contraseña incorrectos.');
        await signOut(auth);
        return;
      }

      if (foundUser.activo === 'NO') {
        setLoginError('Esta cuenta de usuario ha sido desactivada por el administrador.');
        await signOut(auth);
        return;
      }

      // 3. Successful login: update the timestamp
      const updatedUser: User = {
        ...foundUser,
        ultimoLogin: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      };

      // Try saving to database in the background, but do not block login if it fails
      try {
        await setDoc(doc(db, 'users', cleanRut), cleanUndefined(updatedUser));
      } catch (syncErr) {
        console.warn("Could not sync logged-in user profile to Firestore:", syncErr);
      }

      setCurrentUser(updatedUser);
      localStorage.setItem('cp_session', JSON.stringify(updatedUser));
      setRutInput('');
      setPasswordInput('');
    } catch (error) {
      console.error('Login error:', error);
      // Even in case of a fatal error, try a purely local authentication if they entered valid credentials
      const localUser = INITIAL_USERS.find(u => u.rut === cleanRut && u.clave === passwordInput);
      if (localUser && localUser.activo === 'SÍ') {
        const updatedUser: User = {
          ...localUser,
          ultimoLogin: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('cp_session', JSON.stringify(updatedUser));
        setRutInput('');
        setPasswordInput('');
      } else {
        setLoginError('Error de red. No se pudo validar sus credenciales.');
      }
    }
  };

  // 4b. Google Sign-In with Automatic Visita role registration
  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fUser = result.user;

      if (!fUser || !fUser.email) {
        setLoginError('No se pudo recibir un correo válido de Google.');
        return;
      }

      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => d.data() as User);
      let foundUser = allUsers.find(u => u.email?.toLowerCase() === fUser.email?.toLowerCase());

      const isAdminEmail = fUser.email.toLowerCase() === 'joaquinramirez.abengoa@gmail.com';

      if (!foundUser) {
        // Register new profile automatically
        const placeholderRut = isAdminEmail ? '11111111-1' : 'G-' + fUser.uid.substring(0, 8).toUpperCase();
        foundUser = {
          nombre: fUser.displayName || (isAdminEmail ? 'Joaquín Ramírez' : 'Usuario Google'),
          rut: placeholderRut,
          rol: isAdminEmail ? 'ADMIN' : 'VISITA',
          activo: 'SÍ',
          puedeEditar: isAdminEmail ? true : false,
          email: fUser.email,
          ultimoLogin: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          observaciones: isAdminEmail ? 'Administrador principal (Auto-vinculado Google)' : 'Auto-registrado via Google Sign-In'
        };
        await setDoc(doc(db, 'users', placeholderRut), cleanUndefined(foundUser));
      } else {
        // Update profile
        if (isAdminEmail && (foundUser.rol !== 'ADMIN' || !foundUser.puedeEditar)) {
          foundUser.rol = 'ADMIN';
          foundUser.puedeEditar = true;
          foundUser.activo = 'SÍ';
        }
        foundUser = {
          ...foundUser,
          ultimoLogin: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        };
        await setDoc(doc(db, 'users', foundUser.rut), cleanUndefined(foundUser));
      }

      setCurrentUser(foundUser);
      localStorage.setItem('cp_session', JSON.stringify(foundUser));
    } catch (error) {
      console.error('Google Sign-In error:', error);
      setLoginError('Ocurrió un error al iniciar sesión con Google.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('cp_session');
      setCurrentTab('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Quick Demo Login Helper
  const handleQuickLogin = async (rut: string, pass: string) => {
    setLoginError(null);
    const foundUser = INITIAL_USERS.find(u => u.rut === rut && u.clave === pass);
    if (foundUser) {
      // Sign in anonymously to satisfy Firebase rules
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn("Anonymous login skipped or not allowed during quick login:", authErr);
      }

      const updatedUser: User = {
        ...foundUser,
        ultimoLogin: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      };
      
      // Attempt to save to Firestore asynchronously so the database stays updated, but do not block the UI
      try {
        await setDoc(doc(db, 'users', rut), cleanUndefined(updatedUser));
      } catch (err) {
        console.warn('Async sync of quick login user to DB failed:', err);
      }

      setCurrentUser(updatedUser);
      localStorage.setItem('cp_session', JSON.stringify(updatedUser));
      setRutInput('');
      setPasswordInput('');
    } else {
      setLoginError('Perfil de prueba no encontrado.');
    }
  };

  // 5. Update Cable Progress in Firestore
  const handleSaveCable = async (updatedCable: Cable) => {
    const previous = cables.find(c => c.id === updatedCable.id);
    const prevStatus = previous ? previous.estadoGeneral : 'Desconocido';

    try {
      const cableRef = doc(db, 'cables', updatedCable.id);
      await setDoc(cableRef, cleanUndefined(updatedCable));

      if (currentUser) {
        const newLog: HistoryLog = {
          id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          cableId: updatedCable.id,
          usuario: currentUser.nombre,
          rut: currentUser.rut,
          rol: currentUser.rol,
          fecha: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          detalle: previous 
            ? `Modificó checklist del cable: Tendido=${updatedCable.tendido}, Conexionado=${updatedCable.conexionado}, Etiquetado=${updatedCable.etiquetado}, Certificado=${updatedCable.certificado}, Validado=${updatedCable.validadoSupervisor}. Obs: ${updatedCable.observaciones || 'Sin observaciones.'}`
            : `Creado nuevo circuito en base de datos. Origen: ${updatedCable.origen}, Destino: ${updatedCable.destino}.`,
          anteriorEstado: prevStatus,
          nuevoEstado: updatedCable.estadoGeneral
        };

        const logRef = doc(db, 'historyLogs', newLog.id);
        await setDoc(logRef, cleanUndefined(newLog));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'cables/' + updatedCable.id);
    }

    setSelectedCable(null);
  };

  // 5b. Add manual Shift log entry
  const handleAddManualLog = async (newLog: HistoryLog) => {
    try {
      const logRef = doc(db, 'historyLogs', newLog.id);
      await setDoc(logRef, cleanUndefined(newLog));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'historyLogs/' + newLog.id);
    }
  };

  // 6. User Administration Callbacks in Firestore
  const handleSaveUser = async (userPayload: User) => {
    try {
      const userRef = doc(db, 'users', userPayload.rut);
      const existUser = users.find(u => u.rut === userPayload.rut);
      
      const updatedUser = {
        ...userPayload,
        ultimoLogin: existUser?.ultimoLogin || '',
        clave: userPayload.clave ? userPayload.clave : (existUser?.clave || '')
      };

      await setDoc(userRef, cleanUndefined(updatedUser));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/' + userPayload.rut);
    }
  };

  const handleToggleUserStatus = async (rut: string) => {
    const found = users.find(u => u.rut === rut);
    if (!found) return;

    try {
      const userRef = doc(db, 'users', rut);
      await updateDoc(userRef, {
        activo: found.activo === 'SÍ' ? 'NO' : 'SÍ'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/' + rut);
    }
  };

  // 6b. Danger Zone reset handlers
  const handleForceReSeed = async () => {
    await forceReSeedDatabase();
  };

  const handleResetAllCablesToZero = async () => {
    if (!currentUser) return;
    await resetAllCablesProgress(currentUser.nombre, currentUser.rut, currentUser.rol);
  };

  // 7. Profile Safety Callbacks in Firestore
  const handleChangePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    if (!currentUser) return false;

    const found = users.find(u => u.rut === currentUser.rut);
    if (!found || found.clave !== oldPass) {
      return false;
    }

    try {
      const userRef = doc(db, 'users', currentUser.rut);
      await updateDoc(userRef, {
        clave: newPass
      });
      
      const updatedCurrentUser = { ...currentUser, clave: newPass };
      setCurrentUser(updatedCurrentUser);
      localStorage.setItem('cp_session', JSON.stringify(updatedCurrentUser));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/' + currentUser.rut);
      return false;
    }
  };

  // Router layout selector
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard cables={cables} onSelectCable={setSelectedCable} onReSeedDatabase={handleForceReSeed} />;
      case 'tendidos':
        return <CableTable cables={cables} user={currentUser} onSelectCable={setSelectedCable} />;
      case 'turnos':
        return (
          <ShiftSummary
            cables={cables}
            historyLogs={historyLogs}
            user={currentUser}
            onAddManualLog={handleAddManualLog}
          />
        );
      case 'usuarios':
        return (
          <UserManagement
            users={users}
            currentUser={currentUser}
            onSaveUser={handleSaveUser}
            onToggleUserStatus={handleToggleUserStatus}
            onResetProgressZero={handleResetAllCablesToZero}
            onReSeedDatabase={handleForceReSeed}
          />
        );
      case 'seguridad':
        return (
          <ProfileSecurity
            currentUser={currentUser}
            onChangePassword={handleChangePassword}
          />
        );
      default:
        return <Dashboard cables={cables} onSelectCable={setSelectedCable} />;
    }
  };

  // --- RENDERING AUTH/LOADING MASK ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 font-sans antialiased text-white">
        <RefreshCw className="w-8 h-8 text-cox-cyan animate-spin mb-4" />
        <p className="text-xs tracking-widest text-slate-400 font-bold uppercase">Cargando Sistema Digital COX...</p>
      </div>
    );
  }
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-cox-deep via-slate-950 to-slate-900 p-4 font-sans antialiased relative overflow-hidden" id="login-layout">
        {/* Abstract vector backgrounds with COX brand glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cox-cyan/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cox-red/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl shadow-2xl p-8 relative z-10 space-y-6 text-slate-800">
          {/* Brand Logo & Header */}
          <div className="text-center space-y-3">
            <div className="max-w-[200px] mx-auto bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <CoxLogo className="w-full h-auto" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tight text-cox-deep">Control de Avance Digital</h1>
              <p className="text-xs text-slate-500 font-medium">Canalizaciones, Fibras Ópticas y Ethernet en Subestaciones</p>
            </div>
          </div>

          {/* Access Permissions Summary Box */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/80">
              <strong className="text-xs font-extrabold text-cox-blue block">Acceso Editable</strong>
              <span className="text-[10px] text-slate-500 block leading-tight mt-1">Admin, desarrollador, responsable y turnos pueden actualizar avances.</span>
            </div>
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/80">
              <strong className="text-xs font-extrabold text-cox-blue block">Acceso Visita</strong>
              <span className="text-[10px] text-slate-500 block leading-tight mt-1">Modo lectura: visualización de tableros, KPIs y exportación sin editar.</span>
            </div>
          </div>

          {/* Environment Warning Notice about Google Sign-In popup in AI Studio Sandbox */}
          <div className="bg-amber-500/10 border border-amber-250 text-slate-800 rounded-2xl p-4 text-xs space-y-2 text-left shadow-sm">
            <div className="flex items-center gap-2 font-black text-amber-800 uppercase tracking-wider text-[10px]">
              <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Aviso de Entorno (Google Sign-In)</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-700">
              El botón de Google abre una ventana externa que dice <strong>"Sitio no encontrado"</strong>. Esto es normal en el entorno de pruebas de AI Studio porque no se aloja la redirección del dominio.
            </p>
            <p className="leading-relaxed text-[11px] text-slate-700 font-semibold">
              🔑 <strong>Para ingresar con privilegios de Administrador:</strong>
            </p>
            <div className="bg-white/80 p-3 rounded-xl text-xs font-mono border border-amber-200 text-slate-800 space-y-1">
              <div><strong>RUT:</strong> <span className="text-cox-blue font-bold">11111111-1</span></div>
              <div><strong>Clave:</strong> <span className="text-cox-blue font-bold">Admin1234*</span></div>
            </div>
            <p className="leading-relaxed text-[10px] text-slate-500 italic">
              * O haz clic en cualquiera de los botones de **Acceso Rápido** al final de la tarjeta para iniciar sesión en un segundo sin escribir nada.
            </p>
          </div>

          {/* Login Error Notification */}
          {loginError && (
            <div className="bg-rose-500/10 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Primary Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">RUT del Usuario</label>
              <input
                type="text"
                required
                value={rutInput}
                onChange={(e) => setRutInput(e.target.value)}
                placeholder="Ej: 11111111-1"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cox-blue focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex justify-between items-center">
                <span>Clave Única</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cox-blue focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cox-blue to-cox-cyan hover:brightness-110 text-white font-bold rounded-xl py-3 text-xs transition-all shadow-md shadow-cox-blue/15 cursor-pointer"
            >
              Ingresar al Sistema
            </button>

            <div className="relative my-4 flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">o</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl py-2.5 text-xs transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.29 1.93 15.49 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.35 0 10.575-4.475 10.575-10.775 0-.725-.075-1.275-.175-1.84H12.24z"
                />
              </svg>
              Iniciar sesión con Google
            </button>
          </form>

          {/* Quick login helper panel for reviewers */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block text-center">Acceso Rápido de Prueba (Demo)</span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('11111111-1', 'Admin1234*')}
                className="bg-slate-50 border border-slate-200 hover:border-cox-blue text-left px-3 py-2 rounded-xl text-slate-700 hover:text-cox-blue transition-all truncate cursor-pointer"
              >
                <strong>Admin</strong>
                <span className="block text-slate-400 text-[9px] mt-0.5">RUT: 11111111-1</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('22222222-2', 'Resp1234*')}
                className="bg-slate-50 border border-slate-200 hover:border-cox-blue text-left px-3 py-2 rounded-xl text-slate-700 hover:text-cox-blue transition-all truncate cursor-pointer"
              >
                <strong>Responsable</strong>
                <span className="block text-slate-400 text-[9px] mt-0.5">RUT: 22222222-2</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('33333333-3', 'TurnoA123*')}
                className="bg-slate-50 border border-slate-200 hover:border-cox-blue text-left px-3 py-2 rounded-xl text-slate-700 hover:text-cox-blue transition-all truncate cursor-pointer"
              >
                <strong>Turno A</strong>
                <span className="block text-slate-400 text-[9px] mt-0.5">RUT: 33333333-3</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('55555555-5', 'Visita123*')}
                className="bg-slate-50 border border-slate-200 hover:border-cox-blue text-left px-3 py-2 rounded-xl text-slate-700 hover:text-cox-blue transition-all truncate cursor-pointer"
              >
                <strong>Visita (Lectura)</strong>
                <span className="block text-slate-400 text-[9px] mt-0.5">RUT: 55555555-5</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING AUTHENTICATED APP SHELL ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col md:flex-row" id="app-shell">
      {/* 1. SIDEBAR SIDE NAVIGATION */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-cox-deep to-cox-blue border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0 flex flex-col">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-md">
              <CoxLogo className="w-full h-auto" />
            </div>
            <div>
              <h2 className="text-[11px] font-black tracking-wider text-white uppercase leading-none">Control Avance</h2>
              <span className="text-[9px] text-slate-300 font-medium tracking-tight mt-1 block">F.O. + Ethernet · COX</span>
            </div>
          </div>

          <div className="md:hidden">
            {/* Display simple mobile logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User context card */}
        <div className="p-4 mx-4 my-4 bg-slate-950/40 border border-slate-800/50 rounded-xl space-y-1">
          <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Usuario Conectado</span>
          <span className="text-xs font-bold text-slate-100 block truncate">{currentUser.nombre}</span>
          <div className="flex items-center justify-between pt-1 text-[10px] font-mono leading-none">
            <span className="text-cox-cyan bg-cox-cyan/10 border border-cox-cyan/20 px-1.5 py-0.5 rounded-md font-bold uppercase">{currentUser.rol}</span>
            <span className="text-slate-400">{currentUser.rut}</span>
          </div>
        </div>

        {/* Menu Navigation list */}
        <nav className="px-3 flex-1 space-y-1">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              currentTab === 'dashboard'
                ? 'bg-gradient-to-r from-white/15 to-white/5 text-white border border-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cox-cyan" />
            Panel General (Métricas)
          </button>

          <button
            onClick={() => setCurrentTab('tendidos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              currentTab === 'tendidos'
                ? 'bg-gradient-to-r from-white/15 to-white/5 text-white border border-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <TableProperties className="w-4 h-4 text-cox-cyan" />
            Listado de Tendidos
          </button>

          <button
            onClick={() => setCurrentTab('turnos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              currentTab === 'turnos'
                ? 'bg-gradient-to-r from-white/15 to-white/5 text-white border border-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-cox-cyan" />
            Rendimiento & Bitácora
          </button>

          {(currentUser.rol === 'ADMIN' || currentUser.rol === 'DESARROLLADOR') && (
            <button
              onClick={() => setCurrentTab('usuarios')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                currentTab === 'usuarios'
                  ? 'bg-gradient-to-r from-white/15 to-white/5 text-white border border-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4" />
              Gestión de Usuarios
            </button>
          )}

          <button
            onClick={() => setCurrentTab('seguridad')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              currentTab === 'seguridad'
                ? 'bg-gradient-to-r from-white/15 to-white/5 text-white border border-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-cox-cyan" />
            Mi Cuenta (Seguridad)
          </button>
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800 mt-auto text-[10px] text-slate-300 space-y-2 leading-relaxed">
          <p className="font-bold text-cox-cyan uppercase tracking-wider text-[9px]">Sincronización Activa</p>
          <p className="text-slate-400 text-[9px]">La base se actualiza de manera continua en segundo plano para sincronizar avances de terreno.</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-950/60 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-xl py-2 cursor-pointer transition-all mt-2"
          >
            <LogOut className="w-3.5 h-3.5 text-cox-red" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. MAIN VIEWS WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0" id="main-workspace">
        {/* Top Navbar Header */}
        <header className="px-6 py-4 bg-slate-900/60 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              {currentTab === 'dashboard' && 'Panel de Control de Terreno'}
              {currentTab === 'tendidos' && 'Listado General de Tendidos de Cable'}
              {currentTab === 'turnos' && 'Bitácora Comparativa de Cuadrillas'}
              {currentTab === 'usuarios' && 'Administración de Accesos Autorizados'}
              {currentTab === 'seguridad' && 'Seguridad de la Cuenta de Acceso'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentTab === 'dashboard' && 'Rendimiento general de tendido, conexionado, etiquetado y pruebas.'}
              {currentTab === 'tendidos' && 'Monitorea ruteos de plano, terminales origen/destino y actualiza avances.'}
              {currentTab === 'turnos' && 'Supervisa el rendimiento acumulado por Turno A/B y revisa el log de auditoría.'}
              {currentTab === 'usuarios' && 'Controla la creación de perfiles y habilitación de claves de seguridad.'}
              {currentTab === 'seguridad' && 'Monitorea las propiedades de tu perfil y actualiza tu clave secreta de acceso.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto refresh alert badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-[10px] font-mono">
              <RefreshCw id="refresh-btn" className="w-3 h-3 text-teal-400" />
              <span>Sincronizando: <strong className="text-teal-400 font-bold">{secondsToRefresh}s</strong></span>
            </div>

            <button
              onClick={handleManualRefresh}
              className="p-1.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 transition-all text-xs flex items-center justify-center cursor-pointer"
              title="Sincronizar ahora"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            </button>
          </div>
        </header>

        {/* Central views mount workspace */}
        <div className="p-6 overflow-y-auto flex-1">
          {renderTabContent()}
        </div>
      </main>

      {/* 3. EDIT / VIEW DETAILS MODAL */}
      {selectedCable && (
        <CableModal
          cable={selectedCable}
          user={currentUser}
          onClose={() => setSelectedCable(null)}
          onSave={handleSaveCable}
        />
      )}
    </div>
  );
}
