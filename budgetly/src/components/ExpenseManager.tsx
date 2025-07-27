'use client';

import React, { useState } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CreditCardIcon,
    CalendarIcon,
    FunnelIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

interface ExpenseEntry {
    id: string;
    date: string;
    category: string;
    amount: number;
    note?: string;
    isEMI?: boolean;
    emiDuration?: number;
    emiStartMonth?: string;
}

interface ExpenseManagerProps {
    expenses?: ExpenseEntry[];
    onSave?: (expense: ExpenseEntry) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
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

export default function ExpenseManager({ expenses = [], onSave, onDelete }: ExpenseManagerProps) {
    const [localExpenses, setLocalExpenses] = useState<ExpenseEntry[]>(expenses);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter state
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Form state
    const [formData, setFormData] = useState({
        date: '',
        category: '',
        amount: '',
        note: '',
        isEMI: false,
        emiDuration: '',
        emiStartMonth: ''
    });

    // Calculate totals
    const filteredExpenses = localExpenses.filter(expense => {
        const matchesMonth = expense.date.startsWith(monthFilter);
        const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
        return matchesMonth && matchesCategory;
    });

    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const currentMonthExpenses = localExpenses
        .filter(expense => expense.date.startsWith(new Date().toISOString().slice(0, 7)))
        .reduce((sum, expense) => sum + expense.amount, 0);

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
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const resetForm = () => {
        setFormData({
            date: '',
            category: '',
            amount: '',
            note: '',
            isEMI: false,
            emiDuration: '',
            emiStartMonth: ''
        });
        setEditingExpense(null);
    };

    const openAddModal = () => {
        resetForm();
        setFormData({
            date: new Date().toISOString().slice(0, 10),
            category: '',
            amount: '',
            note: '',
            isEMI: false,
            emiDuration: '',
            emiStartMonth: ''
        });
        setShowModal(true);
    };

    const openEditModal = (expense: ExpenseEntry) => {
        setEditingExpense(expense);
        setFormData({
            date: expense.date,
            category: expense.category,
            amount: expense.amount.toString(),
            note: expense.note || '',
            isEMI: expense.isEMI || false,
            emiDuration: expense.emiDuration?.toString() || '',
            emiStartMonth: expense.emiStartMonth || ''
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

        if (!formData.date || !formData.category || !formData.amount) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        if (formData.isEMI && (!formData.emiDuration || !formData.emiStartMonth)) {
            addToast('Please fill in EMI details', 'error');
            return;
        }

        setLoading(true);
        try {
            const expenseData: ExpenseEntry = {
                id: editingExpense?.id || Date.now().toString(),
                date: formData.date,
                category: formData.category,
                amount: amount,
                note: formData.note || undefined,
                isEMI: formData.isEMI,
                emiDuration: formData.isEMI ? parseInt(formData.emiDuration) : undefined,
                emiStartMonth: formData.isEMI ? formData.emiStartMonth : undefined
            };

            if (onSave) {
                await onSave(expenseData);
            } else {
                // Local state management if no backend
                if (editingExpense) {
                    setLocalExpenses(prev =>
                        prev.map(expense =>
                            expense.id === editingExpense.id ? expenseData : expense
                        )
                    );
                } else {
                    setLocalExpenses(prev => [...prev, expenseData]);
                }
            }

            addToast(
                editingExpense
                    ? 'Expense updated successfully!'
                    : 'Expense added successfully!',
                'success'
            );
            closeModal();
        } catch (error) {
            addToast('Failed to save expense. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Delete handler
    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        setLoading(true);
        try {
            if (onDelete) {
                await onDelete(id);
            } else {
                // Local state management if no backend
                setLocalExpenses(prev => prev.filter(expense => expense.id !== id));
            }
            addToast('Expense deleted successfully!', 'success');
        } catch (error) {
            addToast('Failed to delete expense. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Sort expenses by date (newest first)
    const sortedExpenses = [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date));

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
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl p-6 border border-red-500/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <CreditCardIcon className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">Total Expenses</h3>
                            <p className="text-3xl font-bold text-white">${totalExpenses.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl p-6 border border-orange-500/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <CalendarIcon className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">This Month</h3>
                            <p className="text-3xl font-bold text-white">${currentMonthExpenses.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">Expense History</h2>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Month Filter */}
                    <div className="flex items-center space-x-2">
                        <FunnelIcon className="w-5 h-5 text-gray-400" />
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000]"
                    >
                        <option value="all">All Categories</option>
                        {EXPENSE_CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>

                    {/* Add Button */}
                    <button
                        onClick={openAddModal}
                        className="flex items-center space-x-2 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-lg"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Add Expense</span>
                    </button>
                </div>
            </div>

            {/* Expense Table */}
            <div className="bg-[#383838] rounded-2xl border border-gray-600 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#232326] border-b border-gray-600">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Category</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Note</th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                            {sortedExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        <CreditCardIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                        <p className="text-lg font-medium">No expenses found</p>
                                        <p className="text-sm">Add your first expense or adjust your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-[#232326] transition-colors">
                                        <td className="px-6 py-4 text-white font-medium">
                                            {formatDate(expense.date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-gray-300">{expense.category}</span>
                                                {expense.isEMI && (
                                                    <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                                                        EMI
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-red-400 font-bold">
                                            ${expense.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 max-w-xs truncate">
                                            {expense.note || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => openEditModal(expense)}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
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
                    <div className="bg-[#232326] rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">
                                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 text-gray-400 hover:text-white hover:bg-[#383838] rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Date Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Category Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {EXPENSE_CATEGORIES.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Amount *
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

                            {/* Note Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="note"
                                    value={formData.note}
                                    onChange={handleInputChange}
                                    placeholder="Add a note about this expense"
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent placeholder-gray-500"
                                />
                            </div>

                            {/* EMI Checkbox */}
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    name="isEMI"
                                    checked={formData.isEMI}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-[#F70000] bg-[#383838] border-gray-600 rounded focus:ring-[#F70000] focus:ring-2"
                                />
                                <label className="text-gray-300 text-sm font-medium">
                                    This is an EMI payment
                                </label>
                            </div>

                            {/* EMI Fields */}
                            {formData.isEMI && (
                                <div className="space-y-4 p-4 bg-[#383838] rounded-lg border border-gray-600">
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            EMI Duration (months) *
                                        </label>
                                        <input
                                            type="number"
                                            name="emiDuration"
                                            value={formData.emiDuration}
                                            onChange={handleInputChange}
                                            placeholder="12"
                                            min="1"
                                            className="w-full px-4 py-3 rounded-lg bg-[#232326] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent"
                                            required={formData.isEMI}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            Start Month *
                                        </label>
                                        <input
                                            type="month"
                                            name="emiStartMonth"
                                            value={formData.emiStartMonth}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-lg bg-[#232326] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent"
                                            required={formData.isEMI}
                                        />
                                    </div>
                                </div>
                            )}

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
                                    {loading ? 'Saving...' : (editingExpense ? 'Update' : 'Add Expense')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 