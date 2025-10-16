import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('geminova_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to load user from localStorage", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const signIn = useCallback((name: string) => {
        const newUser: User = {
            id: uuidv4(),
            name,
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@geminova.ai`, // dummy email
        };
        try {
            localStorage.setItem('geminova_user', JSON.stringify(newUser));
            setUser(newUser);
        } catch (error) {
            console.error("Failed to save user to localStorage", error);
        }
    }, []);

    const signOut = useCallback(() => {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('geminova_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            setUser(null);
            // Force a reload to clear all state from memory
            window.location.reload();
        } catch (error) {
            console.error("Failed to sign out", error);
        }
    }, []);

    const updateUser = useCallback((updatedData: Partial<User>) => {
        setUser(currentUser => {
            if (!currentUser) return null;
            const newUser = { ...currentUser, ...updatedData };
            try {
                localStorage.setItem('geminova_user', JSON.stringify(newUser));
            } catch (error)
 {
                console.error("Failed to save updated user to localStorage", error);
            }
            return newUser;
        });
    }, []);

    return { user, signIn, signOut, loading, updateUser };
};