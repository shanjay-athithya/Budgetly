'use client';

import React, { useState } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WelcomeMessageProps {
    userName: string;
    savingsAmount: number;
    onDismiss: () => void;
}

export default function WelcomeMessage({ userName, savingsAmount, onDismiss }: WelcomeMessageProps) {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 shadow-2xl">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Welcome to Budgetly, {userName}! 🎉
                        </h3>
                        <p className="text-gray-300 text-sm mb-3">
                            Your account has been successfully created with an initial savings amount of{' '}
                            <span className="font-semibold text-green-400">₹{savingsAmount.toLocaleString()}</span>.
                        </p>
                        <p className="text-gray-400 text-xs">
                            Start tracking your income, expenses, and watch your savings grow!
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
} 