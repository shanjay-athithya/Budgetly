'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
    CurrencyDollarIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    CalendarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    ChartBarIcon,
    FireIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { utils, Expense, IncomeEntry } from '../services/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

export default function Dashboard() {
    const { state, setCurrentMonth } = useData();
    const { user, currentMonth, incomes, expenses, emis, loading, error } = state;
    const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' }[]>([]);
    const [showAlerts, setShowAlerts] = useState(true);

    // Calculate financial metrics for selected month
    const calculateMetrics = useCallback(() => {
        if (!user || !currentMonth) return {
            totalIncome: 0, totalExpenses: 0, currentSavings: 0, totalEMIs: 0, expenseRatio: 0, emiRatio: 0
        };
        const monthData = user.months && user.months[currentMonth];
        if (!monthData) return {
            totalIncome: 0, totalExpenses: 0, currentSavings: 0, totalEMIs: 0, expenseRatio: 0, emiRatio: 0
        };
        const totalIncome = monthData.income.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = utils.calculateTotalExpenses(monthData.expenses);
        const totalEMIs = utils.calculateTotalEMIBurden(monthData.expenses);
        const currentSavings = totalIncome - totalExpenses;
        const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
        const emiRatio = totalIncome > 0 ? (totalEMIs / totalIncome) * 100 : 0;
        return { totalIncome, totalExpenses, currentSavings, totalEMIs, expenseRatio, emiRatio };
    }, [user, currentMonth]);

    // Get available months for dropdown
    const getAvailableMonths = () => {
        if (!user || !user.months) return [];
        // Handle months as a regular object
        const months = Object.keys(user.months).sort().reverse();
        return months.length > 0 ? months : [currentMonth];
    };

    // Generate monthly data for charts
    const generateMonthlyData = useCallback(() => {
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

    // Generate category breakdown for pie chart
    const generateCategoryBreakdown = useCallback(() => {
        if (!user || !currentMonth) return [];
        const monthData = user.months && user.months[currentMonth];
        if (!monthData) return [];

        const categoryMap = new Map<string, number>();
        monthData.expenses.forEach((expense: Expense) => {
            const category = expense.category;
            const amount = expense.amount;
            categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        });

        return Array.from(categoryMap.entries()).map(([category, amount]) => ({
            category,
            amount
        }));
    }, [user, currentMonth]);

    // Generate spending trends for line chart
    const generateSpendingTrends = useCallback(() => {
        if (!user || !user.months) return [];

        const months = Object.keys(user.months).sort();
        return months.map(month => {
            const monthData = user.months[month];
            const totalIncome = monthData.income.reduce((sum, item) => sum + item.amount, 0);
            const totalExpenses = utils.calculateTotalExpenses(monthData.expenses);
            const savings = totalIncome - totalExpenses;
            return {
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                savings: savings
            };
        });
    }, [user]);

    // Generate alerts based on financial health
    const generateAlerts = () => {
        if (!user) return [];

        const metrics = calculateMetrics();
        const alerts = [];

        // High expense ratio alert
        if (metrics.expenseRatio > 80) {
            alerts.push({
                type: 'warning',
                icon: ExclamationTriangleIcon,
                title: 'High Expense Ratio',
                message: `Your expenses are ${metrics.expenseRatio.toFixed(1)}% of your income. Consider reducing spending.`
            });
        }

        // EMI burden alert
        if (metrics.emiRatio > 40) {
            alerts.push({
                type: 'danger',
                icon: FireIcon,
                title: 'High EMI Burden',
                message: `EMIs are ${metrics.emiRatio.toFixed(1)}% of your income. This may impact your financial flexibility.`
            });
        }

        // Low savings alert
        if (metrics.currentSavings < 0) {
            alerts.push({
                type: 'danger',
                icon: ExclamationTriangleIcon,
                title: 'Negative Savings',
                message: 'Your expenses exceed your income this month. Review your budget immediately.'
            });
        } else if (metrics.currentSavings < metrics.totalIncome * 0.2) {
            alerts.push({
                type: 'warning',
                icon: ClockIcon,
                title: 'Low Savings Rate',
                message: `You're saving ${((metrics.currentSavings / metrics.totalIncome) * 100).toFixed(1)}% of your income. Aim for at least 20%.`
            });
        }

        // Positive alerts
        if (metrics.expenseRatio < 60 && metrics.currentSavings > 0) {
            alerts.push({
                type: 'success',
                icon: CheckCircleIcon,
                title: 'Great Financial Health',
                message: `You're saving ${((metrics.currentSavings / metrics.totalIncome) * 100).toFixed(1)}% of your income. Keep it up!`
            });
        }

        return alerts;
    };

    // Toast notification system
    const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    };

    // Handle month change
    const handleMonthChange = (month: string) => {
        setCurrentMonth(month);
    };

    // Calculate metrics
    const metrics = calculateMetrics();
    const monthlyData = generateMonthlyData();
    const categoryBreakdown = generateCategoryBreakdown();
    const spendingTrends = generateSpendingTrends();
    const alerts = generateAlerts();
    const availableMonths = getAvailableMonths();

    // Chart configurations
    const monthlyChartData = {
        labels: monthlyData.map(d => d.month),
        datasets: [
            {
                label: 'Income',
                data: monthlyData.map(d => d.income),
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2
            },
            {
                label: 'Expenses',
                data: monthlyData.map(d => d.expenses),
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2
            },
            {
                label: 'Savings',
                data: monthlyData.map(d => d.savings),
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2
            }
        ]
    };

    const categoryChartData = {
        labels: categoryBreakdown.map(d => d.category),
        datasets: [{
            data: categoryBreakdown.map(d => d.amount),
            backgroundColor: [
                '#F70000', '#FF6B6B', '#4ECDC4', '#45B7D1',
                '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
            ],
            borderWidth: 0
        }]
    };

    const spendingTrendsData = {
        labels: spendingTrends.map(d => d.month),
        datasets: [{
            label: 'Monthly Spending',
            data: spendingTrends.map(d => d.savings),
            borderColor: '#F70000',
            backgroundColor: 'rgba(247, 0, 0, 0.1)',
            fill: true,
            tension: 0.4
        }]
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
                    <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Month Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Financial Dashboard</h1>
                    <p className="text-gray-400">Track your income, expenses, and savings</p>
                </div>
                <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <select
                        value={currentMonth}
                        onChange={(e) => handleMonthChange(e.target.value)}
                        className="bg-[#232326] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                    >
                        {availableMonths.map(month => (
                            <option key={month} value={month}>
                                {new Date(month + '-01').toLocaleDateString('en-US', {
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Income</p>
                            <p className="text-2xl font-bold text-green-400">₹{metrics.totalIncome.toLocaleString()}</p>
                        </div>
                        <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-400">₹{metrics.totalExpenses.toLocaleString()}</p>
                        </div>
                        <CreditCardIcon className="h-8 w-8 text-red-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Current Savings</p>
                            <p className={`text-2xl font-bold ${metrics.currentSavings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                ₹{metrics.currentSavings.toLocaleString()}
                            </p>
                        </div>
                        <BuildingLibraryIcon className="h-8 w-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">EMI Burden</p>
                            <p className="text-2xl font-bold text-orange-400">₹{metrics.totalEMIs.toLocaleString()}</p>
                        </div>
                        <ClockIcon className="h-8 w-8 text-orange-400" />
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Overview Chart */}
                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <h3 className="text-lg font-semibold text-white mb-4">Monthly Overview</h3>
                    <div className="h-64">
                        <Bar
                            data={monthlyChartData}
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

                {/* Category Breakdown */}
                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <h3 className="text-lg font-semibold text-white mb-4">Expense Categories</h3>
                    <div className="h-64">
                        <Doughnut
                            data={categoryChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#9CA3AF' }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Spending Trends */}
            <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4">Spending Trends</h3>
                <div className="h-64">
                    <Line
                        data={spendingTrendsData}
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

            {/* Financial Alerts */}
            {showAlerts && alerts.length > 0 && (
                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Financial Alerts</h3>
                        <button
                            onClick={() => setShowAlerts(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-3">
                        {alerts.map((alert, index) => {
                            const Icon = alert.icon;
                            return (
                                <div
                                    key={index}
                                    className={`flex items-center space-x-3 p-3 rounded-lg ${alert.type === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                                        alert.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                                            'bg-red-500/10 border border-red-500/20'
                                        }`}
                                >
                                    <Icon className={`h-5 w-5 ${alert.type === 'success' ? 'text-green-400' :
                                        alert.type === 'warning' ? 'text-yellow-400' :
                                            'text-red-400'
                                        }`} />
                                    <div>
                                        <p className={`font-medium ${alert.type === 'success' ? 'text-green-400' :
                                            alert.type === 'warning' ? 'text-yellow-400' :
                                                'text-red-400'
                                            }`}>
                                            {alert.title}
                                        </p>
                                        <p className="text-gray-400 text-sm">{alert.message}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' :
                            toast.type === 'error' ? 'bg-red-500 text-white' :
                                toast.type === 'warning' ? 'bg-yellow-500 text-white' :
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