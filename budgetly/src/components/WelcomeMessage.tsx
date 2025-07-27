'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface WelcomeMessageProps {
    onComplete: () => void;
}

export default function WelcomeMessage({ onComplete }: WelcomeMessageProps) {
    const { user: authUser } = useAuth();
    const { createUser } = useData();
    const [savingsAmount, setSavingsAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSavingsSubmit = async () => {
        const amount = parseFloat(savingsAmount);
        if (isNaN(amount) || amount < 0) {
            setError('Please enter a valid savings amount');
            return;
        }

        console.log('Creating user with savings:', amount);
        setLoading(true);
        setError(null);

        try {
            await createUser({
                uid: authUser!.uid,
                email: authUser!.email || '',
                name: authUser!.displayName || 'User',
                photoURL: authUser!.photoURL || undefined,
                location: '',
                occupation: '',
                savings: amount
            });
            console.log('User created successfully, calling onComplete');
            onComplete();
        } catch (error: unknown) {
            console.error('Failed to create user:', error);
            setError(error instanceof Error ? error.message : 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const skipSavingsInput = async () => {
        console.log('Skipping savings input, creating user with 0 savings');
        setLoading(true);
        setError(null);

        try {
            await createUser({
                uid: authUser!.uid,
                email: authUser!.email || '',
                name: authUser!.displayName || 'User',
                photoURL: authUser!.photoURL || undefined,
                location: '',
                occupation: '',
                savings: 0
            });
            console.log('User created successfully (skip), calling onComplete');
            onComplete();
        } catch (error: unknown) {
            console.error('Failed to create user (skip):', error);
            setError(error instanceof Error ? error.message : 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

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
                    <p className="text-gray-400">Let&apos;s set up your financial profile</p>
                </div>

                <div className="mb-6">
                    <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg mb-4">
                        {authUser?.photoURL ? (
                            <img
                                src={authUser.photoURL}
                                alt={authUser.displayName || 'User'}
                                className="w-10 h-10 rounded-full"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium">
                                    {authUser?.displayName?.charAt(0) || 'U'}
                                </span>
                            </div>
                        )}
                        <div>
                            <p className="text-white font-medium">{authUser?.displayName || 'User'}</p>
                            <p className="text-gray-400 text-sm">{authUser?.email}</p>
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
                            disabled={loading}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Skip for now'}
                        </button>
                        <button
                            onClick={handleSavingsSubmit}
                            disabled={!savingsAmount.trim() || loading}
                            className="flex-1 bg-[#F70000] hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Continue'}
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