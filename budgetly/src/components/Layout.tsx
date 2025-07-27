'use client';

import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import IncomeManager from './IncomeManager';
import ExpenseManager from './ExpenseManager';
import SavingsManager from './SavingsManager';
import EMIManager from './EMIManager';
import SuggestionsManager from './SuggestionsManager';
import ReportsManager from './ReportsManager';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Layout() {
    const { user: authUser } = useAuth();
    const { state } = useData();
    const { user: dbUser } = state;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState('dashboard');

    // Memoize the navigation handler to prevent infinite loops
    const handleNavigate = useCallback((section: string) => {
        setCurrentSection(section);
    }, []);

    const getSectionTitle = () => {
        const titles: { [key: string]: string } = {
            dashboard: 'Dashboard',
            income: 'Income Manager',
            expenses: 'Expense Manager',
            savings: 'Savings Overview',
            emis: 'EMI Tracker',
            suggestions: 'Financial Suggestions',
            reports: 'Reports & History'
        };
        return titles[currentSection] || 'Dashboard';
    };

    const getSectionDescription = () => {
        const descriptions: { [key: string]: string } = {
            dashboard: 'Track your financial overview and key metrics',
            income: 'Manage and track your income sources',
            expenses: 'Record and categorize your expenses',
            savings: 'Monitor your savings progress and goals',
            emis: 'Track your EMI payments and schedules',
            suggestions: 'Get personalized financial advice',
            reports: 'View detailed financial reports and history'
        };
        return descriptions[currentSection] || 'Track your financial overview and key metrics';
    };

    const renderSectionContent = () => {
        switch (currentSection) {
            case 'dashboard':
                return <Dashboard />;
            case 'income':
                return <IncomeManager />;
            case 'expenses':
                return <ExpenseManager />;
            case 'savings':
                return <SavingsManager />;
            case 'emis':
                return <EMIManager />;
            case 'suggestions':
                return <SuggestionsManager />;
            case 'reports':
                return <ReportsManager />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-[#1C1C1E]">
            {/* Sidebar */}
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onNavigate={handleNavigate}
                currentSection={currentSection}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-[#232326] border-b border-gray-600 px-6 py-5.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div>
                                <h3 className="text-xl font-bold text-[#F70000]">Smarter spending. Stress free saving. Thats Budgetly.</h3>
                                
                            </div>
                        </div>

                        {/* User Info */}
                        {authUser && (
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="text-white font-medium text-sm">{authUser.displayName || 'User'}</p>
                                    <p className="text-gray-400 text-xs">{authUser.email}</p>
                                </div>
                                {authUser.photoURL ? (
                                    <img
                                        src={authUser.photoURL}
                                        alt={authUser.displayName || 'User'}
                                        className="w-8 h-8 rounded-full"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">
                                            {authUser.displayName?.charAt(0) || 'U'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    {renderSectionContent()}
                </main>
            </div>
        </div>
    );
} 