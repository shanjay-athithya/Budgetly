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

interface IncomeEntry {
    id: string;
    date: string; // YYYY-MM format
    source: string;
    amount: number;
}

interface IncomeManagerProps {
    incomes?: IncomeEntry[];
    onSave?: (income: IncomeEntry) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function IncomeManager({ incomes = [], onSave, onDelete }: IncomeManagerProps) {
    const [localIncomes, setLocalIncomes] = useState<IncomeEntry[]>(incomes);
    const [showModal, setShowModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        date: '',
        source: '',
        amount: ''
    });

    // Calculate totals
    const totalIncome = localIncomes.reduce((sum, income) => sum + income.amount, 0);
    const currentMonthIncome = localIncomes
        .filter(income => income.date === new Date().toISOString().slice(0, 7))
        .reduce((sum, income) => sum + income.amount, 0);

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
        setFormData({ date: '', source: '', amount: '' });
        setEditingIncome(null);
    };

    const openAddModal = () => {
        resetForm();
        setFormData({
            date: new Date().toISOString().slice(0, 7),
            source: '',
            amount: ''
        });
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

    // Save handler
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.date || !formData.source || !formData.amount) {
            addToast('Please fill in all fields', 'error');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        setLoading(true);
        try {
            const incomeData: IncomeEntry = {
                id: editingIncome?.id || Date.now().toString(),
                date: formData.date,
                source: formData.source,
                amount: amount
            };

            if (onSave) {
                await onSave(incomeData);
            } else {
                // Local state management if no backend
                if (editingIncome) {
                    setLocalIncomes(prev =>
                        prev.map(income =>
                            income.id === editingIncome.id ? incomeData : income
                        )
                    );
                } else {
                    setLocalIncomes(prev => [...prev, incomeData]);
                }
            }

            addToast(
                editingIncome
                    ? 'Income updated successfully!'
                    : 'Income added successfully!',
                'success'
            );
            closeModal();
        } catch (error) {
            addToast('Failed to save income. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Delete handler
    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this income entry?')) {
            return;
        }

        setLoading(true);
        try {
            if (onDelete) {
                await onDelete(id);
            } else {
                // Local state management if no backend
                setLocalIncomes(prev => prev.filter(income => income.id !== id));
            }
            addToast('Income deleted successfully!', 'success');
        } catch (error) {
            addToast('Failed to delete income. Please try again.', 'error');
        } finally {
            setLoading(false);
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

    // Sort incomes by date (newest first)
    const sortedIncomes = [...localIncomes].sort((a, b) => b.date.localeCompare(a.date));

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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 border border-green-500/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">Total Income</h3>
                            <p className="text-3xl font-bold text-white">${totalIncome.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-6 border border-blue-500/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <CalendarIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">This Month</h3>
                            <p className="text-3xl font-bold text-white">${currentMonthIncome.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Income History</h2>
                <button
                    onClick={openAddModal}
                    className="flex items-center space-x-2 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-lg"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Income</span>
                </button>
            </div>

            {/* Income Table */}
            <div className="bg-[#383838] rounded-2xl border border-gray-600 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#232326] border-b border-gray-600">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Source</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Amount</th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                            {sortedIncomes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                        <p className="text-lg font-medium">No income entries yet</p>
                                        <p className="text-sm">Add your first income entry to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedIncomes.map((income) => (
                                    <tr key={income.id} className="hover:bg-[#232326] transition-colors">
                                        <td className="px-6 py-4 text-white font-medium">
                                            {formatDate(income.date)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {income.source}
                                        </td>
                                        <td className="px-6 py-4 text-right text-green-400 font-bold">
                                            ${income.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => openEditModal(income)}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(income.id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-[#232326] rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                        <h3 className="text-2xl font-bold text-white mb-6">
                            {editingIncome ? 'Edit Income' : 'Add New Income'}
                        </h3>

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Date Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Month
                                </label>
                                <input
                                    type="month"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Source Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Income Source
                                </label>
                                <input
                                    type="text"
                                    name="source"
                                    value={formData.source}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Salary, Freelance, Investment"
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent placeholder-gray-500"
                                    required
                                />
                            </div>

                            {/* Amount Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className="w-full pl-8 pr-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent placeholder-gray-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 text-gray-300 bg-[#383838] hover:bg-gray-600 rounded-lg transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-[#F70000] hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Saving...' : (editingIncome ? 'Update' : 'Add Income')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 