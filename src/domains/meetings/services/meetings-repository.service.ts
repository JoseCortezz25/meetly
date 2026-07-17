import type { StoredMeeting } from '../types/meeting-detail.types';

const DB_NAME = 'meetly';
const DB_VERSION = 1;
const STORE = 'meetings';

const isBrowser = (): boolean => typeof indexedDB !== 'undefined';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

/** Persists (or overwrites) a recorded meeting. Client-only. */
export const saveMeeting = async (meeting: StoredMeeting): Promise<void> => {
  if (!isBrowser()) return;
  await withStore('readwrite', store => store.put(meeting));
};

/** Reads a persisted meeting by id, or undefined if absent. Client-only. */
export const getStoredMeeting = async (
  id: string
): Promise<StoredMeeting | undefined> => {
  if (!isBrowser()) return undefined;
  const result = await withStore<StoredMeeting | undefined>('readonly', store =>
    store.get(id)
  );
  return result ?? undefined;
};

/** Lists persisted meetings, newest first. Client-only. */
export const listStoredMeetings = async (): Promise<StoredMeeting[]> => {
  if (!isBrowser()) return [];
  const all = await withStore<StoredMeeting[]>('readonly', store =>
    store.getAll()
  );
  return [...all].sort((a, b) => b.createdAt - a.createdAt);
};

/** Removes a persisted meeting by id. Client-only. */
export const deleteStoredMeeting = async (id: string): Promise<void> => {
  if (!isBrowser()) return;
  await withStore('readwrite', store => store.delete(id));
};

/** Merges generated notes into a persisted meeting. No-op if it is not stored. */
export const updateStoredMeetingNotes = async (
  id: string,
  notes: StoredMeeting['notes']
): Promise<void> => {
  const meeting = await getStoredMeeting(id);
  if (!meeting) return;
  await saveMeeting({ ...meeting, notes });
};

/** Renames a persisted meeting. No-op if it is not stored. */
export const updateStoredMeetingTitle = async (
  id: string,
  title: string
): Promise<void> => {
  const meeting = await getStoredMeeting(id);
  if (!meeting) return;
  await saveMeeting({ ...meeting, title });
};
