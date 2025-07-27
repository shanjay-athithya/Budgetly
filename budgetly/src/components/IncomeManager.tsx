'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { utils, IncomeEntry } from '../services/api';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

const incomeSources = [
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Rental Income',
    'Other'
];

export default function IncomeManager() {
    const { state, addIncome, updateIncome, deleteIncome } = useData();
    const { user, currentMonth, incomes, loading, error } = state;

    console.log('🎯 IncomeManager render - incomes:', JSON.stringify(incomes, null, 2));
    console.log('🎯 IncomeManager render - currentMonth:', currentMonth);
    console.log('🎯 IncomeManager render - incomes length:', incomes?.length);

    const [showModal, setShowModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [filters, setFilters] = useState({
        month: currentMonth,
        source: 'all'
    });
    const [formData, setFormData] = useState({
        label: '',
        amount: '',
        source: '',
        date: ''
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

    // Bulletproof month string extractor
    const getMonthString = (date: Date | string) => {
        const d = new Date(date);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    };

    // Debug logs for filtering
    console.log('All income dates:', incomes.map(i => i.date));
    console.log('All income months:', incomes.map(i => getMonthString(i.date)));
    console.log('Current filter month:', filters.month);

    // Filter incomes using bulletproof month filter
    const filteredIncomes = incomes.filter(income => {
        return getMonthString(income.date) === filters.month;
    });

    // Update filters when currentMonth changes
    useEffect(() => {
        setFilters(prev => ({ ...prev, month: currentMonth }));
    }, [currentMonth]);

    // Calculate totals using global incomes state
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const currentMonthIncome = incomes.filter(income => {
        const incomeDate = getDateString(income.date);
        return incomeDate === currentMonth;
    }).reduce((sum, income) => sum + income.amount, 0);

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
            label: '',
            amount: '',
            source: '',
            date: ''
        });
        setEditingIncome(null);
    }, []);

    const openAddModal = useCallback(() => {
        resetForm();
        setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
            source: 'Salary'
        }));
        setShowModal(true);
    }, [resetForm]);

    const openEditModal = useCallback((income: IncomeEntry) => {
        setEditingIncome(income);
        setFormData({
            label: income.label,
            amount: income.amount.toString(),
            source: income.source,
            date: getFullDateString(income.date)
        });
        setShowModal(true);
    }, [getFullDateString]);

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

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        try {
            const incomeEntry = {
                label: formData.label,
                amount: amount,
                source: formData.source,
                date: new Date(formData.date)
            };

            if (editingIncome) {
                // Update existing income
                await updateIncome(user.uid, formData.date.slice(0, 7), editingIncome._id || '', incomeEntry);
                addToast('Income updated successfully', 'success');
            } else {
                // Add new income
                await addIncome(user.uid, formData.date.slice(0, 7), incomeEntry);
                addToast('Income added successfully', 'success');
            }

            closeModal();
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Failed to save income', 'error');
        }
    }, [user, formData, editingIncome, addIncome, updateIncome, addToast, closeModal]);

    const handleDelete = useCallback(async (income: IncomeEntry) => {
        if (!user) {
            addToast('User not found', 'error');
            return;
        }

        try {
            await deleteIncome(user.uid, getDateString(income.date), income._id || '');
            addToast('Income deleted successfully', 'success');
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Failed to delete income', 'error');
        }
    }, [user, deleteIncome, addToast, getDateString]);

    const formatDate = useCallback((date: Date | string): string => {
        if (date instanceof Date) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        if (typeof date === 'string') {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        return '';
    }, []);

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
                    <CurrencyDollarIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading Income Data</h3>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Income Manager</h1>
                    <p className="text-gray-400">Track and manage your income sources</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center space-x-2 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Income</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Income</p>
                            <p className="text-2xl font-bold text-green-400">₹{totalIncome.toLocaleString()}</p>
                        </div>
                        <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Current Month</p>
                            <p className="text-2xl font-bold text-blue-400">₹{currentMonthIncome.toLocaleString()}</p>
                        </div>
                        <CalendarIcon className="h-8 w-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-[#232326] rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Income Sources</p>
                            <p className="text-2xl font-bold text-purple-400">{incomes.length}</p>
                        </div>
                        <BuildingOfficeIcon className="h-8 w-8 text-purple-400" />
                    </div>
                </div>
            </div>

            {/* Income List */}
            <div className="bg-[#232326] rounded-xl border border-gray-600">
                <div className="p-6 border-b border-gray-600">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-white">Income Sources</h2>
                        <div className="flex items-center space-x-2">
                            <FunnelIcon className="h-5 w-5 text-gray-400" />
                            <select
                                value={filters.month}
                                onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                                className="bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                            >
                                {Object.keys(user?.months || {}).map(month => (
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
                </div>

                {incomes.length === 0 ? (
                    <div className="p-8 text-center">
                        <CurrencyDollarIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No Income Recorded</h3>
                        <p className="text-gray-500 mb-4">Start by adding your income sources for this month</p>
                        <button
                            onClick={openAddModal}
                            className="bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            Add First Income
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-600">
                        {filteredIncomes.map((income) => (
                            <div key={income._id || income.label} className="p-6 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{income.label}</h3>
                                        <p className="text-gray-400 text-sm">
                                            {formatDate(income.date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-xl font-bold text-green-400">
                                        ₹{income.amount.toLocaleString()}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => openEditModal(income)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(income)}
                                            className="p-2 text-gray-400 hover:text-[#F70000] hover:bg-[#F70000]/10 rounded-lg transition-colors"
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#232326] rounded-xl p-6 w-full max-w-md mx-4 border border-gray-600">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingIncome ? 'Edit Income' : 'Add Income'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Label
                                </label>
                                <input
                                    type="text"
                                    name="label"
                                    value={formData.label}
                                    onChange={handleInputChange}
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
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Source
                                </label>
                                <select
                                    name="source"
                                    value={formData.source}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    required
                                >
                                    <option value="">Select source</option>
                                    {incomeSources.map(source => (
                                        <option key={source} value={source}>{source}</option>
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
                                    {editingIncome ? 'Update' : 'Add'}
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