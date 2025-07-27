'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Expense, IncomeEntry } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    TooltipItem,
    Tick
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

export default function ReportsManager() {
    const { state } = useData();
    const { user, currentMonth } = state;

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const reportRef = useRef<HTMLDivElement>(null);

    // Update selectedMonth when currentMonth changes
    useEffect(() => {
        setSelectedMonth(currentMonth);
    }, [currentMonth]);
    const [monthlyReports, setMonthlyReports] = useState<{ [key: string]: MonthlyReport }>({});
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [loading, setLoading] = useState(false);

    // Generate monthly reports from user data
    const generateReports = useCallback(() => {
        if (!user || !user.months) {
            setMonthlyReports({});
            return;
        }

        const reports: { [key: string]: MonthlyReport } = {};

        // Process all months from user data
        Object.entries(user.months).forEach(([monthKey, monthData]) => {
            const report: MonthlyReport = {
                month: monthKey,
                totalIncome: 0,
                totalExpenses: 0,
                savings: 0,
                categoryBreakdown: {},
                topCategories: []
            };

            // Calculate total income for the month
            if (monthData.income && Array.isArray(monthData.income)) {
                report.totalIncome = monthData.income.reduce((sum, income) => sum + income.amount, 0);
            }

            // Calculate total expenses and category breakdown for the month
            if (monthData.expenses && Array.isArray(monthData.expenses)) {
                monthData.expenses.forEach(expense => {
                    report.totalExpenses += expense.amount;

                    // Track category breakdown
                    if (!report.categoryBreakdown[expense.category]) {
                        report.categoryBreakdown[expense.category] = 0;
                    }
                    report.categoryBreakdown[expense.category] += expense.amount;
                });
            }

            // Calculate savings
            report.savings = report.totalIncome - report.totalExpenses;

            // Calculate top 3 categories
            report.topCategories = Object.entries(report.categoryBreakdown)
                .map(([category, amount]) => ({ category, amount }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3);

            reports[monthKey] = report;
        });

        setMonthlyReports(reports);
    }, [user]);

    // Generate reports when user data changes
    useEffect(() => {
        generateReports();
    }, [generateReports]);

    // Get current month's report
    const currentReport = useMemo(() => {
        return monthlyReports[selectedMonth] || {
            month: selectedMonth,
            totalIncome: 0,
            totalExpenses: 0,
            savings: 0,
            categoryBreakdown: {},
            topCategories: []
        };
    }, [monthlyReports, selectedMonth]);

    // Get available months for dropdown
    const availableMonths = useMemo(() => {
        if (!user || !user.months) return [];
        return Object.keys(user.months).sort().reverse();
    }, [user]);

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
        if (!reportRef.current) {
            addToast('Report content not found', 'error');
            return;
        }

        setLoading(true);
        try {
            // Create a temporary container for PDF content
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '800px';
            tempContainer.style.backgroundColor = '#1C1C1E';
            tempContainer.style.color = '#FFFFFF';
            tempContainer.style.fontFamily = 'Lexend, sans-serif';
            tempContainer.style.padding = '40px';
            tempContainer.style.borderRadius = '12px';
            document.body.appendChild(tempContainer);

            // Generate PDF content
            const pdfContent = generatePDFContent();
            tempContainer.innerHTML = pdfContent;

            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Convert to canvas
            const canvas = await html2canvas(tempContainer, {
                backgroundColor: '#1C1C1E',
                scale: 2,
                width: 800,
                height: tempContainer.scrollHeight,
                useCORS: true,
                allowTaint: true,
                logging: false
            });

            // Remove temporary container
            document.body.removeChild(tempContainer);

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add multiple pages if content is too long
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - 20);
            }

            // Download PDF
            const fileName = `financial-report-${selectedMonth}-${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(fileName);

            addToast('PDF report downloaded successfully!', 'success');
        } catch (error: unknown) {
            console.error('PDF generation error:', error);
            addToast(error instanceof Error ? error.message : 'Failed to download PDF. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Generate PDF content HTML
    const generatePDFContent = () => {
        const monthName = formatDate(selectedMonth);
        const totalIncome = currentReport.totalIncome;
        const totalExpenses = currentReport.totalExpenses;
        const savings = currentReport.savings;
        const topCategories = currentReport.topCategories;

        return `
            <div style="font-family: 'Lexend', sans-serif; color: #FFFFFF; background: #1C1C1E; padding: 40px; border-radius: 12px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #F70000; padding-bottom: 20px;">
                    <h1 style="color: #F70000; font-size: 32px; margin: 0; font-weight: bold;">Financial Report</h1>
                    <p style="color: #A0A0A0; font-size: 18px; margin: 10px 0 0 0;">${monthName}</p>
                    <p style="color: #A0A0A0; font-size: 14px; margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
                </div>

                <!-- User Information -->
                <div style="background: #232326; padding: 20px; border-radius: 12px; border: 1px solid #383838; margin-bottom: 30px;">
                    <h2 style="color: #FFFFFF; font-size: 20px; margin: 0 0 15px 0; border-bottom: 1px solid #383838; padding-bottom: 10px;">Report Owner</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <span style="color: #A0A0A0; font-size: 14px;">Name:</span>
                            <p style="color: #FFFFFF; font-size: 16px; margin: 5px 0 0 0; font-weight: bold;">${user?.name || 'Not specified'}</p>
                        </div>
                        <div>
                            <span style="color: #A0A0A0; font-size: 14px;">Email:</span>
                            <p style="color: #FFFFFF; font-size: 16px; margin: 5px 0 0 0;">${user?.email || 'Not specified'}</p>
                        </div>
                        ${user?.occupation ? `
                        <div>
                            <span style="color: #A0A0A0; font-size: 14px;">Occupation:</span>
                            <p style="color: #FFFFFF; font-size: 16px; margin: 5px 0 0 0;">${user.occupation}</p>
                        </div>
                        ` : ''}
                        ${user?.location ? `
                        <div>
                            <span style="color: #A0A0A0; font-size: 14px;">Location:</span>
                            <p style="color: #FFFFFF; font-size: 16px; margin: 5px 0 0 0;">${user.location}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Summary Cards -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 40px;">
                    <div style="background: #232326; padding: 20px; border-radius: 12px; border: 1px solid #383838; text-align: center;">
                        <h3 style="color: #10B981; font-size: 24px; margin: 0 0 10px 0;">₹${totalIncome.toLocaleString()}</h3>
                        <p style="color: #A0A0A0; font-size: 14px; margin: 0;">Total Income</p>
                    </div>
                    <div style="background: #232326; padding: 20px; border-radius: 12px; border: 1px solid #383838; text-align: center;">
                        <h3 style="color: #EF4444; font-size: 24px; margin: 0 0 10px 0;">₹${totalExpenses.toLocaleString()}</h3>
                        <p style="color: #A0A0A0; font-size: 14px; margin: 0;">Total Expenses</p>
                    </div>
                    <div style="background: #232326; padding: 20px; border-radius: 12px; border: 1px solid #383838; text-align: center;">
                        <h3 style="color: #F70000; font-size: 24px; margin: 0 0 10px 0;">₹${savings.toLocaleString()}</h3>
                        <p style="color: #A0A0A0; font-size: 14px; margin: 0;">Net Savings</p>
                    </div>
                </div>

                <!-- Category Breakdown -->
                <div style="margin-bottom: 40px;">
                    <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 20px 0; border-bottom: 1px solid #383838; padding-bottom: 10px;">Top Spending Categories</h2>
                    <div style="background: #232326; padding: 20px; border-radius: 12px; border: 1px solid #383838;">
                        ${topCategories.length > 0 ? topCategories.map((category, index) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: ${index < topCategories.length - 1 ? '1px solid #383838' : 'none'};">
                                <div style="display: flex; align-items: center;">
                                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${['#F70000', '#3B82F6', '#10B981'][index] || '#8B5CF6'}; margin-right: 12px;"></div>
                                    <span style="color: #FFFFFF; font-size: 16px;">${category.category}</span>
                                </div>
                                <span style="color: #F70000; font-size: 16px; font-weight: bold;">₹${category.amount.toLocaleString()}</span>
                            </div>
                        `).join('') : '<p style="color: #A0A0A0; text-align: center; margin: 20px 0;">No expense data available</p>'}
                    </div>
                </div>

                <!-- Simple Chart Representation -->
                <div style="margin-bottom: 40px;">
                    <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 20px 0; border-bottom: 1px solid #383838; padding-bottom: 10px;">Income vs Expenses Overview</h2>
                    <div style="background: #232326; padding: 20px; border-radius: 12px; border: 1px solid #383838;">
                        <div style="display: flex; align-items: end; justify-content: space-around; height: 200px; margin: 20px 0;">
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 60px; background: #10B981; border-radius: 8px 8px 0 0; margin-bottom: 10px; height: ${(() => {
                const maxValue = Math.max(totalIncome, totalExpenses, Math.abs(savings));
                return maxValue > 0 ? Math.max(20, (totalIncome / maxValue) * 150) : 20;
            })()}px;"></div>
                                <span style="color: #10B981; font-size: 16px; font-weight: bold;">₹${totalIncome.toLocaleString()}</span>
                                <span style="color: #A0A0A0; font-size: 12px;">Income</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 60px; background: #EF4444; border-radius: 8px 8px 0 0; margin-bottom: 10px; height: ${(() => {
                const maxValue = Math.max(totalIncome, totalExpenses, Math.abs(savings));
                return maxValue > 0 ? Math.max(20, (totalExpenses / maxValue) * 150) : 20;
            })()}px;"></div>
                                <span style="color: #EF4444; font-size: 16px; font-weight: bold;">₹${totalExpenses.toLocaleString()}</span>
                                <span style="color: #A0A0A0; font-size: 12px;">Expenses</span>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 60px; background: #F70000; border-radius: 8px 8px 0 0; margin-bottom: 10px; height: ${(() => {
                const maxValue = Math.max(totalIncome, totalExpenses, Math.abs(savings));
                return maxValue > 0 ? Math.max(20, (Math.abs(savings) / maxValue) * 150) : 20;
            })()}px;"></div>
                                <span style="color: #F70000; font-size: 16px; font-weight: bold;">₹${savings.toLocaleString()}</span>
                                <span style="color: #A0A0A0; font-size: 12px;">Savings</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Breakdown -->
                <div style="margin-bottom: 40px;">
                    <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 20px 0; border-bottom: 1px solid #383838; padding-bottom: 10px;">Category Breakdown</h2>
                    <div style="background: #232326; padding: 20px; border-radius: 12px; border: 1px solid #383838;">
                        ${Object.entries(currentReport.categoryBreakdown).length > 0 ? Object.entries(currentReport.categoryBreakdown).map(([category, amount], index) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: ${index < Object.entries(currentReport.categoryBreakdown).length - 1 ? '1px solid #383838' : 'none'};">
                                <span style="color: #A0A0A0; font-size: 14px;">${category}</span>
                                <span style="color: #FFFFFF; font-size: 14px; font-weight: bold;">₹${amount.toLocaleString()}</span>
                            </div>
                        `).join('') : '<p style="color: #A0A0A0; text-align: center; margin: 20px 0;">No category data available</p>'}
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #383838;">
                    <p style="color: #A0A0A0; font-size: 12px; margin: 0;">Generated by Budgetly - Personal Finance Tracker</p>
                    <p style="color: #A0A0A0; font-size: 12px; margin: 5px 0 0 0;">Report period: ${monthName}</p>
                </div>
            </div>
        `;
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
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Failed to share report. Please try again.', 'error');
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
                    label: function (context: TooltipItem<'bar'>) {
                        return `${context.label}: $${context.parsed.y?.toLocaleString() ?? 0}`;
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
                    callback: function (tickValue: string | number, _index: number, _ticks: Tick[]) {
                        if (typeof tickValue === 'number') {
                            return '$' + tickValue.toLocaleString();
                        }
                        return '$' + tickValue;
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
                    label: function (context: { label: string; parsed: number; dataset: { data: number[] } }) {
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
                    <ChartBarIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Reports</h3>
                <p className="text-gray-400">{state.error}</p>
            </div>
        );
    }

    // No data state
    if (!user || !user.months || Object.keys(user.months).length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                    <ChartBarIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
                <p className="text-gray-400">Add some income and expenses to generate reports</p>
            </div>
        );
    }

    return (
        <div className="space-y-6" ref={reportRef}>
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
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <DocumentArrowDownIcon className="w-5 h-5" />
                        )}
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