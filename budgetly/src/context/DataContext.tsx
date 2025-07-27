'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { userAPI, incomeAPI, expensesAPI, suggestionsAPI, utils, User, Expense, ProductSuggestion, IncomeEntry } from '../services/api';

// State interface
interface AppState {
    user: User | null;
    currentMonth: string;
    loading: boolean;
    error: string | null;
    incomes: IncomeEntry[];
    expenses: Expense[];
    emis: Expense[];
    suggestions: ProductSuggestion[];
}

// Action types
type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_USER'; payload: User }
    | { type: 'SET_CURRENT_MONTH'; payload: string }
    | { type: 'SET_INCOMES'; payload: IncomeEntry[] }
    | { type: 'SET_EXPENSES'; payload: Expense[] }
    | { type: 'SET_EMIS'; payload: Expense[] }
    | { type: 'SET_SUGGESTIONS'; payload: ProductSuggestion[] }
    | { type: 'ADD_INCOME'; payload: IncomeEntry }
    | { type: 'UPDATE_INCOME'; payload: IncomeEntry }
    | { type: 'DELETE_INCOME'; payload: string }
    | { type: 'ADD_EXPENSE'; payload: Expense }
    | { type: 'UPDATE_EXPENSE'; payload: Expense }
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

        case 'UPDATE_INCOME':
            return {
                ...state,
                incomes: state.incomes.map(inc =>
                    inc._id === action.payload._id ? action.payload : inc
                )
            };

        case 'DELETE_INCOME':
            return {
                ...state,
                incomes: state.incomes.filter(inc => inc._id !== action.payload)
            };

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
    createUser: (userData: Partial<User>) => Promise<void>;
    updateUser: (uid: string, updateData: Partial<User>) => Promise<void>;
    // Income actions
    loadIncome: (uid: string, month?: string) => Promise<void>;
    addIncome: (uid: string, month: string, incomeEntry: Omit<IncomeEntry, '_id'>) => Promise<void>;
    updateIncome: (uid: string, month: string, incomeId: string, incomeEntry: Partial<IncomeEntry>) => Promise<void>;
    deleteIncome: (uid: string, month: string, incomeId: string) => Promise<void>;
    // Expense actions
    loadExpenses: (uid: string, month?: string) => Promise<void>;
    addExpense: (uid: string, month: string, expense: Omit<Expense, '_id'>) => Promise<void>;
    updateExpense: (uid: string, month: string, expenseId: string, expense: Partial<Expense>) => Promise<void>;
    deleteExpense: (uid: string, month: string, expenseId: string) => Promise<void>;
    // Suggestion actions
    loadSuggestions: (uid: string, limit?: number) => Promise<void>;
    createSuggestion: (suggestionData: Omit<ProductSuggestion, '_id' | 'suggestedAt'>) => Promise<void>;
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
        console.log('🔍 loadUser called for UID:', uid);
        console.log('🔍 loadUser function is being executed!');
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const user = await userAPI.getUser(uid);
            console.log('📥 User loaded from API:', user._id);
            console.log('📊 User months data:', JSON.stringify(user.months, null, 2));
            dispatch({ type: 'SET_USER', payload: user });

            // Load current month data
            const currentMonth = utils.getCurrentMonth();
            console.log('📅 Current month:', currentMonth);
            const monthData = (user.months && user.months[currentMonth]) || { income: [], expenses: [] };
            console.log('📋 Current month data:', JSON.stringify(monthData, null, 2));
            console.log('💰 Income array length:', monthData.income?.length);
            console.log('💸 Expenses array length:', monthData.expenses?.length);

            dispatch({ type: 'SET_INCOMES', payload: monthData.income || [] });
            dispatch({ type: 'SET_EXPENSES', payload: monthData.expenses || [] });
            dispatch({ type: 'SET_EMIS', payload: (monthData.expenses || []).filter((exp: Expense) => exp.type === 'emi') });
            console.log('✅ User data loaded successfully');
        } catch (error: unknown) {
            console.error('❌ Error loading user:', error);
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const createUser = useCallback(async (userData: Partial<User>) => {
        console.log('createUser called with data:', userData);
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const user = await userAPI.createUser(userData);
            console.log('User created successfully:', user._id);
            dispatch({ type: 'SET_USER', payload: user });
        } catch (error: unknown) {
            console.error('Error creating user:', error);
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
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
            const incomeData = await incomeAPI.getIncome(uid, monthKey);
            dispatch({ type: 'SET_INCOMES', payload: incomeData.income || [] });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    }, [state.currentMonth]);

    const addIncome = useCallback(async (uid: string, month: string, incomeEntry: any) => {
        console.log('➕ addIncome called with:', { uid, month, incomeEntry });
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const response = await incomeAPI.addIncome(uid, month, incomeEntry);
            console.log('📤 API response:', JSON.stringify(response, null, 2));

            // Use the returned user data to update state
            if (response && response.user) {
                console.log('👤 Updated user data:', JSON.stringify(response.user.months, null, 2));
                dispatch({ type: 'SET_USER', payload: response.user });

                // Update the global incomes state for the current month
                const currentMonth = utils.getCurrentMonth();
                const monthData = (response.user.months && response.user.months[currentMonth]) || { income: [], expenses: [] };
                console.log('📋 Updated month data:', JSON.stringify(monthData, null, 2));
                dispatch({ type: 'SET_INCOMES', payload: monthData.income || [] });
                console.log('✅ Income state updated with', monthData.income?.length, 'entries');
            }
        } catch (error: any) {
            console.error('❌ Error adding income:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const updateIncome = useCallback(async (uid: string, month: string, incomeId: string, incomeEntry: any) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const response = await incomeAPI.updateIncome(uid, month, incomeId, incomeEntry);

            // Use the returned user data to update state
            if (response && response.user) {
                dispatch({ type: 'SET_USER', payload: response.user });

                // Update the global incomes state for the current month
                const currentMonth = utils.getCurrentMonth();
                const monthData = (response.user.months && response.user.months[currentMonth]) || { income: [], expenses: [] };
                dispatch({ type: 'SET_INCOMES', payload: monthData.income || [] });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const deleteIncome = useCallback(async (uid: string, month: string, incomeId: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const response = await incomeAPI.deleteIncome(uid, month, incomeId);

            // Use the returned user data to update state
            if (response && response.user) {
                dispatch({ type: 'SET_USER', payload: response.user });

                // Update the global incomes state for the current month
                const currentMonth = utils.getCurrentMonth();
                const monthData = (response.user.months && response.user.months[currentMonth]) || { income: [], expenses: [] };
                dispatch({ type: 'SET_INCOMES', payload: monthData.income || [] });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

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
            const response = await expensesAPI.addExpense(uid, month, expense);

            // Use the returned user data to update state
            if (response && response.user) {
                dispatch({ type: 'SET_USER', payload: response.user });

                // Update the global expenses state for the current month
                const currentMonth = utils.getCurrentMonth();
                const monthData = (response.user.months && response.user.months[currentMonth]) || { income: [], expenses: [] };
                dispatch({ type: 'SET_EXPENSES', payload: monthData.expenses || [] });
                dispatch({ type: 'SET_EMIS', payload: (monthData.expenses || []).filter((exp: any) => exp.type === 'emi') });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const updateExpense = useCallback(async (uid: string, month: string, expenseId: string, expense: any) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const response = await expensesAPI.updateExpense(uid, month, expenseId, expense);

            // Use the returned user data to update state
            if (response && response.user) {
                dispatch({ type: 'SET_USER', payload: response.user });

                // Update the global expenses state for the current month
                const currentMonth = utils.getCurrentMonth();
                const monthData = (response.user.months && response.user.months[currentMonth]) || { income: [], expenses: [] };
                dispatch({ type: 'SET_EXPENSES', payload: monthData.expenses || [] });
                dispatch({ type: 'SET_EMIS', payload: (monthData.expenses || []).filter((exp: any) => exp.type === 'emi') });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const deleteExpense = useCallback(async (uid: string, month: string, expenseId: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const response = await expensesAPI.deleteExpense(uid, month, expenseId);

            // Use the returned user data to update state
            if (response && response.user) {
                dispatch({ type: 'SET_USER', payload: response.user });

                // Update the global expenses state for the current month
                const currentMonth = utils.getCurrentMonth();
                const monthData = (response.user.months && response.user.months[currentMonth]) || { income: [], expenses: [] };
                dispatch({ type: 'SET_EXPENSES', payload: monthData.expenses || [] });
                dispatch({ type: 'SET_EMIS', payload: (monthData.expenses || []).filter((exp: any) => exp.type === 'emi') });
            }
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

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
        deleteIncome,
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