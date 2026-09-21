import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  GvcnClassInfo,
  GvcnStudent,
  GvcnWeeklyRecord,
  GvcnClassRule,
  GvcnSeatingChartConfig,
  GvcnSpecialStudent,
  GvcnParentContact,
  GvcnMonthlyTask,
  PpctDataset,
  TimeframeConfig,
  MatrixConfig,
  MatrixRow,
  SgkBook,
} from '../types';

export const SUPER_ADMIN_EMAIL = 'dvtrong.spdt09@gmail.com';
export const SUPER_ADMIN_EMAILS = [
  'dvtrong.spdt09@gmail.com',
  'dvtrong.c23hoabinh.dtp@moet.edu.vn',
  'duongvantrong.dtp@gmail.com',
  'huyvuit88@gmail.com',
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === lower);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

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
  };
}

export function isQuotaExceededError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'resource-exhausted')
  );
}

let isFirestoreQuotaExceeded = false;
const quotaListeners: Array<(exceeded: boolean) => void> = [];

export function getIsQuotaExceeded(): boolean {
  return isFirestoreQuotaExceeded;
}

export function setFirestoreQuotaExceeded(exceeded: boolean): void {
  if (isFirestoreQuotaExceeded !== exceeded) {
    isFirestoreQuotaExceeded = exceeded;
    quotaListeners.forEach((fn) => fn(exceeded));
  }
}

export function subscribeQuotaState(listener: (exceeded: boolean) => void): () => void {
  quotaListeners.push(listener);
  listener(isFirestoreQuotaExceeded);
  return () => {
    const idx = quotaListeners.indexOf(listener);
    if (idx !== -1) quotaListeners.splice(idx, 1);
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (isQuotaExceededError(error)) {
    setFirestoreQuotaExceeded(true);
    console.warn(
      `[Firestore Quota] Free tier daily quota limit reached for operation '${operationType}' on '${path}'. Application safely switching to local offline persistence.`
    );
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with custom database ID from config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline.');
    }
    return false;
  }
}

// Check initial connection silently
testFirestoreConnection().catch(() => {});

// Authentication Helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    // If popup was blocked or iframe restriction occurs, try redirect
    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
      console.warn('Popup blocked, attempting redirect fallback:', err);
    }
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export interface WhitelistEntry {
  email: string;
  name?: string;
  addedBy?: string;
  addedAt?: string;
  role?: 'admin' | 'teacher';
}

export interface AuthAccessCheck {
  isAllowed: boolean;
  isSuperAdmin: boolean;
  role: 'admin' | 'teacher' | 'unauthorized';
  reason?: string;
}

// Clean email key for Firestore document IDs (e.g., dvtrong_spdt09_gmail_com)
export function sanitizeEmailForDocId(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
}

// Fetch all whitelist entries (for Admin UI)
export async function getWhitelistUsers(): Promise<WhitelistEntry[]> {
  try {
    const snapshot = await getDocs(collection(db, 'whitelist_users'));
    const list: WhitelistEntry[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as WhitelistEntry;
      if (data && data.email) {
        list.push(data);
      }
    });

    // Ensure super admin is always represented in list
    if (!list.some((u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {
      list.unshift({
        email: SUPER_ADMIN_EMAIL,
        name: 'Quản trị viên trưởng',
        role: 'admin',
        addedAt: 'Hệ thống gốc',
      });
    }

    return list;
  } catch (err) {
    console.error('Failed to load whitelist from cloud:', err);
    return [
      {
        email: SUPER_ADMIN_EMAIL,
        name: 'Quản trị viên trưởng',
        role: 'admin',
        addedAt: 'Hệ thống gốc',
      },
    ];
  }
}

// Add an email to the whitelist
export async function addEmailToWhitelist(
  email: string,
  name?: string,
  adminUser?: User | null
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const docId = sanitizeEmailForDocId(cleanEmail);
  const docRef = doc(db, 'whitelist_users', docId);

  await setDoc(docRef, {
    email: cleanEmail,
    name: name || '',
    addedBy: adminUser?.email || 'admin',
    addedAt: new Date().toISOString(),
    role: 'teacher',
  });
}

// Remove an email from the whitelist
export async function removeEmailFromWhitelist(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  if (isSuperAdminEmail(cleanEmail)) {
    throw new Error('Không thể xóa quyền của Quản trị viên trưởng!');
  }
  const docId = sanitizeEmailForDocId(cleanEmail);
  await deleteDoc(doc(db, 'whitelist_users', docId));
}

// Verify if an authenticated user is permitted
export async function checkUserAuthorization(user: User | null): Promise<AuthAccessCheck> {
  if (!user || !user.email) {
    return { isAllowed: false, isSuperAdmin: false, role: 'unauthorized', reason: 'Chưa đăng nhập' };
  }

  const userEmail = user.email.toLowerCase().trim();

  // 1. Check Super Admin email
  if (isSuperAdminEmail(userEmail)) {
    return { isAllowed: true, isSuperAdmin: true, role: 'admin' };
  }

  // 2. Query Firestore whitelist
  try {
    const docId = sanitizeEmailForDocId(userEmail);
    const docSnap = await getDoc(doc(db, 'whitelist_users', docId));
    if (docSnap.exists()) {
      const data = docSnap.data() as WhitelistEntry;
      return {
        isAllowed: true,
        isSuperAdmin: false,
        role: data.role === 'admin' ? 'admin' : 'teacher',
      };
    }
  } catch (err) {
    console.warn('Could not verify whitelist online, fallback checking:', err);
  }

  // 3. Fallback to localStorage whitelist if saved previously
  try {
    const localWhitelist = JSON.parse(localStorage.getItem('gvcn_whitelist_cache') || '[]');
    if (Array.isArray(localWhitelist) && localWhitelist.includes(userEmail)) {
      return { isAllowed: true, isSuperAdmin: false, role: 'teacher' };
    }
  } catch (e) {}

  return {
    isAllowed: false,
    isSuperAdmin: false,
    role: 'unauthorized',
    reason: `Tài khoản ${user.email} chưa được cấp quyền sử dụng hệ thống này.`,
  };
}

// Sync Payload for GVCN data
export interface GvcnCloudPayload {
  classInfo: GvcnClassInfo;
  students: GvcnStudent[];
  weeklyRecords?: GvcnWeeklyRecord[];
  rules?: GvcnClassRule[];
  seatingChart?: GvcnSeatingChartConfig;
  specialStudents?: GvcnSpecialStudent[];
  parentContacts?: GvcnParentContact[];
  monthlyTasks?: GvcnMonthlyTask[];
  lastUpdated: string;
  syncedByEmail: string;
}

// Subscribe to real-time updates for a teacher's GVCN data across devices with the same Gmail
export function subscribeToGvcnData(
  userId: string,
  onData: (payload: GvcnCloudPayload) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, 'users', userId, 'gvcn_data', 'main');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as GvcnCloudPayload;
        if (data && data.students) {
          onData(data);
        }
      }
    },
    (error) => {
      console.error('Real-time GVCN sync error:', error);
      handleFirestoreError(error, OperationType.GET, `users/${userId}/gvcn_data/main`);
      if (onError) onError(error);
    }
  );
}

// Fetch GVCN data once from Cloud
export async function fetchGvcnDataFromCloud(userId: string): Promise<GvcnCloudPayload | null> {
  const path = `users/${userId}/gvcn_data/main`;
  try {
    const docRef = doc(db, 'users', userId, 'gvcn_data', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as GvcnCloudPayload;
    }
    return null;
  } catch (error) {
    console.error('Error fetching GVCN data from cloud:', error);
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Save / Push GVCN data to Firestore
export async function syncGvcnDataToCloud(
  userId: string,
  userEmail: string,
  data: {
    classInfo: GvcnClassInfo;
    students: GvcnStudent[];
    weeklyRecords?: GvcnWeeklyRecord[];
    rules?: GvcnClassRule[];
    seatingChart?: GvcnSeatingChartConfig;
    specialStudents?: GvcnSpecialStudent[];
    parentContacts?: GvcnParentContact[];
    monthlyTasks?: GvcnMonthlyTask[];
  }
): Promise<void> {
  const path = `users/${userId}/gvcn_data/main`;
  try {
    const docRef = doc(db, 'users', userId, 'gvcn_data', 'main');
    const payload: GvcnCloudPayload = {
      classInfo: data.classInfo,
      students: data.students,
      weeklyRecords: data.weeklyRecords || [],
      rules: data.rules || [],
      seatingChart: data.seatingChart,
      specialStudents: data.specialStudents || [],
      parentContacts: data.parentContacts || [],
      monthlyTasks: data.monthlyTasks || [],
      lastUpdated: new Date().toISOString(),
      syncedByEmail: userEmail,
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.error('Error syncing GVCN data to cloud:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync Payload for PPCT & Teaching Materials (Kế hoạch bài dạy, PPCT, SGK, Ma trận đề)
export interface TeacherPpctCloudPayload {
  datasets: PpctDataset[];
  activeDatasetId?: string;
  timeframeConfig?: TimeframeConfig;
  matrixConfig?: MatrixConfig;
  matrixRows?: MatrixRow[];
  sgkBooks?: SgkBook[];
  lastUpdated: string;
  syncedByEmail: string;
  sourceDevice?: string;
}

// Subscribe to real-time updates for PPCT & teaching materials across devices with same Gmail
export function subscribeToPpctData(
  userId: string,
  onData: (payload: TeacherPpctCloudPayload) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, 'users', userId, 'ppct_data', 'main');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as TeacherPpctCloudPayload;
        if (data && Array.isArray(data.datasets)) {
          onData(data);
        }
      }
    },
    (error) => {
      console.error('Real-time PPCT sync error:', error);
      handleFirestoreError(error, OperationType.GET, `users/${userId}/ppct_data/main`);
      if (onError) onError(error);
    }
  );
}

// Fetch PPCT & Teaching Materials once from Cloud
export async function fetchPpctDataFromCloud(userId: string): Promise<TeacherPpctCloudPayload | null> {
  const path = `users/${userId}/ppct_data/main`;
  try {
    const docRef = doc(db, 'users', userId, 'ppct_data', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as TeacherPpctCloudPayload;
    }
    return null;
  } catch (error) {
    console.error('Error fetching PPCT data from cloud:', error);
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Save / Push PPCT & Teaching Materials to Firestore
export async function syncPpctDataToCloud(
  userId: string,
  userEmail: string,
  data: {
    datasets: PpctDataset[];
    activeDatasetId?: string;
    timeframeConfig?: TimeframeConfig;
    matrixConfig?: MatrixConfig;
    matrixRows?: MatrixRow[];
    sgkBooks?: SgkBook[];
    sourceDevice?: string;
  }
): Promise<void> {
  const path = `users/${userId}/ppct_data/main`;
  try {
    const docRef = doc(db, 'users', userId, 'ppct_data', 'main');
    const payload: TeacherPpctCloudPayload = {
      datasets: data.datasets || [],
      activeDatasetId: data.activeDatasetId,
      timeframeConfig: data.timeframeConfig,
      matrixConfig: data.matrixConfig,
      matrixRows: data.matrixRows,
      sgkBooks: data.sgkBooks,
      lastUpdated: new Date().toISOString(),
      syncedByEmail: userEmail,
      sourceDevice: data.sourceDevice || (typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Desktop/Laptop'),
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.error('Error syncing PPCT data to cloud:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
