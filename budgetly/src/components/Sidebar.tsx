'use client';

import React from 'react';
import {
    HomeIcon,
    CurrencyDollarIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    ClockIcon,
    ChartBarIcon,
    LightBulbIcon,
    DocumentTextIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../lib/firebase';

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
    { name: 'EMIs', icon: ClockIcon, section: 'emis' },
    { name: 'Suggestions', icon: LightBulbIcon, section: 'suggestions' },
    { name: 'Reports', icon: DocumentTextIcon, section: 'reports' },
];

export default function Sidebar({ open, onClose, onNavigate, currentSection }: SidebarProps) {
    const { user } = useAuth();

    const handleNavigation = (section: string) => {
        onNavigate(section);
        onClose();
    };

    const handleSignOut = async () => {
        try {
            await signOutUser();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#232326] border-r border-gray-600 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-600">
                    <div className="flex items-center space-x-3">
                        <img
                            src="https://ik.imagekit.io/hmx3cjrmq/logo.png?updatedAt=1753641722698"
                            alt="Budgetly Logo"
                            className="w-8 h-8 rounded-lg object-cover"
                        />

                        <h1 className="text-xl font-bold text-white">Budgetly</h1>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentSection === item.section;
                        return (
                            <button
                                key={item.section}
                                onClick={() => handleNavigation(item.section)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive
                                    ? 'bg-[#F70000] text-white'
                                    : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Account Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-600">
                    {user && (
                        <div className="space-y-3">
                            {/* User Profile */}
                            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || 'User'}
                                        className="w-10 h-10 rounded-full"
                                    />
                                ) : (
                                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">
                                        {user.displayName || 'User'}
                                    </p>
                                    <p className="text-gray-400 text-sm truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            {/* Sign Out Button */}
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-600 hover:text-white rounded-lg transition-colors duration-200"
                            >
                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
} 