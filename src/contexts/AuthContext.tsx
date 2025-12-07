import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { showError } from '@/utils/sweetalert';
import type { User } from '@/types';

interface AuthContextType {
    currentUser: User | null;
    isAuthReady: boolean;
    isLoading: boolean;
    isCheckingAuth: boolean;
    unauthorizedEmail: string | null;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: () => boolean;
    canWrite: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);

    const fetchUserRole = async (email: string): Promise<'admin' | 'visitor' | null> => {
        try {
            const userDoc = await getDoc(doc(db, 'users', email));
            if (userDoc.exists()) {
                return userDoc.data().role as 'admin' | 'visitor';
            }
            return null;
        } catch (error) {
            console.error('Error fetching user role:', error);
            return null;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser && firebaseUser.email) {
                const role = await fetchUserRole(firebaseUser.email);
                if (role) {
                    setCurrentUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        role
                    });
                    setIsAuthReady(true);
                    setUnauthorizedEmail(null);
                } else {
                    // User not in users collection or no role assigned
                    setUnauthorizedEmail(firebaseUser.email);
                    await signOut(auth);
                    setCurrentUser(null);
                    setIsAuthReady(false);
                    showError('Usuario no autorizado. Contacte al administrador.');
                }
            } else {
                setCurrentUser(null);
                setIsAuthReady(false);
                setUnauthorizedEmail(null);
            }
            setIsCheckingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            console.error('Error signing in:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const isAdmin = (): boolean => {
        return currentUser?.role === 'admin';
    };

    const canWrite = (): boolean => {
        return currentUser?.role === 'admin';
    };

    const value: AuthContextType = {
        currentUser,
        isAuthReady,
        isLoading,
        isCheckingAuth,
        unauthorizedEmail,
        signInWithGoogle,
        logout,
        isAdmin,
        canWrite
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
