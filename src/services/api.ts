import { authService } from './authService';
import { FirestoreAdapter } from './firestoreAdapter';

const firestoreStorage = new FirestoreAdapter();

/**
 * Unified API interface to decouple components from specific storage implementation.
 */
export const api = {
  auth: authService,
  data: firestoreStorage,
};
