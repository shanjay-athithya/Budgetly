'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { userAPI, incomeAPI, expensesAPI, suggestionsAPI, utils, User, Expense, ProductSuggestion } from '../services/api';

// State interface
interface AppState {
    user: User | null;
    currentMonth: string;
    loading: boolean;
    error: string | null;
    incomes: any[];
    expenses: any[];
    emis: any[];
    suggestions: ProductSuggestion[];
}

// Action types
type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_USER'; payload: User }
    | { type: 'SET_CURRENT_MONTH'; payload: string }
    | { type: 'SET_INCOMES'; payload: any[] }
    | { type: 'SET_EXPENSES'; payload: any[] }
    | { type: 'SET_EMIS'; payload: any[] }
    | { type: 'SET_SUGGESTIONS'; payload: ProductSuggestion[] }
    | { type: 'ADD_INCOME'; payload: any }
    | { type: 'ADD_EXPENSE'; payload: any }
    | { type: 'UPDATE_EXPENSE'; payload: any }
    | { type: 'DELETE_EXPENSE'; payload: string }
    | { type: 'ADD_SUGGESTION'; payload: ProductSuggestion }
    | { type: 'DELETE_SUGGESTION'; payload: string };

// Initial state
const initialState: AppState = {
    user: null,
    currentMonth: utils.getCurrentMonth(),
    loading: false,
    error: null,
    incomes: [],
    expenses: [],
    emis: [],
    suggestions: []
};

// Reducer function
function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'SET_USER':
            return { ...state, user: action.payload };

        case 'SET_CURRENT_MONTH':
            return { ...state, currentMonth: action.payload };

        case 'SET_INCOMES':
            return { ...state, incomes: action.payload };

        case 'SET_EXPENSES':
            return { ...state, expenses: action.payload };

        case 'SET_EMIS':
            return { ...state, emis: action.payload };

        case 'SET_SUGGESTIONS':
            return { ...state, suggestions: action.payload };

        case 'ADD_INCOME':
            return { ...state, incomes: [...state.incomes, action.payload] };

        case 'ADD_EXPENSE':
            return { ...state, expenses: [...state.expenses, action.payload] };

        case 'UPDATE_EXPENSE':
            return {
                ...state,
                expenses: state.expenses.map(exp =>
                    exp._id === action.payload._id ? action.payload : exp
                )
            };

        case 'DELETE_EXPENSE':
            return {
                ...state,
                expenses: state.expenses.filter(exp => exp._id !== action.payload)
            };

        case 'ADD_SUGGESTION':
            return { ...state, suggestions: [action.payload, ...state.suggestions] };

        case 'DELETE_SUGGESTION':
            return {
                ...state,
                suggestions: state.suggestions.filter(s => s._id !== action.payload)
            };

        default:
            return state;
    }
}

// Context interface
interface DataContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    // User actions
    loadUser: (uid: string) => Promise<void>;
    createUser: (userData: any) => Promise<void>;
    updateUser: (uid: string, updateData: any) => Promise<void>;
    // Income actions
    loadIncome: (uid: string, month?: string) => Promise<void>;
    addIncome: (uid: string, month: string, amount: number) => Promise<void>;
    updateIncome: (uid: string, month: string, amount: number) => Promise<void>;
    // Expense actions
    loadExpenses: (uid: string, month?: string) => Promise<void>;
    addExpense: (uid: string, month: string, expense: any) => Promise<void>;
    updateExpense: (uid: string, month: string, expenseId: string, expense: any) => Promise<void>;
    deleteExpense: (uid: string, month: string, expenseId: string) => Promise<void>;
    // Suggestion actions
    loadSuggestions: (uid: string, limit?: number) => Promise<void>;
    createSuggestion: (suggestionData: any) => Promise<void>;
    deleteSuggestion: (uid: string, suggestionId: string) => Promise<void>;
    // Utility actions
    setCurrentMonth: (month: string) => void;
    clearError: () => void;
}

// Create context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider component
export function DataProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const loadUser = useCallback(async (uid: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const user = await userAPI.getUser(uid);
            dispatch({ type: 'SET_USER', payload: user });

            // Load current month data
            const currentMonth = utils.getCurrentMonth();
            const monthData = user.months[currentMonth] || { income: 0, expenses: [] };

            dispatch({ type: 'SET_INCOMES', payload: [monthData.income] });
            dispatch({ type: 'SET_EXPENSES', payload: monthData.expenses });
            dispatch({ type: 'SET_EMIS', payload: monthData.expenses.filter((exp: any) => exp.type === 'emi') });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const createUser = useCallback(async (userData: any) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const user = await userAPI.createUser(userData);
            dispatch({ type: 'SET_USER', payload: user });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const updateUser = useCallback(async (uid: string, updateData: any) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const user = await userAPI.updateUser(uid, updateData);
            dispatch({ type: 'SET_USER', payload: user });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const loadIncome = useCallback(async (uid: string, month?: string) => {
        try {
            const monthKey = month || state.currentMonth;
            const income = await incomeAPI.getIncome(uid, monthKey);
            dispatch({ type: 'SET_INCOMES', payload: [income] });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    }, [state.currentMonth]);

    const addIncome = useCallback(async (uid: string, month: string, amount: number) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const income = await incomeAPI.addIncome(uid, month, amount);
            dispatch({ type: 'ADD_INCOME', payload: income });

            // Update user state
            if (state.user) {
                const updatedUser = { ...state.user };
                if (!updatedUser.months[month]) {
                    updatedUser.months[month] = { income: 0, expenses: [] };
                }
                updatedUser.months[month].income = amount;
                dispatch({ type: 'SET_USER', payload: updatedUser });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.user]);

    const updateIncome = useCallback(async (uid: string, month: string, amount: number) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const income = await incomeAPI.updateIncome(uid, month, amount);
            dispatch({ type: 'SET_INCOMES', payload: [income] });

            // Update user state
            if (state.user) {
                const updatedUser = { ...state.user };
                if (!updatedUser.months[month]) {
                    updatedUser.months[month] = { income: 0, expenses: [] };
                }
                updatedUser.months[month].income = amount;
                dispatch({ type: 'SET_USER', payload: updatedUser });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.user]);

    const loadExpenses = useCallback(async (uid: string, month?: string) => {
        try {
            const monthKey = month || state.currentMonth;
            const expenses = await expensesAPI.getExpenses(uid, monthKey);
            dispatch({ type: 'SET_EXPENSES', payload: expenses });
            dispatch({ type: 'SET_EMIS', payload: expenses.filter((exp: any) => exp.type === 'emi') });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    }, [state.currentMonth]);

    const addExpense = useCallback(async (uid: string, month: string, expense: any) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const newExpense = await expensesAPI.addExpense(uid, month, expense);
            dispatch({ type: 'ADD_EXPENSE', payload: newExpense });

            // Update EMIs if it's an EMI expense
            if (expense.type === 'emi') {
                dispatch({ type: 'SET_EMIS', payload: [...state.emis, newExpense] });
            }

            // Update user state
            if (state.user) {
                const updatedUser = { ...state.user };
                if (!updatedUser.months[month]) {
                    updatedUser.months[month] = { income: 0, expenses: [] };
                }
                updatedUser.months[month].expenses.push(newExpense);
                dispatch({ type: 'SET_USER', payload: updatedUser });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.user, state.emis]);

    const updateExpense = useCallback(async (uid: string, month: string, expenseId: string, expense: any) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const updatedExpense = await expensesAPI.updateExpense(uid, month, expenseId, expense);
            dispatch({ type: 'UPDATE_EXPENSE', payload: updatedExpense });

            // Update user state
            if (state.user) {
                const updatedUser = { ...state.user };
                if (updatedUser.months[month]) {
                    updatedUser.months[month].expenses = updatedUser.months[month].expenses.map((exp: any) =>
                        exp._id === expenseId ? updatedExpense : exp
                    );
                    dispatch({ type: 'SET_USER', payload: updatedUser });
                }
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.user]);

    const deleteExpense = useCallback(async (uid: string, month: string, expenseId: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            await expensesAPI.deleteExpense(uid, month, expenseId);
            dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });

            // Update user state
            if (state.user) {
                const updatedUser = { ...state.user };
                if (updatedUser.months[month]) {
                    updatedUser.months[month].expenses = updatedUser.months[month].expenses.filter((exp: any) => exp._id !== expenseId);
                    dispatch({ type: 'SET_USER', payload: updatedUser });
                }
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.user]);

    const loadSuggestions = useCallback(async (uid: string, limit?: number) => {
        try {
            const suggestions = await suggestionsAPI.getSuggestions(uid, limit);
            dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    }, []);

    const createSuggestion = useCallback(async (suggestionData: any) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const suggestion = await suggestionsAPI.createSuggestion(suggestionData);
            dispatch({ type: 'ADD_SUGGESTION', payload: suggestion });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const deleteSuggestion = useCallback(async (uid: string, suggestionId: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            await suggestionsAPI.deleteSuggestion(uid, suggestionId);
            dispatch({ type: 'DELETE_SUGGESTION', payload: suggestionId });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const setCurrentMonth = useCallback((month: string) => {
        dispatch({ type: 'SET_CURRENT_MONTH', payload: month });
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
    }, []);

    const value = {
        state,
        dispatch,
        loadUser,
        createUser,
        updateUser,
        loadIncome,
        addIncome,
        updateIncome,
        loadExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
        loadSuggestions,
        createSuggestion,
        deleteSuggestion,
        setCurrentMonth,
        clearError
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

// Hook to use the context
export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
} 