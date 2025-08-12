'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    BanknotesIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    XMarkIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { Expense } from '../services/api';

interface EMIEntry {
    id: string;
    expenseId?: string; // The actual expense _id from database
    productName: string;
    totalAmount: number;
    duration: number;
    startMonth: string; // YYYY-MM format
    monthlyInstallment: number;
    paidMonths: number;
    isActive: boolean;
    month?: string; // The month this EMI belongs to
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function EMIManager() {
    const { state, addExpense, updateExpense, deleteExpense } = useData();
    const { user, currentMonth } = state;

    const [localEMIs, setLocalEMIs] = useState<EMIEntry[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingEMI, setEditingEMI] = useState<EMIEntry | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        productName: '',
        totalAmount: '',
        duration: '',
        startMonth: ''
    });

    // Load EMIs from user data
    useEffect(() => {
        if (user && user.months) {
            const allEMIs: EMIEntry[] = [];
            const emiGroups: { [key: string]: (Expense & { month: string })[] } = {};

            // Group EMI installments by their base product name
            Object.entries(user.months).forEach(([month, monthData]) => {
                monthData.expenses.forEach((expense: Expense) => {
                    if (expense.type === 'emi' && expense.emiDetails) {
                        // Extract base product name (remove EMI X/Y part)
                        const baseProductName = expense.label.replace(/\s*-\s*EMI\s*\d+\/\d+/, '');

                        if (!emiGroups[baseProductName]) {
                            emiGroups[baseProductName] = [];
                        }
                        emiGroups[baseProductName].push({
                            ...expense,
                            month
                        });
                    }
                });
            });

            // Convert grouped EMIs to EMIEntry format
            Object.entries(emiGroups).forEach(([productName, installments]) => {
                if (installments.length > 0) {
                    const firstInstallment = installments[0];

                    // Skip if emiDetails is missing
                    if (!firstInstallment.emiDetails) {
                        return;
                    }

                    const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
                    const totalInstallments = installments.length;
                    const paidInstallments = installments.filter(inst =>
                        new Date(inst.date) <= new Date()
                    ).length;

                    allEMIs.push({
                        id: firstInstallment._id || Math.random().toString(),
                        expenseId: firstInstallment._id,
                        productName: productName,
                        totalAmount: totalAmount,
                        duration: totalInstallments,
                        startMonth: firstInstallment.emiDetails.startedOn.toString().slice(0, 7),
                        monthlyInstallment: firstInstallment.emiDetails.monthlyAmount,
                        paidMonths: paidInstallments,
                        isActive: paidInstallments < totalInstallments,
                        month: firstInstallment.month
                    });
                }
            });

            setLocalEMIs(allEMIs);
        }
    }, [user]);

    // Calculate EMI details
    const calculateEMIDetails = useCallback((emi: EMIEntry) => {
        const startDate = new Date(emi.startMonth + '-01');
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + emi.duration - 1);

        const remainingMonths = Math.max(0, emi.duration - emi.paidMonths);
        const endMonth = endDate.toISOString().slice(0, 7);

        return {
            endMonth,
            remainingMonths,
            progress: (emi.paidMonths / emi.duration) * 100
        };
    }, []);

    // Separate active and completed EMIs
    const activeEMIs = localEMIs.filter(emi => emi.isActive);
    const completedEMIs = localEMIs.filter(emi => !emi.isActive);

    // Calculate totals
    const totalActiveEMIs = activeEMIs.length;
    const totalMonthlyEMI = activeEMIs.reduce((sum, emi) => sum + emi.monthlyInstallment, 0);
    const totalEMIAmount = activeEMIs.reduce((sum, emi) => sum + emi.totalAmount, 0);

    // Toast management
    const addToast = useCallback((message: string, type: Toast['type']) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    // Form handlers
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData({
            productName: '',
            totalAmount: '',
            duration: '',
            startMonth: ''
        });
        setEditingEMI(null);
    }, []);

    const openAddModal = useCallback(() => {
        resetForm();
        setShowModal(true);
    }, [resetForm]);

    const openEditModal = useCallback((emi: EMIEntry) => {
        setEditingEMI(emi);
        setFormData({
            productName: emi.productName,
            totalAmount: emi.totalAmount.toString(),
            duration: emi.duration.toString(),
            startMonth: emi.startMonth
        });
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        resetForm();
    }, [resetForm]);

    const handleSave = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            addToast('User not found', 'error');
            return;
        }

        if (!formData.productName || !formData.totalAmount || !formData.duration || !formData.startMonth) {
            addToast('Please fill in all fields', 'error');
            return;
        }

        const totalAmount = parseFloat(formData.totalAmount);
        const duration = parseInt(formData.duration);

        if (isNaN(totalAmount) || isNaN(duration) || totalAmount <= 0 || duration <= 0) {
            addToast('Please enter valid amounts', 'error');
            return;
        }

        setLoading(true);

        try {
            const monthlyInstallment = totalAmount / duration;
            const startDate = new Date(formData.startMonth + '-01');

            const expenseData = {
                label: formData.productName,
                amount: totalAmount,
                category: 'EMI',
                date: startDate,
                type: 'emi' as const,
                emiDetails: {
                    duration: duration,
                    remainingMonths: editingEMI ? editingEMI.duration - editingEMI.paidMonths : duration,
                    monthlyAmount: monthlyInstallment,
                    startedOn: startDate
                }
            };

            if (editingEMI && editingEMI.expenseId) {
                // Update existing EMI
                await updateExpense(user.uid, editingEMI.month || currentMonth, editingEMI.expenseId, expenseData);
                addToast('EMI updated successfully!', 'success');
            } else {
                // Add new EMI - distribute across all EMI months
                const startDate = new Date(formData.startMonth + '-01');
                const monthlyInstallment = totalAmount / duration;

                // Create EMI installments for each month
                for (let i = 0; i < duration; i++) {
                    const emiMonth = new Date(startDate);
                    emiMonth.setMonth(emiMonth.getMonth() + i);
                    const monthKey = emiMonth.toISOString().slice(0, 7);

                    const emiExpenseData = {
                        label: `${formData.productName} - EMI ${i + 1}/${duration}`,
                        amount: monthlyInstallment,
                        category: 'EMI',
                        date: emiMonth,
                        type: 'emi' as const,
                        emiDetails: {
                            duration: duration,
                            remainingMonths: duration - i - 1,
                            monthlyAmount: monthlyInstallment,
                            startedOn: startDate,
                            installmentNumber: i + 1,
                            totalInstallments: duration
                        }
                    };

                    await addExpense(user.uid, monthKey, emiExpenseData);
                }
                addToast(`EMI added successfully! ${duration} installments created.`, 'success');
            }

            closeModal();
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Failed to save EMI. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, formData, editingEMI, currentMonth, addExpense, updateExpense, addToast, closeModal]);

    const handleDelete = useCallback(async (emi: EMIEntry) => {
        if (!user) {
            addToast('User not found', 'error');
            return;
        }

        if (!emi.expenseId) {
            addToast('Cannot delete EMI - missing expense ID', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this EMI?')) {
            return;
        }

        setLoading(true);

        try {
            await deleteExpense(user.uid, emi.month || currentMonth, emi.expenseId);
            addToast('EMI deleted successfully!', 'success');
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Failed to delete EMI. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, currentMonth, deleteExpense, addToast]);

    const handleMarkAsPaid = useCallback(async (emi: EMIEntry) => {
        if (!user || !emi.expenseId) {
            addToast('Cannot update EMI - missing user or expense ID', 'error');
            return;
        }

        try {
            // Find all installments for this EMI
            const allInstallments: (Expense & { month: string })[] = [];
            Object.entries(user.months).forEach(([month, monthData]) => {
                monthData.expenses.forEach((expense: Expense) => {
                    if (expense.type === 'emi' && expense.emiDetails) {
                        const baseProductName = expense.label.replace(/\s*-\s*EMI\s*\d+\/\d+/, '');
                        if (baseProductName === emi.productName) {
                            allInstallments.push({ ...expense, month });
                        }
                    }
                });
            });

            // Sort installments by date
            allInstallments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Mark the next unpaid installment as paid
            const nextUnpaidInstallment = allInstallments.find(inst =>
                new Date(inst.date) > new Date()
            );

            if (nextUnpaidInstallment && nextUnpaidInstallment.emiDetails) {
                const expenseData = {
                    label: nextUnpaidInstallment.label,
                    amount: nextUnpaidInstallment.amount,
                    category: 'EMI',
                    date: new Date(), // Mark as paid today
                    type: 'emi' as const,
                    emiDetails: {
                        ...nextUnpaidInstallment.emiDetails,
                        remainingMonths: Math.max(0, nextUnpaidInstallment.emiDetails.remainingMonths - 1)
                    }
                };

                await updateExpense(user.uid, nextUnpaidInstallment.month, nextUnpaidInstallment._id!, expenseData);
                addToast('Payment recorded successfully!', 'success');
            } else {
                addToast('All installments are already paid!', 'info');
            }
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Failed to record payment. Please try again.', 'error');
        }
    }, [user, updateExpense, addToast]);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString + '-01').toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">EMI Tracker</h1>
                    <p className="text-gray-400">Manage your loan EMIs and payment schedules</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center space-x-2 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add EMI</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Active EMIs</p>
                            <p className="text-2xl font-bold text-white">{totalActiveEMIs}</p>
                        </div>
                        <ClockIcon className="h-8 w-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Monthly EMI</p>
                            <p className="text-2xl font-bold text-white">₹{totalMonthlyEMI.toLocaleString()}</p>
                        </div>
                        <BanknotesIcon className="h-8 w-8 text-green-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total EMI Amount</p>
                            <p className="text-2xl font-bold text-white">₹{totalEMIAmount.toLocaleString()}</p>
                        </div>
                        <CurrencyDollarIcon className="h-8 w-8 text-purple-400" />
                    </div>
                </div>
            </div>

            {/* Active EMIs */}
            <div className="bg-[#232326] rounded-xl border border-gray-600">
                <div className="p-6 border-b border-gray-600">
                    <h2 className="text-lg font-semibold text-white">Active EMIs</h2>
                </div>

                {activeEMIs.length === 0 ? (
                    <div className="p-8 text-center">
                        <ClockIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No Active EMIs</h3>
                        <p className="text-gray-500">Add your first EMI to start tracking payments</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-600">
                        {activeEMIs.map((emi) => {
                            const details = calculateEMIDetails(emi);
                            return (
                                <div key={emi.id} className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                <ClockIcon className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium">{emi.productName}</h3>
                                                <p className="text-gray-400 text-sm">
                                                    Started: {formatDate(emi.startMonth)} |
                                                    Ends: {formatDate(details.endMonth)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleMarkAsPaid(emi)}
                                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                                title="Mark as paid"
                                            >
                                                <CheckCircleIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(emi)}
                                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                                title="Edit EMI"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emi)}
                                                className="p-2 bg-[#F70000]/20 text-[#F70000] rounded-lg hover:bg-[#F70000]/30 transition-colors"
                                                title="Delete EMI"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-gray-400 text-sm">Total Amount</p>
                                            <p className="text-white font-medium">₹{emi.totalAmount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Monthly EMI</p>
                                            <p className="text-white font-medium">₹{emi.monthlyInstallment.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Paid Months</p>
                                            <p className="text-white font-medium">{emi.paidMonths}/{emi.duration}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Remaining</p>
                                            <p className="text-white font-medium">{details.remainingMonths} months</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-600 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${details.progress}%` }}
                                        />
                                    </div>
                                    <p className="text-gray-400 text-xs mt-2">
                                        {details.progress.toFixed(1)}% completed
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Completed EMIs */}
            {completedEMIs.length > 0 && (
                <div className="bg-[#232326] rounded-xl border border-gray-600">
                    <div className="p-6 border-b border-gray-600">
                        <h2 className="text-lg font-semibold text-white">Completed EMIs</h2>
                    </div>

                    <div className="divide-y divide-gray-600">
                        {completedEMIs.map((emi) => {
                            const details = calculateEMIDetails(emi);
                            return (
                                <div key={emi.id} className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                                <CheckCircleIcon className="h-6 w-6 text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium">{emi.productName}</h3>
                                                <p className="text-gray-400 text-sm">
                                                    Completed: {formatDate(details.endMonth)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-medium">₹{emi.totalAmount.toLocaleString()}</p>
                                            <p className="text-gray-400 text-sm">Fully paid</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add/Edit EMI Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#232326] rounded-xl p-6 w-full max-w-md mx-4 border border-gray-600">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingEMI ? 'Edit EMI' : 'Add New EMI'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    name="productName"
                                    value={formData.productName}
                                    onChange={handleInputChange}
                                    placeholder="e.g., iPhone 15, Car Loan"
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Total Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    name="totalAmount"
                                    value={formData.totalAmount}
                                    onChange={handleInputChange}
                                    placeholder="Enter total amount"
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Duration (months)
                                </label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    placeholder="Enter duration in months"
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Start Month
                                </label>
                                <input
                                    type="month"
                                    name="startMonth"
                                    value={formData.startMonth}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    required
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : (editingEMI ? 'Update' : 'Add')}
                                </button>
                            </div>
                        </form>
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