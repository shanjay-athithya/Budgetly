'use client';

import React, { useState } from 'react';
import {
    HomeIcon,
    CurrencyDollarIcon,
    CreditCardIcon,
    BanknotesIcon,
    LightBulbIcon,
    ChartBarIcon,
    Bars3Icon,
    XMarkIcon,
    BuildingLibraryIcon,
    DocumentChartBarIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    onNavigate: (section: string) => void;
    currentSection: string;
}

const navigationItems = [
    { name: 'Dashboard', icon: HomeIcon, section: 'dashboard' },
    { name: 'Income', icon: CurrencyDollarIcon, section: 'income' },
    { name: 'Expenses', icon: CreditCardIcon, section: 'expenses' },
    { name: 'Savings', icon: BuildingLibraryIcon, section: 'savings' },
    { name: 'EMIs', icon: BanknotesIcon, section: 'emis' },
    { name: 'Suggestions', icon: LightBulbIcon, section: 'suggestions' },
    { name: 'Reports', icon: DocumentChartBarIcon, section: 'reports' },
];

export default function Sidebar({ open, onClose, onNavigate, currentSection }: SidebarProps) {
    const handleNavigation = (section: string) => {
        onNavigate(section);
        onClose();
    };

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full z-50 bg-[#232326] shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
                    } lg:relative lg:z-auto w-64 border-r border-gray-700`}
            >
                {/* Header with Logo */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#F70000] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">B</span>
                        </div>
                        <span className="text-xl font-bold text-white">Budgetly</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg hover:bg-[#383838] text-gray-400 hover:text-white transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col p-4 space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentSection === item.section;

                        return (
                            <button
                                key={item.section}
                                onClick={() => handleNavigation(item.section)}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left w-full ${isActive
                                    ? 'bg-[#F70000] text-white shadow-lg'
                                    : 'text-gray-300 hover:bg-[#383838] hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                <span className="font-medium">{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom section for additional features */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
                    <div className="bg-[#383838] rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#F70000] rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">U</span>
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">User Account</p>
                                <p className="text-gray-400 text-xs">Premium Member</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
} 