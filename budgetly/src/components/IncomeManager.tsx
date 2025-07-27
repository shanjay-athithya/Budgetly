'use client';

import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { utils } from '../services/api';

interface IncomeEntry {
    id: string;
    date: string;
    source: string;
    amount: number;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function IncomeManager() {
    const { state, addIncome, updateIncome } = useData();
    const { user, currentMonth, loading, error } = state;

    const [localIncomes, setLocalIncomes] = useState<IncomeEntry[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [formData, setFormData] = useState({
        date: '',
        source: '',
        amount: ''
    });

    // Load incomes for current month
    useEffect(() => {
        if (user && currentMonth && user.months) {
            const monthData = user.months[currentMonth];
            if (monthData && monthData.income > 0) {
                // Convert to income entries format
                setLocalIncomes([{
                    id: 'current-income',
                    date: currentMonth,
                    source: 'Salary', // Default source
                    amount: monthData.income
                }]);
            } else {
                setLocalIncomes([]);
            }
        }
    }, [user, currentMonth]);

    // Calculate totals
    const totalIncome = localIncomes.reduce((sum, income) => sum + income.amount, 0);
    const currentMonthIncome = localIncomes.find(income => income.date === currentMonth)?.amount || 0;

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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            date: '',
            source: '',
            amount: ''
        });
        setEditingIncome(null);
    };

    const openAddModal = () => {
        resetForm();
        setFormData(prev => ({ ...prev, date: currentMonth }));
        setShowModal(true);
    };

    const openEditModal = (income: IncomeEntry) => {
        setEditingIncome(income);
        setFormData({
            date: income.date,
            source: income.source,
            amount: income.amount.toString()
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleSave = async (e: React.FormEvent) => {
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
            if (editingIncome) {
                // Update existing income - replace the total amount
                await updateIncome(user.uid, formData.date, amount);
                addToast('Income updated successfully', 'success');
            } else {
                // Add new income - add to existing amount
                const currentIncome = user.months[formData.date]?.income || 0;
                const newTotal = currentIncome + amount;
                await updateIncome(user.uid, formData.date, newTotal);
                addToast(`Income added successfully! Total: ₹${newTotal.toLocaleString()}`, 'success');
            }

            closeModal();
        } catch (error: any) {
            addToast(error.message || 'Failed to save income', 'error');
        }
    };

    const handleDelete = async (income: IncomeEntry) => {
        if (!user) {
            addToast('User not found', 'error');
            return;
        }

        try {
            // Set income to 0 (delete)
            await updateIncome(user.uid, income.date, 0);
            addToast('Income deleted successfully', 'success');
        } catch (error: any) {
            addToast(error.message || 'Failed to delete income', 'error');
        }
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
                            <p className="text-2xl font-bold text-purple-400">{localIncomes.length}</p>
                        </div>
                        <BuildingOfficeIcon className="h-8 w-8 text-purple-400" />
                    </div>
                </div>
            </div>

            {/* Income List */}
            <div className="bg-[#232326] rounded-xl border border-gray-600">
                <div className="p-6 border-b border-gray-600">
                    <h2 className="text-lg font-semibold text-white">Income Sources</h2>
                </div>

                {localIncomes.length === 0 ? (
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
                        {localIncomes.map((income) => (
                            <div key={income.id} className="p-6 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{income.source}</h3>
                                        <p className="text-gray-400 text-sm">
                                            {new Date(income.date + '-01').toLocaleDateString('en-US', {
                                                month: 'long',
                                                year: 'numeric'
                                            })}
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
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                                    Month
                                </label>
                                <input
                                    type="month"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#1C1C1E] border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                                    required
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
                                    <option value="Salary">Salary</option>
                                    <option value="Freelance">Freelance</option>
                                    <option value="Business">Business</option>
                                    <option value="Investment">Investment</option>
                                    <option value="Rental">Rental Income</option>
                                    <option value="Other">Other</option>
                                </select>
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