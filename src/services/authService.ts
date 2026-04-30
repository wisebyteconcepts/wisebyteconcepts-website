import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, OperationType } from '@/types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class AuthService {
  private mapFirebaseUser(user: FirebaseUser, role: 'admin' | 'user' = 'user'): User {
    // System admin bootstrap for UI
    const adminEmails = ['wisebyteconcepts@gmail.com', 'contact@wisebyteconcepts.com'];
    const finalRole = (user.email && adminEmails.includes(user.email)) ? 'admin' : role;
    return {
      id: user.uid,
      email: user.email || '',
      role: finalRole,
    };
  }

  async login(email: string, password: string): Promise<User | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      const role = userDoc.exists() ? (userDoc.data().role as 'admin' | 'user') : 'user';
      return this.mapFirebaseUser(userCredential.user, role);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userProfile = {
        email: user.email,
        role: 'user' as const,
        createdAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'users', user.uid), userProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }

      return this.mapFirebaseUser(user, 'user');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    console.log(`[AuthService] Attempting password reset for: ${email}`);
    try {
      await sendPasswordResetEmail(auth, email);
      console.log(`[AuthService] Password reset email request processed for: ${email}`);
    } catch (error: any) {
      console.error(`[AuthService] Password reset failed for ${email}:`, error);
      throw error;
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const role = userDoc.exists() ? (userDoc.data().role as 'admin' | 'user') : 'user';
          callback(this.mapFirebaseUser(firebaseUser, role));
        } catch (error) {
          console.error('Error fetching user profile:', error);
          callback(this.mapFirebaseUser(firebaseUser, 'user'));
        }
      } else {
        callback(null);
      }
    });
  }

  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const role = userDoc.exists() ? (userDoc.data().role as 'admin' | 'user') : 'user';
      return this.mapFirebaseUser(firebaseUser, role);
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return this.mapFirebaseUser(firebaseUser, 'user');
    }
  }
}

export const authService = new AuthService();
