// API Service Layer
// This file contains all API calls and utility functions

// Types
export interface User {
    _id: string;
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
    savings: number;
    location?: string;
    occupation?: string;
    months: { [monthKey: string]: MonthData };
    createdAt: Date;
    updatedAt: Date;
}

export interface IncomeEntry {
    _id?: string;
    label: string;
    amount: number;
    source: string;
    date: Date;
}

export interface MonthData {
    income: IncomeEntry[];
    expenses: Expense[];
}

export interface Expense {
    _id?: string;
    label: string;
    amount: number;
    category: string;
    date: Date;
    type: 'one-time' | 'emi';
    emiDetails?: {
        duration: number;
        remainingMonths: number;
        monthlyAmount: number;
        startedOn: Date;
    };
}

export interface ProductSuggestion {
    _id: string;
    uid: string;
    productName: string;
    price: number;
    emiAmount?: number;
    duration?: number;
    suggestionScore: 'Good' | 'Moderate' | 'Risky';
    reason: string;
    suggestedAt: Date;
}

// User API
export const userAPI = {
    async getUser(uid: string): Promise<User> {
        console.log('🌐 userAPI.getUser called for UID:', uid);
        const response = await fetch(`/api/user?uid=${uid}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('User not found');
            }
            throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const userData = await response.json();
        console.log('🌐 userAPI.getUser returned data:', JSON.stringify(userData, null, 2));
        return userData;
    },

    async createUser(userData: Partial<User>): Promise<User> {
        const response = await fetch('/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error(`Failed to create user: ${response.statusText}`);
        }

        return response.json();
    },

    async updateUser(uid: string, updateData: Partial<User>): Promise<User> {
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid, ...updateData }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update user: ${response.statusText}`);
        }

        return response.json();
    },
};

// Income API
export const incomeAPI = {
    async getIncome(uid: string, month?: string): Promise<{ income: IncomeEntry[], totalIncome: number }> {
        const url = month
            ? `/api/income?uid=${uid}&month=${month}`
            : `/api/income?uid=${uid}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch income: ${response.statusText}`);
        }

        return response.json();
    },

    async addIncome(uid: string, month: string, incomeEntry: Omit<IncomeEntry, '_id'>): Promise<{ success: boolean; user: User }> {
        const response = await fetch('/api/income', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid, month, incomeEntry }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add income: ${response.statusText}`);
        }

        return response.json();
    },

    async updateIncome(uid: string, month: string, incomeId: string, incomeEntry: Partial<IncomeEntry>): Promise<{ success: boolean; user: User }> {
        const response = await fetch('/api/income', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid, month, incomeId, incomeEntry }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update income: ${response.statusText}`);
        }

        return response.json();
    },

    async deleteIncome(uid: string, month: string, incomeId: string): Promise<{ success: boolean; user: User }> {
        const response = await fetch('/api/income', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid, month, incomeId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete income: ${response.statusText}`);
        }

        return response.json();
    },
};

// Expenses API
export const expensesAPI = {
    async getExpenses(uid: string, month?: string): Promise<Expense[]> {
        const url = month
            ? `/api/expenses?uid=${uid}&month=${month}`
            : `/api/expenses?uid=${uid}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch expenses: ${response.statusText}`);
        }

        return response.json();
    },

    async addExpense(uid: string, month: string, expense: Omit<Expense, '_id'>): Promise<{ success: boolean; user: User }> {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid, month, expense }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add expense: ${response.statusText}`);
        }

        return response.json();
    },

    async updateExpense(uid: string, month: string, expenseId: string, expense: Partial<Expense>): Promise<{ success: boolean; user: User }> {
        const response = await fetch('/api/expenses', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid, month, expenseId, expense }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update expense: ${response.statusText}`);
        }

        return response.json();
    },

    async deleteExpense(uid: string, month: string, expenseId: string): Promise<{ success: boolean; user: User }> {
        const response = await fetch('/api/expenses', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid, month, expenseId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete expense: ${response.statusText}`);
        }

        return response.json();
    },
};

// Suggestions API
export const suggestionsAPI = {
    async getSuggestions(uid: string, limit?: number): Promise<ProductSuggestion[]> {
        const url = limit
            ? `/api/suggestions?uid=${uid}&limit=${limit}`
            : `/api/suggestions?uid=${uid}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
        }

        return response.json();
    },

    async createSuggestion(suggestion: Omit<ProductSuggestion, '_id' | 'suggestedAt'>): Promise<ProductSuggestion> {
        const response = await fetch('/api/suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(suggestion),
        });

        if (!response.ok) {
            throw new Error(`Failed to create suggestion: ${response.statusText}`);
        }

        return response.json();
    },

    async deleteSuggestion(uid: string, suggestionId: string): Promise<void> {
        const response = await fetch('/api/suggestions', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid, suggestionId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete suggestion: ${response.statusText}`);
        }
    },
};

// Utility functions
export const utils = {
    // Convert month data to array format for easier processing
    convertMonthDataToArray(user: User): Array<{ month: string; data: MonthData }> {
        return Object.entries(user.months).map(([month, data]) => ({
            month,
            data
        }));
    },

    // Get current month in YYYY-MM format
    getCurrentMonth(): string {
        return new Date().toISOString().slice(0, 7);
    },

    // Format date for display
    formatDate(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Calculate total expenses for a month
    calculateTotalExpenses(expenses: Expense[]): number {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    },

    // Get active EMIs
    getActiveEMIs(expenses: Expense[]): Expense[] {
        return expenses.filter(expense =>
            expense.type === 'emi' &&
            expense.emiDetails &&
            expense.emiDetails.remainingMonths > 0
        );
    },

    // Calculate total EMI burden
    calculateTotalEMIBurden(expenses: Expense[]): number {
        const activeEMIs = this.getActiveEMIs(expenses);
        return activeEMIs.reduce((sum, emi) => {
            return sum + (emi.emiDetails?.monthlyAmount || 0);
        }, 0);
    },

    // Calculate financial health score (0-100)
    calculateFinancialHealthScore(user: User, currentMonth: string): number {
        const monthData = user.months[currentMonth];
        if (!monthData) return 0;

        const income = monthData.income.reduce((sum, item) => sum + item.amount, 0);
        const expenses = this.calculateTotalExpenses(monthData.expenses);
        const emiBurden = this.calculateTotalEMIBurden(monthData.expenses);
        const savings = user.savings;

        if (income === 0) return 0;

        // Calculate savings rate
        const savingsRate = ((income - expenses) / income) * 100;

        // Calculate EMI burden ratio
        const emiRatio = (emiBurden / income) * 100;

        // Calculate emergency fund ratio (assuming 6 months of expenses as emergency fund)
        const emergencyFundRatio = savings / (expenses * 6) * 100;

        // Weighted scoring
        let score = 0;
        score += Math.min(savingsRate * 2, 40); // Savings rate (max 40 points)
        score += Math.max(0, 30 - emiRatio * 0.5); // EMI burden (max 30 points)
        score += Math.min(emergencyFundRatio * 0.3, 30); // Emergency fund (max 30 points)

        return Math.round(Math.max(0, Math.min(100, score)));
    },

    // Generate spending insights
    generateSpendingInsights(expenses: Expense[]): string[] {
        const insights: string[] = [];

        if (expenses.length === 0) {
            insights.push("No expenses recorded yet. Start tracking to get insights!");
            return insights;
        }

        // Category analysis
        const categoryTotals: { [key: string]: number } = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        const topCategory = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)[0];

        if (topCategory) {
            insights.push(`Your highest spending category is ${topCategory[0]} (₹${topCategory[1].toLocaleString()})`);
        }

        // EMI analysis
        const activeEMIs = this.getActiveEMIs(expenses);
        if (activeEMIs.length > 0) {
            const totalEMI = this.calculateTotalEMIBurden(expenses);
            insights.push(`You have ${activeEMIs.length} active EMI(s) totaling ₹${totalEMI.toLocaleString()}/month`);
        }

        // Large expense analysis
        const largeExpenses = expenses.filter(exp => exp.amount > 10000);
        if (largeExpenses.length > 0) {
            insights.push(`You have ${largeExpenses.length} large expense(s) over ₹10,000`);
        }

        return insights;
    }
}; 