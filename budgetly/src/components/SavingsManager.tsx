'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    BuildingLibraryIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { utils, Expense, IncomeEntry } from '../services/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface SavingsEntry {
    month: string; // YYYY-MM format
    income: number;
    expenses: number;
    savings: number;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function SavingsManager() {
    const { state, updateUser } = useData();
    const { user, currentMonth, loading, error } = state;

    const [savingsHistory, setSavingsHistory] = useState<SavingsEntry[]>([]);
    const [currentSavings, setCurrentSavings] = useState(0);
    const [isEditingSavings, setIsEditingSavings] = useState(false);
    const [editingAmount, setEditingAmount] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [localLoading, setLocalLoading] = useState(false);

    // Memoize the calculation to prevent infinite loops
    const calculateSavingsHistory = useCallback(() => {
        if (!user || !user.months) return [];

        const months = Object.keys(user.months).sort();
        return months.map(month => {
            const monthData = user.months[month];
            const totalIncome = monthData.income.reduce((sum, item) => sum + item.amount, 0);
            const totalExpenses = utils.calculateTotalExpenses(monthData.expenses);
            const savings = totalIncome - totalExpenses;

            return {
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                income: totalIncome,
                expenses: totalExpenses,
                savings: savings
            };
        });
    }, [user]);

    // Calculate savings history when user data changes
    useEffect(() => {
        const history = calculateSavingsHistory();
        setSavingsHistory(history);
        const totalSavings = history.reduce((sum, entry) => sum + entry.savings, 0);
        setCurrentSavings(totalSavings);
    }, [calculateSavingsHistory]);

    // Toast management
    const addToast = useCallback((message: string, type: Toast['type']) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    // Handle savings editing
    const startEditingSavings = useCallback(() => {
        setEditingAmount(currentSavings.toString());
        setIsEditingSavings(true);
    }, [currentSavings]);

    const cancelEditingSavings = useCallback(() => {
        setIsEditingSavings(false);
        setEditingAmount('');
    }, []);

    const saveSavingsAdjustment = useCallback(async () => {
        if (!user) {
            addToast('User not found', 'error');
            return;
        }

        const newAmount = parseFloat(editingAmount);
        if (isNaN(newAmount) || newAmount < 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        setLocalLoading(true);
        try {
            await updateUser(user.uid, { savings: newAmount });
            addToast('Savings updated successfully!', 'success');
            setIsEditingSavings(false);
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Failed to update savings. Please try again.', 'error');
        } finally {
            setLocalLoading(false);
        }
    }, [user, editingAmount, updateUser, addToast]);

    // Memoize chart data
    const chartData = useMemo(() => {
        if (savingsHistory.length === 0) {
            return {
                labels: [],
                datasets: [{
                    label: 'Net Savings',
                    data: [],
                    borderColor: '#F70000',
                    backgroundColor: 'rgba(247, 0, 0, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            };
        }

        return {
            labels: savingsHistory.map(entry =>
                entry.month
            ),
            datasets: [{
                label: 'Net Savings',
                data: savingsHistory.map(entry => entry.savings),
                borderColor: '#F70000',
                backgroundColor: 'rgba(247, 0, 0, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    }, [savingsHistory]);

    // Calculate current month savings
    const currentMonthSavings = useMemo(() => {
        if (!user || !currentMonth || !user.months) return 0;

        const monthData = user.months[currentMonth];
        if (!monthData) return 0;

        const totalIncome = monthData.income.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = utils.calculateTotalExpenses(monthData.expenses);
        return totalIncome - totalExpenses;
    }, [user, currentMonth]);

    // Calculate savings rate
    const savingsRate = useMemo(() => {
        if (!user || !currentMonth || !user.months) return 0;

        const monthData = user.months[currentMonth];
        if (!monthData) return 0;

        const totalIncome = monthData.income.reduce((sum, item) => sum + item.amount, 0);
        if (totalIncome === 0) return 0;

        const totalExpenses = utils.calculateTotalExpenses(monthData.expenses);
        const savings = totalIncome - totalExpenses;
        return (savings / totalIncome) * 100;
    }, [user, currentMonth]);

    const formatDate = (dateString: string) => {
        return new Date(dateString + '-01').toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#F70000]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                    <BuildingLibraryIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Savings Data</h3>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Savings Overview</h1>
                    <p className="text-gray-400">Track your savings progress and financial goals</p>
                </div>
                <button
                    onClick={startEditingSavings}
                    className="flex items-center space-x-2 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                    <PencilIcon className="h-5 w-5" />
                    <span>Adjust Savings</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Savings</p>
                            <p className={`text-2xl font-bold ${currentSavings >= 0 ? 'text-green-400' : 'text-[#F70000]'}`}>
                                ₹{currentSavings.toLocaleString()}
                            </p>
                        </div>
                        <BuildingLibraryIcon className="h-8 w-8 text-green-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">This Month</p>
                            <p className={`text-2xl font-bold ${currentMonthSavings >= 0 ? 'text-blue-400' : 'text-[#F70000]'}`}>
                                ₹{currentMonthSavings.toLocaleString()}
                            </p>
                        </div>
                        <ArrowTrendingUpIcon className="h-8 w-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Savings Rate</p>
                            <p className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-green-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-[#F70000]'}`}>
                                {savingsRate.toFixed(1)}%
                            </p>
                        </div>
                        <CurrencyDollarIcon className="h-8 w-8 text-purple-400" />
                    </div>
                </div>
            </div>

            {/* Savings Chart */}
            <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4">Savings Trend</h3>
                <div className="h-64">
                    <Line
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    labels: { color: '#9CA3AF' }
                                }
                            },
                            scales: {
                                x: {
                                    ticks: { color: '#9CA3AF' },
                                    grid: { color: '#374151' }
                                },
                                y: {
                                    ticks: { color: '#9CA3AF' },
                                    grid: { color: '#374151' }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Savings History */}
            <div className="bg-[#232326] rounded-xl border border-gray-600">
                <div className="p-6 border-b border-gray-600">
                    <h2 className="text-lg font-semibold text-white">Monthly Savings History</h2>
                </div>

                {savingsHistory.length === 0 ? (
                    <div className="p-8 text-center">
                        <BuildingLibraryIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No Savings Data</h3>
                        <p className="text-gray-500">Add income and expenses to see your savings history</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-600">
                        {savingsHistory.slice(-6).reverse().map((entry) => (
                            <div key={entry.month} className="p-6 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${entry.savings >= 0 ? 'bg-green-500/20' : 'bg-[#F70000]/20'
                                        }`}>
                                        <BuildingLibraryIcon className={`h-6 w-6 ${entry.savings >= 0 ? 'text-green-400' : 'text-[#F70000]'
                                            }`} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{formatDate(entry.month)}</h3>
                                        <p className="text-gray-400 text-sm">
                                            Income: ₹{entry.income.toLocaleString()} |
                                            Expenses: ₹{entry.expenses.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-bold ${entry.savings >= 0 ? 'text-green-400' : 'text-[#F70000]'
                                        }`}>
                                        ₹{entry.savings.toLocaleString()}
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        {entry.income > 0 ? ((entry.savings / entry.income) * 100).toFixed(1) : 0}% rate
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Savings Modal */}
            {isEditingSavings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#232326] rounded-xl p-6 w-full max-w-md mx-4 border border-gray-600">
                        <h2 className="text-xl font-bold text-white mb-4">Adjust Total Savings</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    New Total Savings (₹)
                                </label>
                                <input
                                    type="number"
                                    value={editingAmount}
                                    onChange={(e) => setEditingAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={cancelEditingSavings}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveSavingsAdjustment}
                                    disabled={localLoading}
                                    className="flex-1 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                >
                                    {localLoading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' :
                            toast.type === 'error' ? 'bg-[#F70000] text-white' :
                                'bg-blue-500 text-white'
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
} 