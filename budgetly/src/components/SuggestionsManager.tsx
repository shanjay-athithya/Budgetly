'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
    LightBulbIcon,
    CalculatorIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface SuggestionEntry {
    id: string;
    productName: string;
    fullPrice: number;
    monthlyEMI: number;
    duration: number;
    category: string;
    suggestion: 'good' | 'moderate' | 'risky';
    reason: string;
    explanation?: string;
    timestamp: Date;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

const PRODUCT_CATEGORIES = [
    'Electronics',
    'Lifestyle',
    'Home & Garden',
    'Fashion',
    'Automotive',
    'Health & Fitness',
    'Entertainment',
    'Education',
    'Travel',
    'Other'
];

export default function SuggestionsManager() {
    const { state } = useData();
    const { user, currentMonth } = state;

    const [suggestions, setSuggestions] = useState<SuggestionEntry[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [currentSuggestion, setCurrentSuggestion] = useState<SuggestionEntry | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [loadingAI, setLoadingAI] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        productName: '',
        fullPrice: '',
        monthlyEMI: '',
        duration: '',
        category: '',
        inputType: 'fullPrice' as 'fullPrice' | 'emi'
    });

    // Calculate financial metrics
    const calculateFinancialMetrics = useCallback(() => {
        if (!user || !user.months || !user.months[currentMonth]) {
            return {
                monthlyIncome: 0,
                monthlyExpenses: 0,
                existingEMIs: 0,
                savings: 0,
                expenseRatio: 0
            };
        }

        const monthData = user.months[currentMonth];

        // Calculate monthly income
        const monthlyIncome = monthData.income && Array.isArray(monthData.income)
            ? monthData.income.reduce((sum, income) => sum + income.amount, 0)
            : 0;

        // Calculate monthly expenses
        const monthlyExpenses = monthData.expenses && Array.isArray(monthData.expenses)
            ? monthData.expenses.reduce((sum, expense) => sum + expense.amount, 0)
            : 0;

        // Calculate existing EMIs (monthly installments for this month)
        const existingEMIs = monthData.expenses && Array.isArray(monthData.expenses)
            ? monthData.expenses
                .filter(expense => expense.type === 'emi')
                .reduce((sum, expense) => sum + expense.amount, 0)
            : 0;

        // Calculate savings
        const savings = monthlyIncome - monthlyExpenses;

        return {
            monthlyIncome,
            monthlyExpenses,
            existingEMIs,
            savings,
            expenseRatio: monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0
        };
    }, [user, currentMonth]);

    // Toast management
    const addToast = (message: string, type: Toast['type']) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };

    // Form handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Handle input type changes
        if (name === 'inputType') {
            setFormData(prev => ({
                ...prev,
                [name]: value as 'fullPrice' | 'emi',
                // Clear the other field when switching input types
                fullPrice: value === 'emi' ? '' : prev.fullPrice,
                monthlyEMI: value === 'fullPrice' ? '' : prev.monthlyEMI
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const resetForm = () => {
        setFormData({
            productName: '',
            fullPrice: '',
            monthlyEMI: '',
            duration: '',
            category: '',
            inputType: 'fullPrice'
        });
        setCurrentSuggestion(null);
    };

    const openForm = () => {
        resetForm();
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        resetForm();
    };

    // Calculate EMI from full price and duration
    const calculateEMI = (price: number, months: number) => {
        return months > 0 ? price / months : 0;
    };

    // Calculate total price from EMI and duration
    const calculateTotalPrice = (emi: number, months: number) => {
        return emi * months;
    };

    // Generate suggestion based on financial rules
    const generateSuggestion = (monthlyEMI: number, fullPrice: number) => {
        const metrics = calculateFinancialMetrics();
        const { monthlyIncome, existingEMIs, savings, expenseRatio } = metrics;

        let suggestion: 'good' | 'moderate' | 'risky' = 'good';
        const reasons: string[] = [];

        // Rule 1: Monthly EMI should be ≤ 25% of monthly income
        if (monthlyEMI > monthlyIncome * 0.25) {
            suggestion = 'risky';
            reasons.push(`EMI (₹${monthlyEMI.toLocaleString()}) exceeds 25% of monthly income`);
        }

        // Rule 2: Total EMIs (existing + new) should be ≤ 40% of monthly income
        const totalEMIs = existingEMIs + monthlyEMI;
        if (totalEMIs > monthlyIncome * 0.4) {
            suggestion = 'risky';
            reasons.push(`Total EMIs (₹${totalEMIs.toLocaleString()}) exceed 40% of monthly income`);
        }

        // Rule 3: Check if expense ratio is already high
        if (expenseRatio > 80) {
            suggestion = suggestion === 'good' ? 'moderate' : suggestion;
            reasons.push(`Current expense ratio is ${expenseRatio.toFixed(1)}% (high)`);
        }

        // Rule 4: Check savings buffer
        const remainingSavings = savings - fullPrice;
        if (remainingSavings < monthlyIncome * 0.1) {
            suggestion = suggestion === 'good' ? 'moderate' : suggestion;
            reasons.push(`Remaining savings (₹${remainingSavings.toLocaleString()}) below 10% of income`);
        }

        // Determine final suggestion
        if (suggestion === 'good' && reasons.length === 0) {
            reasons.push('Safe to proceed - within recommended limits');
        } else if (suggestion === 'moderate') {
            reasons.push('Proceed with caution - consider waiting or saving more');
        } else if (suggestion === 'risky') {
            reasons.push('Not recommended - exceeds financial safety thresholds');
        }

        return {
            suggestion,
            reason: reasons.join('. ')
        };
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Enhanced validation
        if (!formData.productName.trim()) {
            addToast('Please enter a product name', 'error');
            return;
        }

        let duration = 0;
        if (formData.inputType === 'emi') {
            if (!formData.duration || parseInt(formData.duration) <= 0) {
                addToast('Please enter a valid duration (minimum 1 month)', 'error');
                return;
            }
            duration = parseInt(formData.duration);

            if (duration > 120) { // 10 years max
                addToast('Duration cannot exceed 120 months (10 years)', 'error');
                return;
            }
        }

        let fullPrice = 0;
        let monthlyEMI = 0;

        if (formData.inputType === 'fullPrice') {
            if (!formData.fullPrice || formData.fullPrice.trim() === '') {
                addToast('Please enter a full price', 'error');
                return;
            }
            const priceValue = parseFloat(formData.fullPrice);
            if (isNaN(priceValue) || priceValue <= 0) {
                addToast('Please enter a valid full price (greater than 0)', 'error');
                return;
            }
            fullPrice = priceValue;
            monthlyEMI = 0; // No monthly payment for full price purchase
        } else {
            if (!formData.monthlyEMI || formData.monthlyEMI.trim() === '') {
                addToast('Please enter a monthly EMI amount', 'error');
                return;
            }
            const emiValue = parseFloat(formData.monthlyEMI);
            if (isNaN(emiValue) || emiValue <= 0) {
                addToast('Please enter a valid monthly EMI amount (greater than 0)', 'error');
                return;
            }
            monthlyEMI = emiValue;
            fullPrice = calculateTotalPrice(monthlyEMI, duration);
        }

        // Additional validation for reasonable limits
        if (fullPrice <= 0) {
            addToast('Please enter valid amounts', 'error');
            return;
        }

        // Check for reasonable limits
        if (fullPrice > 10000000) { // 10 million max
            addToast('Price cannot exceed ₹10,000,000', 'error');
            return;
        }

        if (monthlyEMI > 10000000) { // 1M max monthly EMI
            addToast('Monthly EMI cannot exceed ₹1,000,000', 'error');
            return;
        }

        if (!user) {
            addToast('User not found', 'error');
            return;
        }

        try {
            setLoadingAI(true);
            const res = await fetch('/api/suggestions/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    productName: formData.productName.trim(),
                    price: formData.inputType === 'fullPrice' ? fullPrice : undefined,
                    monthlyEMI: formData.inputType === 'emi' ? monthlyEMI : undefined,
                    duration: formData.inputType === 'emi' ? duration : undefined,
                    category: formData.category || 'Other'
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({} as any));
                // If backend returned raw model text, surface it in the UI so user sees details
                if (err && err.raw) {
                    const fallbackSuggestion: SuggestionEntry = {
                        id: Date.now().toString(),
                        productName: formData.productName.trim(),
                        fullPrice: formData.inputType === 'fullPrice' ? fullPrice : (monthlyEMI * duration),
                        monthlyEMI: formData.inputType === 'emi' ? monthlyEMI : 0,
                        duration: formData.inputType === 'emi' ? duration : 0,
                        category: formData.category || 'Other',
                        suggestion: 'moderate',
                        reason: err.error || 'Model returned an unexpected format',
                        explanation: typeof err.raw === 'string' ? err.raw : JSON.stringify(err.raw),
                        timestamp: new Date()
                    };
                    setCurrentSuggestion(fallbackSuggestion);
                    setSuggestions(prev => [fallbackSuggestion, ...prev]);
                    addToast('Showing model response details', 'info');
                    closeForm();
                    return;
                }
                throw new Error(err.error || 'AI suggestion failed');
            }
            const data = await res.json();
            const s = data.suggestion as {
                _id: string;
                productName: string;
                price: number;
                emiAmount?: number;
                duration?: number;
                suggestionScore: 'Good' | 'Moderate' | 'Risky';
                reason: string;
                suggestedAt: string;
            };
            const detailedExplanation: string | undefined = data.explanation;

            const newSuggestion: SuggestionEntry = {
                id: s._id,
                productName: s.productName,
                fullPrice: s.price,
                monthlyEMI: s.emiAmount ?? 0,
                duration: s.duration ?? 0,
                category: formData.category || 'Other',
                suggestion: (s.suggestionScore.toLowerCase() as 'good' | 'moderate' | 'risky'),
                reason: s.reason,
                explanation: detailedExplanation || s.reason,
                timestamp: new Date(s.suggestedAt)
            };

            setCurrentSuggestion(newSuggestion);
            setSuggestions(prev => [newSuggestion, ...prev]);
            addToast('AI suggestion generated!', 'success');
            closeForm();
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Failed to generate AI suggestion', 'error');
        } finally {
            setLoadingAI(false);
        }
    };

    // Save as planned EMI
    const saveAsPlannedEMI = (suggestion: SuggestionEntry) => {
        // This would typically save to a planned EMIs list
        addToast('Saved as planned EMI!', 'success');
    };

    // Get suggestion icon and color
    const getSuggestionIcon = (suggestion: string) => {
        switch (suggestion) {
            case 'good':
                return { icon: CheckCircleIcon, color: 'text-green-400', bgColor: 'bg-green-500/20' };
            case 'moderate':
                return { icon: ExclamationTriangleIcon, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
            case 'risky':
                return { icon: XCircleIcon, color: 'text-[#F70000]', bgColor: 'bg-[#F70000]/20' };
            default:
                return { icon: CheckCircleIcon, color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
        }
    };

    // Get suggestion label
    const getSuggestionLabel = (suggestion: string) => {
        switch (suggestion) {
            case 'good':
                return 'Good Decision';
            case 'moderate':
                return 'Moderate Risk';
            case 'risky':
                return 'Not Recommended';
            default:
                return 'Unknown';
        }
    };

    const metrics = useMemo(() => calculateFinancialMetrics(), [calculateFinancialMetrics]);

    // Loading state
    if (state.loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#F70000]"></div>
            </div>
        );
    }

    // Error state
    if (state.error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                    <LightBulbIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Suggestions</h3>
                <p className="text-gray-400">{state.error}</p>
            </div>
        );
    }

    // No data state
    if (!user || !user.months || Object.keys(user.months).length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                    <LightBulbIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
                <p className="text-gray-400">Add some income and expenses to get financial suggestions</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' :
                            toast.type === 'error' ? 'bg-[#F70000]' : 'bg-blue-500'
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#F70000]/20 rounded-xl flex items-center justify-center">
                        <LightBulbIcon className="w-6 h-6 text-[#F70000]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Financial Suggestions</h2>
                        <p className="text-gray-400">Get smart purchase recommendations</p>
                    </div>
                </div>
                <button
                    onClick={openForm}
                    className="flex items-center space-x-2 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-lg"
                >
                    <CalculatorIcon className="w-5 h-5" />
                    <span>Suggest a Product</span>
                </button>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#383838] rounded-xl p-4 border border-gray-600">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Monthly Income</p>
                            <p className="text-xl font-bold text-white">₹{metrics.monthlyIncome.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#383838] rounded-xl p-4 border border-gray-600">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#F70000]/20 rounded-lg flex items-center justify-center">
                            <CurrencyDollarIcon className="w-5 h-5 text-[#F70000]" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Monthly Expenses</p>
                            <p className="text-xl font-bold text-white">₹{metrics.monthlyExpenses.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#383838] rounded-xl p-4 border border-gray-600">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Existing EMIs</p>
                            <p className="text-xl font-bold text-white">₹{metrics.existingEMIs.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#383838] rounded-xl p-4 border border-gray-600">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#F70000]/20 rounded-lg flex items-center justify-center">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-[#F70000]" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Expense Ratio</p>
                            <p className="text-xl font-bold text-white">{metrics.expenseRatio.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Suggestion */}
            {currentSuggestion && (
                <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Latest Suggestion</h3>
                    <div className="bg-[#232326] rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h4 className="text-lg font-bold text-white mb-2">{currentSuggestion.productName}</h4>
                                <p className="text-gray-400">{currentSuggestion.category}</p>
                            </div>
                            {(() => {
                                const { icon: Icon, color, bgColor } = getSuggestionIcon(currentSuggestion.suggestion);
                                return (
                                    <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 ${color}`} />
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <p className="text-gray-400 text-sm">Total Price</p>
                                <p className="text-xl font-bold text-white">₹{currentSuggestion.fullPrice.toLocaleString()}</p>
                            </div>
                            {currentSuggestion.monthlyEMI > 0 && currentSuggestion.duration > 0 ? (
                                <>
                                    <div>
                                        <p className="text-gray-400 text-sm">Monthly EMI</p>
                                        <p className="text-xl font-bold text-[#F70000]">₹{currentSuggestion.monthlyEMI.toFixed(0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Duration</p>
                                        <p className="text-xl font-bold text-white">{currentSuggestion.duration} months</p>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p className="text-gray-400 text-sm">Payment Type</p>
                                    <p className="text-xl font-bold text-white">One-time</p>
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                                {(() => {
                                    const { icon: Icon, color } = getSuggestionIcon(currentSuggestion.suggestion);
                                    return <Icon className={`w-5 h-5 ${color}`} />;
                                })()}
                                <span className="text-white font-medium">
                                    {getSuggestionLabel(currentSuggestion.suggestion)}
                                </span>
                            </div>
                            <p className="text-gray-300">{currentSuggestion.reason}</p>
                            {currentSuggestion.explanation && (
                                <p className="text-gray-400 text-sm mt-2">{currentSuggestion.explanation}</p>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => saveAsPlannedEMI(currentSuggestion)}
                                className="flex-1 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                Save as Planned EMI
                            </button>
                            <button
                                onClick={() => setCurrentSuggestion(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-[#383838] rounded-lg transition-colors duration-200"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Suggestions */}
            {suggestions.length > 0 && (
                <div className="bg-[#383838] rounded-2xl border border-gray-600 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-600">
                        <h3 className="text-xl font-bold text-white">Recent Suggestions</h3>
                    </div>
                    <div className="divide-y divide-gray-600">
                        {suggestions.slice(0, 5).map((suggestion) => (
                            <div key={suggestion.id} className="p-6 hover:bg-[#232326] transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {(() => {
                                            const { icon: Icon, color } = getSuggestionIcon(suggestion.suggestion);
                                            return <Icon className={`w-6 h-6 ${color}`} />;
                                        })()}
                                        <div>
                                            <h4 className="text-white font-medium">{suggestion.productName}</h4>
                                            <p className="text-gray-400 text-sm">
                                                {suggestion.monthlyEMI > 0 && suggestion.duration > 0
                                                    ? `₹${suggestion.monthlyEMI.toFixed(0)}/month • ${suggestion.duration} months`
                                                    : `One-time • ₹${suggestion.fullPrice.toLocaleString()}`}
                                            </p>
                                            <p className="text-gray-300 text-sm mt-2">{suggestion.reason}</p>
                                            {suggestion.explanation && (
                                                <p className="text-gray-400 text-xs mt-1">{suggestion.explanation}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-medium">
                                            {getSuggestionLabel(suggestion.suggestion)}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            {suggestion.timestamp.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Product Input Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-[#232326] rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">Suggest a Product</h3>
                            <button
                                onClick={closeForm}
                                className="p-2 text-gray-400 hover:text-white hover:bg-[#383838] rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Product Name */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    name="productName"
                                    value={formData.productName}
                                    onChange={handleInputChange}
                                    placeholder="e.g., iPhone 15, Gaming Laptop"
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent placeholder-gray-500"
                                    required
                                />
                            </div>

                            {/* Input Type Toggle */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Input Type
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="inputType"
                                            value="fullPrice"
                                            checked={formData.inputType === 'fullPrice'}
                                            onChange={handleInputChange}
                                            className="text-[#F70000] bg-[#383838] border-gray-600 focus:ring-[#F70000]"
                                        />
                                        <span className="text-gray-300">Full Price</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="inputType"
                                            value="emi"
                                            checked={formData.inputType === 'emi'}
                                            onChange={handleInputChange}
                                            className="text-[#F70000] bg-[#383838] border-gray-600 focus:ring-[#F70000]"
                                        />
                                        <span className="text-gray-300">Monthly EMI</span>
                                    </label>
                                </div>
                            </div>

                            {/* Amount Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    {formData.inputType === 'fullPrice' ? 'Full Price' : 'Monthly EMI Amount'} *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                                    <input
                                        type="number"
                                        name={formData.inputType === 'fullPrice' ? 'fullPrice' : 'monthlyEMI'}
                                        value={formData.inputType === 'fullPrice' ? formData.fullPrice : formData.monthlyEMI}
                                        onChange={handleInputChange}
                                        placeholder={formData.inputType === 'fullPrice' ? '1000.00' : '100.00'}
                                        step="any"
                                        min="0.01"
                                        max={formData.inputType === 'fullPrice' ? '10000000' : '100000'}
                                        className="w-full pl-8 pr-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent placeholder-gray-500"
                                        required
                                    />
                                </div>
                                <p className="text-gray-500 text-xs mt-1">
                                    {formData.inputType === 'fullPrice'
                                        ? 'Enter the total price of the product'
                                        : 'Enter the monthly EMI amount you would pay'
                                    }
                                </p>
                            </div>

                            {/* Duration - Only show for EMI */}
                            {formData.inputType === 'emi' && (
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Duration (months) *
                                    </label>
                                    <input
                                        type="number"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        placeholder="12"
                                        min="1"
                                        max="120"
                                        step="1"
                                        className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent placeholder-gray-500"
                                        required
                                    />
                                    <p className="text-gray-500 text-xs mt-1">
                                        Enter the number of months for EMI (1-120 months)
                                    </p>
                                </div>
                            )}

                            {/* Category */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Category (Optional)
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent"
                                >
                                    <option value="">Select Category</option>
                                    {PRODUCT_CATEGORIES.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Calculation Preview */}
                            {formData.fullPrice && formData.inputType === 'fullPrice' && (
                                <div className="bg-[#383838] rounded-lg p-4 border border-gray-600">
                                    <p className="text-gray-400 text-sm mb-1">Full Price Purchase</p>
                                    <p className="text-2xl font-bold text-[#F70000]">
                                        ₹{parseFloat(formData.fullPrice).toLocaleString()}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1">One-time payment</p>
                                </div>
                            )}

                            {formData.monthlyEMI && formData.duration && formData.inputType === 'emi' && (
                                <div className="bg-[#383838] rounded-lg p-4 border border-gray-600">
                                    <p className="text-gray-400 text-sm mb-1">Total Price</p>
                                    <p className="text-2xl font-bold text-[#F70000]">
                                        ₹{calculateTotalPrice(parseFloat(formData.monthlyEMI), parseInt(formData.duration)).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="flex-1 px-4 py-3 text-gray-300 bg-[#383838] hover:bg-gray-600 rounded-lg transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingAI}
                                    className="flex-1 px-4 py-3 bg-[#F70000] hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
                                >
                                    {loadingAI ? 'Getting…' : 'Get Suggestion'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 