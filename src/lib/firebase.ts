import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { Cable, User, HistoryLog } from '../types';
import { getInitialCables } from '../data/cablesData';
import { INITIAL_USERS } from '../data/usersData';

import firebaseConfig from '../../firebase-applet-config.json';

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Provider for Google Login
export const googleProvider = new GoogleAuthProvider();

// 2. Operation Type Enum for Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// 3. Structured Firestore Error Interface
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// 4. Centralized Firestore Error Handler
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details:', JSON.stringify(errInfo));
  // We log the error gracefully instead of throwing to prevent React app crash on snapshot listening
  return errInfo;
}

// 5. Connection Test (Mandatory Skill Constraint)
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

export async function testConnection() {
  try {
    // First try to sign in anonymously if no user is signed in
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn("Anonymous login is disabled or failed, proceeding with public rules:", authErr);
      }
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// 6. DB Seeder (Initial Seed if Firestore is empty)
export async function seedDatabaseIfEmpty() {
  try {
    // Ensure signed in anonymously if available
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn("Anonymous login failed during seed, proceeding with public rules:", authErr);
      }
    }

    const cablesSnap = await getDocs(collection(db, 'cables'));
    if (cablesSnap.empty) {
      console.log('Seeding initial cables to Firestore...');
      const initialCables = getInitialCables();
      // Use batches to avoid write limit errors
      const batches = [];
      let currentBatch = writeBatch(db);
      let count = 0;

      for (const cable of initialCables) {
        const ref = doc(db, 'cables', cable.id);
        currentBatch.set(ref, cleanUndefined(cable));
        count++;
        if (count === 400) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        batches.push(currentBatch.commit());
      }
      await Promise.all(batches);
    }

    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('Seeding initial users to Firestore...');
      const batch = writeBatch(db);
      for (const user of INITIAL_USERS) {
        // Use RUT as the document ID for simple RUT-based lookup
        const ref = doc(db, 'users', user.rut);
        batch.set(ref, cleanUndefined(user));
      }
      await batch.commit();
    }

    const logsSnap = await getDocs(collection(db, 'historyLogs'));
    if (logsSnap.empty) {
      console.log('Seeding initial history log to Firestore...');
      const initialLog: HistoryLog = {
        id: 'LOG-SEED-1',
        cableId: 'CP-FO-001',
        usuario: 'Sistema',
        rut: '00000000-0',
        rol: 'ADMIN',
        fecha: new Date().toLocaleString('es-CL'),
        detalle: 'Inicialización de la base de ruteo de cables y cargado del plano T2025-0174.',
        anteriorEstado: 'Ninguno',
        nuevoEstado: 'Pendiente'
      };
      await setDoc(doc(db, 'historyLogs', initialLog.id), cleanUndefined(initialLog));
    }
  } catch (err) {
    console.error('Error seeding database: ', err);
  }
}

// 7. Force Wipe and Re-seed Database from Scratch
export async function forceReSeedDatabase() {
  try {
    console.log('Wiping cables collection...');
    const cablesSnap = await getDocs(collection(db, 'cables'));
    const cablesBatch = writeBatch(db);
    cablesSnap.docs.forEach(docSnap => {
      cablesBatch.delete(docSnap.ref);
    });
    await cablesBatch.commit();

    console.log('Wiping users collection...');
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersBatch = writeBatch(db);
    usersSnap.docs.forEach(docSnap => {
      usersBatch.delete(docSnap.ref);
    });
    await usersBatch.commit();

    console.log('Wiping historyLogs collection...');
    const logsSnap = await getDocs(collection(db, 'historyLogs'));
    const logsBatch = writeBatch(db);
    logsSnap.docs.forEach(docSnap => {
      logsBatch.delete(docSnap.ref);
    });
    await logsBatch.commit();

    // Now seed them cleanly!
    console.log('Re-seeding initial cables to Firestore...');
    const initialCables = getInitialCables();
    const seedCablesBatches = [];
    let currentBatch = writeBatch(db);
    let count = 0;
    for (const cable of initialCables) {
      const ref = doc(db, 'cables', cable.id);
      currentBatch.set(ref, cleanUndefined(cable));
      count++;
      if (count === 400) {
        seedCablesBatches.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) {
      seedCablesBatches.push(currentBatch.commit());
    }
    await Promise.all(seedCablesBatches);

    console.log('Re-seeding initial users to Firestore...');
    const seedUsersBatch = writeBatch(db);
    for (const user of INITIAL_USERS) {
      const ref = doc(db, 'users', user.rut);
      seedUsersBatch.set(ref, cleanUndefined(user));
    }
    await seedUsersBatch.commit();

    // Create single system log
    const initialLog: HistoryLog = {
      id: `LOG-RESEED-${Date.now()}`,
      cableId: 'GENERAL',
      usuario: 'Administrador (Sistema)',
      rut: '00000000-0',
      rol: 'ADMIN',
      fecha: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      detalle: 'La base de datos fue re-sembrada por completo desde cero por el Administrador.',
      anteriorEstado: '-',
      nuevoEstado: '-'
    };
    await setDoc(doc(db, 'historyLogs', initialLog.id), cleanUndefined(initialLog));
    console.log('Re-seed complete!');
  } catch (err) {
    console.error('Error re-seeding database:', err);
    throw err;
  }
}

// 8. Reset all cables progress state to 0% (Pendiente)
export async function resetAllCablesProgress(operatorName: string, operatorRut: string, operatorRol: string) {
  try {
    console.log('Resetting progress on all cables to 0%...');
    const cablesSnap = await getDocs(collection(db, 'cables'));
    const batches = [];
    let currentBatch = writeBatch(db);
    let count = 0;

    for (const docSnap of cablesSnap.docs) {
      const updated: Partial<Cable> = {
        tendido: 'No',
        conexionado: 'No',
        etiquetado: 'No',
        certificado: 'No',
        validadoSupervisor: 'No',
        avance: 0,
        estadoGeneral: 'Pendiente',
        observaciones: '',
        responsable: '',
        turno: ''
      };
      currentBatch.update(docSnap.ref, updated);
      count++;
      if (count === 400) {
        batches.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) {
      batches.push(currentBatch.commit());
    }
    await Promise.all(batches);

    // Add history log entry about the progress reset
    const resetLog: HistoryLog = {
      id: `LOG-RESET-${Date.now()}`,
      cableId: 'GENERAL',
      usuario: operatorName,
      rut: operatorRut,
      rol: operatorRol,
      fecha: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      detalle: 'Se reinició el avance de todos los circuitos a 0% para comenzar el control de obras desde cero.',
      anteriorEstado: 'Varios',
      nuevoEstado: 'Pendiente'
    };
    await setDoc(doc(db, 'historyLogs', resetLog.id), cleanUndefined(resetLog));
    console.log('Reset complete!');
  } catch (err) {
    console.error('Error resetting cable progress:', err);
    throw err;
  }
}

