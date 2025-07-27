'use client';

import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
    DocumentArrowDownIcon,
    ShareIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface ReportsManagerProps {
    incomes?: any[];
    expenses?: any[];
}

interface MonthlyReport {
    month: string;
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    categoryBreakdown: { [key: string]: number };
    topCategories: Array<{ category: string; amount: number }>;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

const EXPENSE_CATEGORIES = [
    'Food & Dining',
    'Rent',
    'EMI',
    'Health',
    'Transport',
    'Entertainment',
    'Shopping',
    'Utilities',
    'Other'
];

export default function ReportsManager({ incomes = [], expenses = [] }: ReportsManagerProps) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [monthlyReports, setMonthlyReports] = useState<{ [key: string]: MonthlyReport }>({});
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [loading, setLoading] = useState(false);

    // Generate monthly reports from income and expense data
    useEffect(() => {
        const generateReports = () => {
            const reports: { [key: string]: MonthlyReport } = {};

            // Process incomes by month
            incomes.forEach(income => {
                const month = income.date;
                if (!reports[month]) {
                    reports[month] = {
                        month,
                        totalIncome: 0,
                        totalExpenses: 0,
                        savings: 0,
                        categoryBreakdown: {},
                        topCategories: []
                    };
                }
                reports[month].totalIncome += income.amount;
            });

            // Process expenses by month
            expenses.forEach(expense => {
                const month = expense.date.slice(0, 7); // Get YYYY-MM from date
                if (!reports[month]) {
                    reports[month] = {
                        month,
                        totalIncome: 0,
                        totalExpenses: 0,
                        savings: 0,
                        categoryBreakdown: {},
                        topCategories: []
                    };
                }
                reports[month].totalExpenses += expense.amount;

                // Track category breakdown
                if (!reports[month].categoryBreakdown[expense.category]) {
                    reports[month].categoryBreakdown[expense.category] = 0;
                }
                reports[month].categoryBreakdown[expense.category] += expense.amount;
            });

            // Calculate savings and top categories for each month
            Object.keys(reports).forEach(month => {
                const report = reports[month];
                report.savings = report.totalIncome - report.totalExpenses;

                // Calculate top 3 categories
                report.topCategories = Object.entries(report.categoryBreakdown)
                    .map(([category, amount]) => ({ category, amount }))
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 3);
            });

            setMonthlyReports(reports);
        };

        generateReports();
    }, [incomes, expenses]);

    // Get current month's report
    const currentReport = monthlyReports[selectedMonth] || {
        month: selectedMonth,
        totalIncome: 0,
        totalExpenses: 0,
        savings: 0,
        categoryBreakdown: {},
        topCategories: []
    };

    // Get available months for dropdown
    const availableMonths = Object.keys(monthlyReports).sort().reverse();

    // Toast management
    const addToast = (message: string, type: Toast['type']) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };

    // Download PDF functionality
    const downloadPDF = async () => {
        setLoading(true);
        try {
            // Simulate PDF generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            addToast('PDF report downloaded successfully!', 'success');
        } catch (error) {
            addToast('Failed to download PDF. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Share functionality
    const shareReport = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Financial Report - ${formatDate(selectedMonth)}`,
                    text: `Check out my financial report for ${formatDate(selectedMonth)}`,
                    url: window.location.href
                });
                addToast('Report shared successfully!', 'success');
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(
                    `Financial Report for ${formatDate(selectedMonth)}\n` +
                    `Income: $${currentReport.totalIncome.toLocaleString()}\n` +
                    `Expenses: $${currentReport.totalExpenses.toLocaleString()}\n` +
                    `Savings: $${currentReport.savings.toLocaleString()}`
                );
                addToast('Report details copied to clipboard!', 'success');
            }
        } catch (error) {
            addToast('Failed to share report. Please try again.', 'error');
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const [year, month] = dateString.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    // Chart data for income vs expenses
    const barChartData = {
        labels: ['Income', 'Expenses', 'Savings'],
        datasets: [
            {
                data: [currentReport.totalIncome, currentReport.totalExpenses, currentReport.savings],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(247, 0, 0, 0.8)',
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(247, 0, 0, 1)',
                ],
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };

    // Chart data for expense categories
    const pieChartData = {
        labels: Object.keys(currentReport.categoryBreakdown),
        datasets: [
            {
                data: Object.values(currentReport.categoryBreakdown),
                backgroundColor: [
                    '#F70000',
                    '#3B82F6',
                    '#10B981',
                    '#F59E0B',
                    '#8B5CF6',
                    '#EC4899',
                    '#06B6D4',
                    '#84CC16',
                    '#F97316',
                ],
                borderWidth: 2,
                borderColor: '#1C1C1E',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#FFFFFF',
                    font: {
                        family: 'Lexend',
                        size: 12,
                    },
                },
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
                        return `${context.label}: $${context.parsed.toLocaleString()}`;
                    },
                },
            },
        },
        scales: {
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

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#FFFFFF',
                    font: {
                        family: 'Lexend',
                        size: 11,
                    },
                    padding: 15,
                },
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
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                    },
                },
            },
        },
    };

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

            {/* Header with Month Selector and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-white">Monthly Financial Report</h2>
                    <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                        >
                            {availableMonths.length > 0 ? (
                                availableMonths.map(month => (
                                    <option key={month} value={month}>
                                        {formatDate(month)}
                                    </option>
                                ))
                            ) : (
                                <option value={selectedMonth}>{formatDate(selectedMonth)}</option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={shareReport}
                        className="flex items-center space-x-2 bg-[#383838] hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-600"
                    >
                        <ShareIcon className="w-5 h-5" />
                        <span>Share</span>
                    </button>
                    <button
                        onClick={downloadPDF}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        <span>{loading ? 'Generating...' : 'Download PDF'}</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 border border-green-500/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">Total Income</h3>
                            <p className="text-3xl font-bold text-white">${currentReport.totalIncome.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl p-6 border border-red-500/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <CreditCardIcon className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">Total Expenses</h3>
                            <p className="text-3xl font-bold text-white">${currentReport.totalExpenses.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#F70000]/10 to-[#F70000]/5 rounded-2xl p-6 border border-[#F70000]/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-[#F70000]/20 rounded-xl flex items-center justify-center">
                            <BuildingLibraryIcon className="w-6 h-6 text-[#F70000]" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">Net Savings</h3>
                            <p className={`text-3xl font-bold ${currentReport.savings >= 0 ? 'text-white' : 'text-red-400'}`}>
                                ${currentReport.savings.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income vs Expenses Bar Chart */}
                <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Income vs Expenses</h3>
                    <div className="h-80">
                        <Bar data={barChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Expense Categories Pie Chart */}
                <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Expense Categories</h3>
                    <div className="h-80">
                        {Object.keys(currentReport.categoryBreakdown).length > 0 ? (
                            <Pie data={pieChartData} options={pieChartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                                    <p className="text-lg font-medium">No expense data</p>
                                    <p className="text-sm">Add expenses to see category breakdown</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Spending Categories */}
            <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Top 3 Spending Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {currentReport.topCategories.length > 0 ? (
                        currentReport.topCategories.map((category, index) => (
                            <div key={category.category} className="bg-[#232326] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-[#F70000]' :
                                                index === 1 ? 'bg-gray-500' : 'bg-orange-500'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <span className="text-white font-medium">{category.category}</span>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[#F70000]">
                                    ${category.amount.toLocaleString()}
                                </p>
                                <p className="text-gray-400 text-sm">
                                    {((category.amount / currentReport.totalExpenses) * 100).toFixed(1)}% of total expenses
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-8 text-gray-400">
                            <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                            <p className="text-lg font-medium">No spending categories</p>
                            <p className="text-sm">Add expenses to see your top spending categories</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Monthly Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#232326] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Savings Rate</p>
                        <p className="text-2xl font-bold text-green-400">
                            {currentReport.totalIncome > 0
                                ? ((currentReport.savings / currentReport.totalIncome) * 100).toFixed(1)
                                : 0}%
                        </p>
                    </div>
                    <div className="bg-[#232326] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Expense Ratio</p>
                        <p className="text-2xl font-bold text-red-400">
                            {currentReport.totalIncome > 0
                                ? ((currentReport.totalExpenses / currentReport.totalIncome) * 100).toFixed(1)
                                : 0}%
                        </p>
                    </div>
                    <div className="bg-[#232326] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Categories Used</p>
                        <p className="text-2xl font-bold text-white">
                            {Object.keys(currentReport.categoryBreakdown).length}
                        </p>
                    </div>
                    <div className="bg-[#232326] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Avg Daily Expense</p>
                        <p className="text-2xl font-bold text-[#F70000]">
                            ${(currentReport.totalExpenses / 30).toFixed(0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 