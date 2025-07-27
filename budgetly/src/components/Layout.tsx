'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import IncomeManager from './IncomeManager';
import ExpenseManager from './ExpenseManager';
import SavingsManager from './SavingsManager';
import EMIManager from './EMIManager';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface LayoutProps {
    children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState('dashboard');

    const handleNavigate = (section: string) => {
        setCurrentSection(section);
        // Here you would typically handle navigation logic
        console.log(`Navigating to: ${section}`);
    };

    const getSectionTitle = (section: string) => {
        const titles: { [key: string]: string } = {
            dashboard: 'Dashboard',
            income: 'Income Management',
            expenses: 'Expense Tracking',
            savings: 'Savings Goals',
            emis: 'EMI Management',
            suggestions: 'Financial Suggestions',
            reports: 'Financial Reports'
        };
        return titles[section] || 'Dashboard';
    };

    const getSectionDescription = (section: string) => {
        const descriptions: { [key: string]: string } = {
            dashboard: 'Overview of your financial health and key metrics',
            income: 'Track and manage your income sources',
            expenses: 'Monitor and categorize your expenses',
            savings: 'Set and track your savings goals',
            emis: 'Manage your loan EMIs and payments',
            suggestions: 'Get personalized financial advice',
            reports: 'Detailed financial analysis and reports'
        };
        return descriptions[section] || 'Overview of your financial health and key metrics';
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
                return (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-bold text-white mb-4">Financial Suggestions</h3>
                        <p className="text-gray-400">Coming soon...</p>
                    </div>
                );
            case 'reports':
                return (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-bold text-white mb-4">Financial Reports</h3>
                        <p className="text-gray-400">Coming soon...</p>
                    </div>
                );
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-[#1C1C1E] flex">
            {/* Sidebar */}
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onNavigate={handleNavigate}
                currentSection={currentSection}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <header className="lg:hidden bg-[#232326] border-b border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#F70000] rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">B</span>
                            </div>
                            <span className="text-xl font-bold text-white">Budgetly</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-[#383838] text-gray-400 hover:text-white transition-colors"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {getSectionTitle(currentSection)}
                            </h1>
                            <p className="text-gray-400">
                                {getSectionDescription(currentSection)}
                            </p>
                        </div>

                        {/* Content Area */}
                        <div className="bg-[#232326] rounded-2xl shadow-xl p-6 border border-gray-700">
                            {renderSectionContent()}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
} 