'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CreditCardIcon,
    CalendarIcon,
    TagIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { utils } from '../services/api';

interface ExpenseEntry {
    _id?: any;
    label: string;
    amount: number;
    category: string;
    date: Date | string;
    type: 'one-time' | 'emi';
    note?: string;
    emiDetails?: {
        duration: number;
        remainingMonths: number;
        monthlyAmount: number;
        startedOn: Date;
    };
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

const expenseCategories = [
    'Food & Dining',
    'Transport',
    'Shopping',
    'Entertainment',
    'Health',
    'Education',
    'Rent',
    'Utilities',
    'Insurance',
    'Investment',
    'EMI',
    'Other'
];

export default function ExpenseManager() {
    const { state, addExpense, updateExpense, deleteExpense } = useData();
    const { user, currentMonth, expenses, emis, loading, error } = state;

    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [filters, setFilters] = useState({
        month: currentMonth,
        category: 'all'
    });
    const [formData, setFormData] = useState({
        label: '',
        amount: '',
        category: '',
        date: '',
        type: 'one-time' as 'one-time' | 'emi',
        note: '',
        emiDuration: '',
        emiStartMonth: ''
    });

    // Helper function to safely get date string
    const getDateString = useCallback((date: Date | string): string => {
        if (date instanceof Date) {
            return date.toISOString().slice(0, 7); // YYYY-MM format
        }
        if (typeof date === 'string') {
            return date.slice(0, 7); // YYYY-MM format
        }
        return '';
    }, []);

    // Helper function to safely get full date string
    const getFullDateString = useCallback((date: Date | string): string => {
        if (date instanceof Date) {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
        if (typeof date === 'string') {
            return date.split('T')[0]; // YYYY-MM-DD format
        }
        return '';
    }, []);

    // Update filters when currentMonth changes
    useEffect(() => {
        setFilters(prev => ({ ...prev, month: currentMonth }));
    }, [currentMonth]);

    // Calculate totals using global expenses state
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const currentMonthExpenses = expenses.filter(expense => {
        const expenseDate = getDateString(expense.date);
        return expenseDate === currentMonth;
    }).reduce((sum, expense) => sum + expense.amount, 0);

    // Filter expenses using global expenses state
    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = getDateString(expense.date);
        const matchesMonth = expenseDate === filters.month;
        const matchesCategory = filters.category === 'all' || expense.category === filters.category;
        return matchesMonth && matchesCategory;
    });

    // Toast management
    const addToast = useCallback((message: string, type: Toast['type']) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    // Form handlers
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData({
            label: '',
            amount: '',
            category: '',
            date: '',
            type: 'one-time',
            note: '',
            emiDuration: '',
            emiStartMonth: ''
        });
        setEditingExpense(null);
    }, []);

    const openAddModal = useCallback(() => {
        resetForm();
        setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
            category: 'Food & Dining'
        }));
        setShowModal(true);
    }, [resetForm]);

    const openEditModal = useCallback((expense: ExpenseEntry) => {
        setEditingExpense(expense);
        setFormData({
            label: expense.label,
            amount: expense.amount.toString(),
            category: expense.category,
            date: getFullDateString(expense.date),
            type: expense.type,
            note: expense.label, // Using label as note for now
            emiDuration: expense.emiDetails?.duration.toString() || '',
            emiStartMonth: expense.emiDetails?.startedOn ? getFullDateString(expense.emiDetails.startedOn) : ''
        });
        setShowModal(true);
    }, [getFullDateString]);

    const closeModal = useCallback(() => {
        setShowModal(false);
        resetForm();
    }, [resetForm]);

    // Handle save
    const handleSave = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !formData.label || !formData.amount || !formData.category || !formData.date) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        try {
            const expenseData = {
                label: formData.label,
                amount: amount,
                category: formData.category,
                date: new Date(formData.date),
                type: formData.type as 'one-time' | 'emi',
                emiDetails: formData.type === 'emi' ? {
                    duration: parseInt(formData.emiDuration),
                    remainingMonths: parseInt(formData.emiDuration),
                    monthlyAmount: amount / parseInt(formData.emiDuration),
                    startedOn: new Date(formData.emiStartMonth || formData.date)
                } : undefined
            };

            if (editingExpense) {
                await updateExpense(user.uid, currentMonth, editingExpense._id!, expenseData);
                addToast('Expense updated successfully!', 'success');
            } else {
                await addExpense(user.uid, currentMonth, expenseData);
                addToast('Expense added successfully!', 'success');
            }

            closeModal();
        } catch (error: any) {
            addToast(error.message || 'Failed to save expense. Please try again.', 'error');
        }
    }, [user, currentMonth, formData, editingExpense, addExpense, updateExpense, addToast, closeModal]);

    // Handle delete
    const handleDelete = useCallback(async (expense: ExpenseEntry) => {
        if (!user || !expense._id) {
            addToast('Cannot delete expense', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            await deleteExpense(user.uid, currentMonth, expense._id);
            addToast('Expense deleted successfully!', 'success');
        } catch (error: any) {
            addToast(error.message || 'Failed to delete expense. Please try again.', 'error');
        }
    }, [user, currentMonth, deleteExpense, addToast]);

    // Get available months for filter
    const getAvailableMonths = useCallback(() => {
        if (!user || !user.months) return [];
        return Object.keys(user.months).sort().reverse();
    }, [user]);

    // Format date for display
    const formatDate = useCallback((date: Date | string) => {
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);

    // Calculate category totals
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as { [key: string]: number });

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
                    <CreditCardIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Expenses</h3>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Expense Manager</h1>
                    <p className="text-gray-400">Track and manage your expenses</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center space-x-2 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Expense</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Expenses</p>
                            <p className="text-2xl font-bold text-white">₹{totalExpenses.toLocaleString()}</p>
                        </div>
                        <CreditCardIcon className="h-8 w-8 text-red-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">This Month</p>
                            <p className="text-2xl font-bold text-white">₹{currentMonthExpenses.toLocaleString()}</p>
                        </div>
                        <CalendarIcon className="h-8 w-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Items</p>
                            <p className="text-2xl font-bold text-white">{filteredExpenses.length}</p>
                        </div>
                        <DocumentTextIcon className="h-8 w-8 text-green-400" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-gray-300 text-sm font-medium mb-2">Month</label>
                        <select
                            value={filters.month}
                            onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                            className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                        >
                            {getAvailableMonths().map(month => (
                                <option key={month} value={month}>
                                    {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                        >
                            <option value="all">All Categories</option>
                            {expenseCategories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(categoryTotals).length > 0 && (
                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <h3 className="text-lg font-semibold text-white mb-4">Category Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(categoryTotals).map(([category, total]) => (
                            <div key={category} className="bg-[#1C1C1E] rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    <TagIcon className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-white font-medium">{category}</p>
                                        <p className="text-gray-400 text-sm">₹{total.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expenses List */}
            <div className="bg-[#232326] rounded-xl border border-gray-600">
                <div className="p-6 border-b border-gray-600">
                    <h2 className="text-lg font-semibold text-white">Expenses</h2>
                </div>

                {filteredExpenses.length === 0 ? (
                    <div className="p-8 text-center">
                        <CreditCardIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No Expenses Found</h3>
                        <p className="text-gray-500">Add your first expense to start tracking</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-600">
                        {filteredExpenses.map((expense, index) => (
                            <div key={expense._id || `expense-${index}`} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                                            <CreditCardIcon className="h-6 w-6 text-red-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{expense.label}</h3>
                                            <p className="text-gray-400 text-sm">
                                                {expense.category} • {formatDate(expense.date)}
                                                {expense.type === 'emi' && ' • EMI'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="text-right">
                                            <p className="text-white font-bold">₹{expense.amount.toLocaleString()}</p>
                                            {expense.type === 'emi' && expense.emiDetails && (
                                                <p className="text-gray-400 text-xs">
                                                    ₹{expense.emiDetails.monthlyAmount.toLocaleString()}/month
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => openEditModal(expense)}
                                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                            title="Edit expense"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense)}
                                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                            title="Delete expense"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#232326] rounded-xl p-6 w-full max-w-md mx-4 border border-gray-600">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    name="label"
                                    value={formData.label}
                                    onChange={handleInputChange}
                                    placeholder="Enter expense description"
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    placeholder="Enter amount"
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {expenseCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    required
                                >
                                    <option value="one-time">One-time</option>
                                    <option value="emi">EMI</option>
                                </select>
                            </div>

                            {formData.type === 'emi' && (
                                <>
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            EMI Duration (months)
                                        </label>
                                        <input
                                            type="number"
                                            name="emiDuration"
                                            value={formData.emiDuration}
                                            onChange={handleInputChange}
                                            placeholder="Enter duration in months"
                                            className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            EMI Start Month
                                        </label>
                                        <input
                                            type="month"
                                            name="emiStartMonth"
                                            value={formData.emiStartMonth}
                                            onChange={handleInputChange}
                                            className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                        />
                                    </div>
                                </>
                            )}

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
                                    className="flex-1 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                >
                                    {editingExpense ? 'Update' : 'Add'}
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
                            toast.type === 'error' ? 'bg-red-500 text-white' :
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