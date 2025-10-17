import { useState, useEffect, useCallback } from 'react';
import { User, StoredUser } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { simpleObfuscate } from '../utils';

// Key for the currently logged-in user session
const SESSION_USER_KEY = 'geminova_user';

// Prefix for stored user accounts
const getAccountKey = (email: string) => `geminova_account_${email.toLowerCase()}`;

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem(SESSION_USER_KEY);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to load user session from localStorage", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const setActiveSession = (userData: User) => {
        try {
            localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error("Failed to save user session to localStorage", error);
        }
    };

    const signUp = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const accountKey = getAccountKey(email);
            if (localStorage.getItem(accountKey)) {
                return { success: false, error: 'An account with this email already exists.' };
            }

            const newUser: User = {
                id: uuidv4(),
                name,
                email,
            };

            const storedUser: StoredUser = {
                ...newUser,
                obfuscatedPass: simpleObfuscate(password),
            };

            localStorage.setItem(accountKey, JSON.stringify(storedUser));
            setActiveSession(newUser);
            
            return { success: true };
        } catch (error) {
            console.error("Sign up failed", error);
            return { success: false, error: 'An unexpected error occurred during sign up.' };
        }
    }, []);
    
    const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const accountKey = getAccountKey(email);
            const storedAccountJSON = localStorage.getItem(accountKey);
            
            if (!storedAccountJSON) {
                return { success: false, error: 'No account found with this email.' };
            }

            const storedAccount: StoredUser = JSON.parse(storedAccountJSON);
            const obfuscatedPass = simpleObfuscate(password);

            if (storedAccount.obfuscatedPass === obfuscatedPass) {
                // Don't store password info in the active session object
                const { obfuscatedPass, ...sessionUser } = storedAccount;
                setActiveSession(sessionUser);
                return { success: true };
            } else {
                return { success: false, error: 'Invalid password.' };
            }
        } catch (error) {
            console.error("Sign in failed", error);
            return { success: false, error: 'An unexpected error occurred during sign in.' };
        }
    }, []);

    const signOut = useCallback(() => {
        try {
            // Only remove the session, not all accounts
            localStorage.removeItem(SESSION_USER_KEY);
            setUser(null);
        } catch (error) {
            console.error("Failed to sign out", error);
        }
    }, []);

    const updateUser = useCallback((updatedData: Partial<User>) => {
        setUser(currentUser => {
            if (!currentUser) return null;
            const newUser = { ...currentUser, ...updatedData };
            try {
                // Update session
                localStorage.setItem(SESSION_USER_KEY, JSON.stringify(newUser));
                // Update stored account
                const accountKey = getAccountKey(newUser.email);
                const storedAccountJSON = localStorage.getItem(accountKey);
                if (storedAccountJSON) {
                    const storedAccount: StoredUser = JSON.parse(storedAccountJSON);
                    const updatedAccount = { ...storedAccount, ...updatedData };
                    localStorage.setItem(accountKey, JSON.stringify(updatedAccount));
                }
            } catch (error)
 {
                console.error("Failed to save updated user to localStorage", error);
            }
            return newUser;
        });
    }, []);

    return { user, signIn, signUp, signOut, loading, updateUser };
};