'use client';

import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Home() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { state, loadUser, createUser } = useData();
  const { user: dbUser, loading: dbLoading, error } = state;
  const [isInitialized, setIsInitialized] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [pendingSavings, setPendingSavings] = useState<number | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Memoize the initialization function to prevent infinite loops
  const initializeUser = useCallback(async (savings?: number) => {
    if (!authUser) {
      setIsInitialized(true);
      return;
    }

    try {
      setConnectionError(null);
      // Try to load existing user from database
      try {
        await loadUser(authUser.uid);
        setIsNewUser(false);
      } catch (error: any) {
        // Check if this is a "user not found" error (404) vs a connection error
        if (error.message && error.message.includes('User not found')) {
          // This is expected for new users
          setIsNewUser(true);
          if (savings !== undefined) {
            // Create new user with the provided savings amount
            console.log('Creating new user in database with savings:', savings);
            await createUser({
              uid: authUser.uid,
              email: authUser.email || '',
              name: authUser.displayName || 'User',
              photoURL: authUser.photoURL || undefined,
              location: '',
              occupation: '',
              savings: savings
            });
            setIsNewUser(false);
          }
        } else {
          // This is a real connection error
          console.error('Connection error:', error);
          setConnectionError(error.message || 'Failed to connect to database');
        }
      }
    } catch (error: any) {
      console.error('Failed to initialize user:', error);
      setConnectionError(error.message || 'Failed to initialize user');
    } finally {
      setIsInitialized(true);
    }
  }, [authUser, loadUser, createUser]);

  // Initialize user data when Firebase auth user changes
  useEffect(() => {
    if (pendingSavings !== null) {
      initializeUser(pendingSavings);
      setPendingSavings(null);
    } else {
      initializeUser();
    }
  }, [initializeUser, pendingSavings]);

  // Handle new user signup with savings
  const handleNewUserSignup = useCallback((savings: number) => {
    setPendingSavings(savings);
  }, []);

  // Show loading state while authentication is initializing
  if (authLoading || (!authUser && !isInitialized)) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#F70000] mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading Budgetly...</p>
          <p className="text-gray-400 mt-2">Initializing authentication</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!authUser) {
    return <Login onNewUserSignup={handleNewUserSignup} />;
  }

  // Show loading state while database is loading
  if (dbLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#F70000] mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading your data...</p>
          <p className="text-gray-400 mt-2">Setting up your financial dashboard</p>
        </div>
      </div>
    );
  }

  // Show connection error state
  if (connectionError) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-6">{connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#F70000] hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show main app
  return <Layout />;
}
