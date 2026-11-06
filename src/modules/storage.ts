/**
 * ResearchFlow core - local-first storage and optional private synchronization.
 * Active collections support projects, research records, manuscripts,
 * submissions and tasks. Retired Evidence Locker and AI settings are removed
 * while normalizing old databases.
 */

import { SYNC_CREDENTIALS_KEY, SYNC_SECRET_KEYS, DEFAULT_DB } from './storage/types.js';
import { StorageCloudSync } from './storage/cloud.js';

export { SYNC_CREDENTIALS_KEY, SYNC_SECRET_KEYS, DEFAULT_DB };

export class StorageEngine extends StorageCloudSync {}

export const storage = new StorageEngine();

if (typeof globalThis !== 'undefined') {
  (globalThis as any).DEFAULT_DB = DEFAULT_DB;
  (globalThis as any).SYNC_CREDENTIALS_KEY = SYNC_CREDENTIALS_KEY;
  (globalThis as any).StorageEngine = StorageEngine;
  (globalThis as any).storage = storage;
}
if (typeof window !== 'undefined') {
  (window as any).DEFAULT_DB = DEFAULT_DB;
  (window as any).SYNC_CREDENTIALS_KEY = SYNC_CREDENTIALS_KEY;
  (window as any).StorageEngine = StorageEngine;
  (window as any).storage = storage;
}
