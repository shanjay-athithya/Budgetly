'use client';

import React from 'react';
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
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    CurrencyDollarIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

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
    // Sample data - in a real app, this would come from your API/database
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    // Summary cards data
    const summaryData = {
        income: 4200,
        expenses: 2800,
        savings: 1400
    };

    // Last 6 months data for bar chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyData = {
        income: [3800, 4200, 3900, 4500, 4100, 4200],
        expenses: [3200, 2800, 3100, 2900, 3000, 2800],
        savings: [600, 1400, 800, 1600, 1100, 1400]
    };

    // Category-wise expense distribution
    const expenseCategories = {
        labels: ['Food & Dining', 'Transportation', 'Housing', 'Entertainment', 'Healthcare', 'Shopping'],
        data: [35, 25, 20, 10, 5, 5]
    };

    // Net savings over time
    const savingsData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [600, 2000, 2800, 4400, 5500, 6900]
    };

    // Chart configurations
    const barChartData = {
        labels: months,
        datasets: [
            {
                label: 'Income',
                data: monthlyData.income,
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
                borderRadius: 8,
            },
            {
                label: 'Expenses',
                data: monthlyData.expenses,
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };

    const pieChartData = {
        labels: expenseCategories.labels,
        datasets: [
            {
                data: expenseCategories.data,
                backgroundColor: [
                    '#F70000',
                    '#3B82F6',
                    '#10B981',
                    '#F59E0B',
                    '#8B5CF6',
                    '#EC4899',
                ],
                borderWidth: 2,
                borderColor: '#1C1C1E',
            },
        ],
    };

    const lineChartData = {
        labels: savingsData.labels,
        datasets: [
            {
                label: 'Net Savings',
                data: savingsData.data,
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
                displayColors: true,
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
                        return `${label}: $${value} (${percentage}%)`;
                    },
                },
            },
        },
    };

    const lineChartOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            legend: {
                display: false,
            },
        },
    };

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Income Card */}
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 border border-green-500/20 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Total Income</h3>
                    <p className="text-3xl font-bold text-white mb-1">${summaryData.income.toLocaleString()}</p>
                    <p className="text-green-400 text-sm">This month</p>
                </div>

                {/* Total Expenses Card */}
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl p-6 border border-red-500/20 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <CreditCardIcon className="w-6 h-6 text-red-400" />
                        </div>
                        <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Total Expenses</h3>
                    <p className="text-3xl font-bold text-white mb-1">${summaryData.expenses.toLocaleString()}</p>
                    <p className="text-red-400 text-sm">This month</p>
                </div>

                {/* Current Savings Card */}
                <div className="bg-gradient-to-br from-[#F70000]/10 to-[#F70000]/5 rounded-2xl p-6 border border-[#F70000]/20 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#F70000]/20 rounded-xl flex items-center justify-center">
                            <BuildingLibraryIcon className="w-6 h-6 text-[#F70000]" />
                        </div>
                        <ArrowTrendingUpIcon className="w-5 h-5 text-[#F70000]" />
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Current Savings</h3>
                    <p className="text-3xl font-bold text-white mb-1">${summaryData.savings.toLocaleString()}</p>
                    <p className="text-[#F70000] text-sm">Net this month</p>
                </div>
            </div>

            {/* Month-wise Analysis Chart */}
            <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Monthly Income vs Expenses</h3>
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-gray-300">Income</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-gray-300">Expenses</span>
                        </div>
                    </div>
                </div>
                <div className="h-80">
                    <Bar data={barChartData} options={chartOptions} />
                </div>
            </div>

            {/* Bottom Section - Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Distribution Pie Chart */}
                <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Expense Distribution</h3>
                    <div className="h-80">
                        <Pie data={pieChartData} options={pieChartOptions} />
                    </div>
                </div>

                {/* Net Savings Line Chart */}
                <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Net Savings Over Time</h3>
                    <div className="h-80">
                        <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-[#383838] rounded-2xl p-6 border border-gray-600 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">Quick Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#232326] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Savings Rate</p>
                        <p className="text-2xl font-bold text-green-400">
                            {((summaryData.savings / summaryData.income) * 100).toFixed(1)}%
                        </p>
                    </div>
                    <div className="bg-[#232326] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Avg Monthly Income</p>
                        <p className="text-2xl font-bold text-white">
                            ${(monthlyData.income.reduce((a, b) => a + b, 0) / 6).toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-[#232326] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Top Expense Category</p>
                        <p className="text-2xl font-bold text-[#F70000]">Food & Dining</p>
                    </div>
                </div>
            </div>
        </div>
    );
} 