'use client';

import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { userAPI } from '../services/api';

interface LoginProps {
    onNewUserSignup?: (savings: number) => void;
}

export default function Login({ onNewUserSignup }: LoginProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSavingsInput, setShowSavingsInput] = useState(false);
    const [savingsAmount, setSavingsAmount] = useState('');
    const [authUser, setAuthUser] = useState<any>(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);

        try {
            const user = await signInWithGoogle();
            setAuthUser(user);

            // Check if this is a new user by trying to fetch their data
            try {
                await userAPI.getUser(user.uid);
                // User exists, proceed to main app
                if (onNewUserSignup) {
                    onNewUserSignup(0); // Pass 0 to indicate existing user
                }
            } catch (error) {
                // User doesn't exist, show savings input
                setShowSavingsInput(true);
            }
        } catch (error: any) {
            setError(error.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleSavingsSubmit = () => {
        const amount = parseFloat(savingsAmount);
        if (isNaN(amount) || amount < 0) {
            setError('Please enter a valid savings amount');
            return;
        }

        if (onNewUserSignup) {
            onNewUserSignup(amount);
        }
    };

    const skipSavingsInput = () => {
        if (onNewUserSignup) {
            onNewUserSignup(0);
        }
    };

    if (showSavingsInput && authUser) {
        return (
            <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
                <div className="bg-[#232326] rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-600">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome to Budgetly!</h1>
                        <p className="text-gray-400">Let's set up your financial profile</p>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg mb-4">
                            {authUser.photoURL ? (
                                <img
                                    src={authUser.photoURL}
                                    alt={authUser.displayName || 'User'}
                                    className="w-10 h-10 rounded-full"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium">
                                        {authUser.displayName?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                            <div>
                                <p className="text-white font-medium">{authUser.displayName || 'User'}</p>
                                <p className="text-gray-400 text-sm">{authUser.email}</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                                Current Savings (₹)
                            </label>
                            <input
                                type="number"
                                value={savingsAmount}
                                onChange={(e) => setSavingsAmount(e.target.value)}
                                placeholder="Enter your current savings amount"
                                className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                min="0"
                                step="0.01"
                            />
                            <p className="text-gray-400 text-xs mt-1">
                                This helps us track your financial progress. You can update this later.
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={skipSavingsInput}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors duration-200"
                            >
                                Skip for now
                            </button>
                            <button
                                onClick={handleSavingsSubmit}
                                disabled={!savingsAmount.trim()}
                                className="flex-1 bg-[#F70000] hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            You can always update your savings amount later in the app
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
            <div className="bg-[#232326] rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-600">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome to Budgetly</h1>
                    <p className="text-gray-400">Sign in to manage your finances</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
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
    );
} 