'use client';

import React, { useState, useEffect } from 'react';
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
    netIncome: number;
    netExpense: number;
    netSavings: number;
}

interface SavingsManagerProps {
    incomes?: any[];
    expenses?: any[];
    onUpdateSavings?: (amount: number) => Promise<void>;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function SavingsManager({ incomes = [], expenses = [], onUpdateSavings }: SavingsManagerProps) {
    const [savingsHistory, setSavingsHistory] = useState<SavingsEntry[]>([]);
    const [currentSavings, setCurrentSavings] = useState(0);
    const [isEditingSavings, setIsEditingSavings] = useState(false);
    const [editingAmount, setEditingAmount] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [loading, setLoading] = useState(false);

    // Calculate savings history from income and expenses
    useEffect(() => {
        const calculateSavingsHistory = () => {
            const monthlyData: { [key: string]: { income: number; expense: number } } = {};

            // Process incomes
            incomes.forEach(income => {
                const month = income.date;
                if (!monthlyData[month]) {
                    monthlyData[month] = { income: 0, expense: 0 };
                }
                monthlyData[month].income += income.amount;
            });

            // Process expenses
            expenses.forEach(expense => {
                const month = expense.date.slice(0, 7); // Get YYYY-MM from date
                if (!monthlyData[month]) {
                    monthlyData[month] = { income: 0, expense: 0 };
                }
                monthlyData[month].expense += expense.amount;
            });

            // Convert to savings entries
            const history: SavingsEntry[] = Object.keys(monthlyData)
                .sort()
                .map(month => ({
                    month,
                    netIncome: monthlyData[month].income,
                    netExpense: monthlyData[month].expense,
                    netSavings: monthlyData[month].income - monthlyData[month].expense
                }));

            setSavingsHistory(history);

            // Calculate current total savings
            const totalSavings = history.reduce((sum, entry) => sum + entry.netSavings, 0);
            setCurrentSavings(totalSavings);
        };

        calculateSavingsHistory();
    }, [incomes, expenses]);

    // Toast management
    const addToast = (message: string, type: Toast['type']) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };

    // Handle savings editing
    const startEditingSavings = () => {
        setEditingAmount(currentSavings.toString());
        setIsEditingSavings(true);
    };

    const cancelEditingSavings = () => {
        setIsEditingSavings(false);
        setEditingAmount('');
    };

    const saveSavingsAdjustment = async () => {
        const newAmount = parseFloat(editingAmount);
        if (isNaN(newAmount) || newAmount < 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        setLoading(true);
        try {
            if (onUpdateSavings) {
                await onUpdateSavings(newAmount);
            } else {
                // Local state management if no backend
                setCurrentSavings(newAmount);
            }
            addToast('Savings updated successfully!', 'success');
            setIsEditingSavings(false);
        } catch (error) {
            addToast('Failed to update savings. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Chart data for monthly savings
    const chartData = {
        labels: savingsHistory.map(entry => {
            const [year, month] = entry.month.split('-');
            return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
        }),
        datasets: [
            {
                label: 'Monthly Savings',
                data: savingsHistory.map(entry => entry.netSavings),
                borderColor: '#F70000',
                backgroundColor: 'rgba(247, 0, 0, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#F70000',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#232326',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                borderColor: '#F70000',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                    label: function (context: any) {
                        return `Savings: $${context.parsed.y.toLocaleString()}`;
                    },
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    color: '#A0A0A0',
                    font: {
                        family: 'Lexend',
                        size: 12,
                    },
                },
                grid: {
                    color: '#383838',
                },
            },
            y: {
                ticks: {
                    color: '#A0A0A0',
                    font: {
                        family: 'Lexend',
                        size: 12,
                    },
                    callback: function (value: any) {
                        return '$' + value.toLocaleString();
                    },
                },
                grid: {
                    color: '#383838',
                },
            },
        },
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const [year, month] = dateString.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    // Calculate additional metrics
    const totalIncome = savingsHistory.reduce((sum, entry) => sum + entry.netIncome, 0);
    const totalExpenses = savingsHistory.reduce((sum, entry) => sum + entry.netExpense, 0);
    const averageMonthlySavings = savingsHistory.length > 0
        ? savingsHistory.reduce((sum, entry) => sum + entry.netSavings, 0) / savingsHistory.length
        : 0;

    return (
        <div className="space-y-6">
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' :
                            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Current Savings Card */}
            <div className="bg-gradient-to-br from-[#F70000]/10 to-[#F70000]/5 rounded-2xl p-8 border border-[#F70000]/20 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-[#F70000]/20 rounded-xl flex items-center justify-center">
                            <BuildingLibraryIcon className="w-8 h-8 text-[#F70000]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Current Savings</h2>
                            <p className="text-gray-400">Your total accumulated savings</p>
                        </div>
                    </div>

                    {isEditingSavings ? (
                        <div className="flex items-center space-x-2">
                            <input
                                type="number"
                                value={editingAmount}
                                onChange={(e) => setEditingAmount(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] text-right font-bold text-xl"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                            <button
                                onClick={saveSavingsAdjustment}
                                disabled={loading}
                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                title="Save"
                            >
                                <CheckIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={cancelEditingSavings}
                                className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                title="Cancel"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-5xl font-bold text-white">${currentSavings.toLocaleString()}</p>
                                <p className="text-gray-400 text-sm">Total accumulated</p>
                            </div>
                            <button
                                onClick={startEditingSavings}
                                className="p-2 text-gray-400 hover:text-white hover:bg-[#383838] rounded-lg transition-colors"
                                title="Edit savings"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#383838] rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Income</p>
                                <p className="text-xl font-bold text-white">${totalIncome.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#383838] rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                                <CurrencyDollarIcon className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Expenses</p>
                                <p className="text-xl font-bold text-white">${totalExpenses.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#383838] rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#F70000]/20 rounded-lg flex items-center justify-center">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-[#F70000]" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Avg Monthly</p>
                                <p className="text-xl font-bold text-white">${averageMonthlySavings.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Savings Chart */}
            <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Monthly Savings Trend</h3>
                <div className="h-80">
                    {savingsHistory.length > 0 ? (
                        <Line data={chartData} options={chartOptions} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <BuildingLibraryIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                                <p className="text-lg font-medium">No savings data yet</p>
                                <p className="text-sm">Add income and expenses to see your savings trend</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Savings History Table */}
            <div className="bg-[#383838] rounded-2xl border border-gray-600 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-600">
                    <h3 className="text-xl font-bold text-white">Savings History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#232326] border-b border-gray-600">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Month</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Net Income</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Net Expense</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Net Savings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                            {savingsHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        <BuildingLibraryIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                        <p className="text-lg font-medium">No savings history</p>
                                        <p className="text-sm">Add income and expenses to see your savings breakdown</p>
                                    </td>
                                </tr>
                            ) : (
                                savingsHistory.map((entry) => (
                                    <tr key={entry.month} className="hover:bg-[#232326] transition-colors">
                                        <td className="px-6 py-4 text-white font-medium">
                                            {formatDate(entry.month)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-green-400 font-bold">
                                            ${entry.netIncome.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-red-400 font-bold">
                                            ${entry.netExpense.toLocaleString()}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${entry.netSavings >= 0 ? 'text-[#F70000]' : 'text-red-500'
                                            }`}>
                                            ${entry.netSavings.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 