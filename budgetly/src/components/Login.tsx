'use client';

import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-[#1C1C1E] overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url('https://ik.imagekit.io/hmx3cjrmq/image.png?updatedAt=1753637531406')`, // ✅ Add a background image in your public/images/
                }}
            />
            {/* Blur Overlay */}
            <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/60" />

            {/* Login Card */}
            <div className="relative z-20 min-h-screen flex items-center justify-center px-4">
                <div className="bg-[#232326] rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-600">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#F70000] mb-2 font-lexend">Welcome to Budgetly</h1>
                        <p className="text-gray-400">Sign in to manage your finances</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-[#F70000]/10 border border-[#F70000]/20 rounded-lg">
                            <p className="text-[#F70000] text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            By signing in, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
