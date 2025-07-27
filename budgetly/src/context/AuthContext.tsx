'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChange } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('🔥 AuthProvider - Setting up auth state listener');
        const unsubscribe = onAuthStateChange((user) => {
            console.log('🔥 AuthProvider - Auth state changed:', user?.uid);
            setUser(user);
            setLoading(false);
        });

        return () => {
            console.log('🔥 AuthProvider - Cleaning up auth state listener');
            unsubscribe();
        };
    }, []);

    console.log('🔥 AuthProvider render - user:', user?.uid, 'loading:', loading);

    const value = {
        user,
        loading,
        error
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 