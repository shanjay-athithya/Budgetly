'use client';

import React, { useState } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    BanknotesIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

interface EMIEntry {
    id: string;
    productName: string;
    totalAmount: number;
    duration: number;
    startMonth: string; // YYYY-MM format
    monthlyInstallment: number;
    paidMonths: number;
    isActive: boolean;
}

interface EMIManagerProps {
    emis?: EMIEntry[];
    onSave?: (emi: EMIEntry) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function EMIManager({ emis = [], onSave, onDelete }: EMIManagerProps) {
    const [localEMIs, setLocalEMIs] = useState<EMIEntry[]>(emis);
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

    // Calculate EMI details
    const calculateEMIDetails = (emi: EMIEntry) => {
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
    };

    // Separate active and completed EMIs
    const activeEMIs = localEMIs.filter(emi => emi.isActive);
    const completedEMIs = localEMIs.filter(emi => !emi.isActive);

    // Calculate totals
    const totalActiveEMIs = activeEMIs.length;
    const totalMonthlyEMI = activeEMIs.reduce((sum, emi) => sum + emi.monthlyInstallment, 0);
    const totalEMIAmount = activeEMIs.reduce((sum, emi) => sum + emi.totalAmount, 0);

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
            productName: '',
            totalAmount: '',
            duration: '',
            startMonth: ''
        });
        setEditingEMI(null);
    };

    const openAddModal = () => {
        resetForm();
        setFormData({
            productName: '',
            totalAmount: '',
            duration: '',
            startMonth: new Date().toISOString().slice(0, 7)
        });
        setShowModal(true);
    };

    const openEditModal = (emi: EMIEntry) => {
        setEditingEMI(emi);
        setFormData({
            productName: emi.productName,
            totalAmount: emi.totalAmount.toString(),
            duration: emi.duration.toString(),
            startMonth: emi.startMonth
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

        if (!formData.productName || !formData.totalAmount || !formData.duration || !formData.startMonth) {
            addToast('Please fill in all fields', 'error');
            return;
        }

        const totalAmount = parseFloat(formData.totalAmount);
        const duration = parseInt(formData.duration);

        if (isNaN(totalAmount) || totalAmount <= 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        if (isNaN(duration) || duration <= 0) {
            addToast('Please enter a valid duration', 'error');
            return;
        }

        const monthlyInstallment = totalAmount / duration;

        setLoading(true);
        try {
            const emiData: EMIEntry = {
                id: editingEMI?.id || Date.now().toString(),
                productName: formData.productName,
                totalAmount: totalAmount,
                duration: duration,
                startMonth: formData.startMonth,
                monthlyInstallment: monthlyInstallment,
                paidMonths: editingEMI?.paidMonths || 0,
                isActive: true
            };

            if (onSave) {
                await onSave(emiData);
            } else {
                // Local state management if no backend
                if (editingEMI) {
                    setLocalEMIs(prev =>
                        prev.map(emi =>
                            emi.id === editingEMI.id ? emiData : emi
                        )
                    );
                } else {
                    setLocalEMIs(prev => [...prev, emiData]);
                }
            }

            addToast(
                editingEMI
                    ? 'EMI updated successfully!'
                    : 'EMI added successfully!',
                'success'
            );
            closeModal();
        } catch (error) {
            addToast('Failed to save EMI. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Delete handler
    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this EMI?')) {
            return;
        }

        setLoading(true);
        try {
            if (onDelete) {
                await onDelete(id);
            } else {
                // Local state management if no backend
                setLocalEMIs(prev => prev.filter(emi => emi.id !== id));
            }
            addToast('EMI deleted successfully!', 'success');
        } catch (error) {
            addToast('Failed to delete EMI. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Mark as paid handler
    const handleMarkAsPaid = (emi: EMIEntry) => {
        const updatedEMI = {
            ...emi,
            paidMonths: emi.paidMonths + 1,
            isActive: emi.paidMonths + 1 < emi.duration
        };

        setLocalEMIs(prev =>
            prev.map(e => e.id === emi.id ? updatedEMI : e)
        );

        addToast(`Marked ${emi.productName} EMI as paid for this month!`, 'success');
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const [year, month] = dateString.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    return (
        <div className="space-y-8">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#F70000]/10 to-[#F70000]/5 rounded-2xl p-6 border border-[#F70000]/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-[#F70000]/20 rounded-xl flex items-center justify-center">
                            <BanknotesIcon className="w-6 h-6 text-[#F70000]" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">Active EMIs</h3>
                            <p className="text-3xl font-bold text-white">{totalActiveEMIs}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-6 border border-blue-500/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <CalendarIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">Monthly EMI</h3>
                            <p className="text-3xl font-bold text-white">${totalMonthlyEMI.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 border border-green-500/20 shadow-xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CheckCircleIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium">Total Amount</h3>
                            <p className="text-3xl font-bold text-white">${totalEMIAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active EMIs Section */}
            <div className="bg-[#383838] rounded-2xl border border-gray-600 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-600 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Active EMIs</h2>
                    <button
                        onClick={openAddModal}
                        className="flex items-center space-x-2 bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-lg"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Add EMI</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#232326] border-b border-gray-600">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Product</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Total Amount</th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Progress</th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Monthly</th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">End Date</th>
                                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                            {activeEMIs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        <BanknotesIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                        <p className="text-lg font-medium">No active EMIs</p>
                                        <p className="text-sm">Add your first EMI to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                activeEMIs.map((emi) => {
                                    const details = calculateEMIDetails(emi);
                                    return (
                                        <tr key={emi.id} className="hover:bg-[#232326] transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-white font-medium">{emi.productName}</p>
                                                    <p className="text-gray-400 text-sm">
                                                        Started {formatDate(emi.startMonth)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-white font-bold">${emi.totalAmount.toLocaleString()}</p>
                                                <p className="text-gray-400 text-sm">
                                                    {emi.paidMonths}/{emi.duration} months
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                                                        <div
                                                            className="bg-[#F70000] h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${details.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-gray-300 text-sm font-medium">
                                                        {details.progress.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="text-[#F70000] font-bold">${emi.monthlyInstallment.toFixed(0)}</p>
                                                <p className="text-gray-400 text-sm">
                                                    {details.remainingMonths} remaining
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-300">
                                                {formatDate(details.endMonth)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleMarkAsPaid(emi)}
                                                        className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                                                        title="Mark as paid"
                                                    >
                                                        <CheckCircleIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(emi)}
                                                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(emi.id)}
                                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Completed EMIs Section */}
            {completedEMIs.length > 0 && (
                <div className="bg-[#383838] rounded-2xl border border-gray-600 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-600">
                        <h2 className="text-2xl font-bold text-white">Completed EMIs</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#232326] border-b border-gray-600">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Product</th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Total Amount</th>
                                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Duration</th>
                                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Monthly</th>
                                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Completed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-600">
                                {completedEMIs.map((emi) => {
                                    const details = calculateEMIDetails(emi);
                                    return (
                                        <tr key={emi.id} className="hover:bg-[#232326] transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-white font-medium">{emi.productName}</p>
                                                    <p className="text-gray-400 text-sm">
                                                        {formatDate(emi.startMonth)} - {formatDate(details.endMonth)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-white font-bold">${emi.totalAmount.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-300">
                                                {emi.duration} months
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-300">
                                                ${emi.monthlyInstallment.toFixed(0)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                                    <span className="text-green-400 font-medium">Completed</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-[#232326] rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">
                                {editingEMI ? 'Edit EMI' : 'Add New EMI'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 text-gray-400 hover:text-white hover:bg-[#383838] rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Product Name Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    name="productName"
                                    value={formData.productName}
                                    onChange={handleInputChange}
                                    placeholder="e.g., iPhone 15, Car Loan, Home Loan"
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent placeholder-gray-500"
                                    required
                                />
                            </div>

                            {/* Total Amount Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Total Amount *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                                    <input
                                        type="number"
                                        name="totalAmount"
                                        value={formData.totalAmount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className="w-full pl-8 pr-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent placeholder-gray-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Duration Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Duration (months) *
                                </label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    placeholder="12"
                                    min="1"
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent placeholder-gray-500"
                                    required
                                />
                            </div>

                            {/* Start Month Field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Start Month *
                                </label>
                                <input
                                    type="month"
                                    name="startMonth"
                                    value={formData.startMonth}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-lg bg-[#383838] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F70000] focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Monthly Installment Preview */}
                            {formData.totalAmount && formData.duration && (
                                <div className="bg-[#383838] rounded-lg p-4 border border-gray-600">
                                    <p className="text-gray-400 text-sm mb-1">Monthly Installment</p>
                                    <p className="text-2xl font-bold text-[#F70000]">
                                        ${(parseFloat(formData.totalAmount) / parseInt(formData.duration)).toFixed(0)}
                                    </p>
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
                                    {loading ? 'Saving...' : (editingEMI ? 'Update' : 'Add EMI')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 