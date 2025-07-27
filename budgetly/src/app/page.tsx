'use client';

import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Login from '../components/Login';
import WelcomeMessage from '../components/WelcomeMessage';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Home() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { state, loadUser } = useData();
  const { user: dbUser, loading: dbLoading, error } = state;
  const [isInitialized, setIsInitialized] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  console.log('🏠 Home component render - loadUser function:', typeof loadUser);
  console.log('🏠 Home component render - authUser:', authUser?.uid);
  console.log('🏠 Home component render - authLoading:', authLoading);
  console.log('🏠 Home component render - dbLoading:', dbLoading);

  // Memoize the initialization function to prevent infinite loops
  const initializeUser = useCallback(async () => {
    if (!authUser) {
      console.log('🔐 No auth user, setting initialized');
      setIsInitialized(true);
      return;
    }

    console.log('🚀 Initializing user for:', authUser.uid);
    try {
      setConnectionError(null);
      // Try to load existing user from database
      try {
        console.log('📥 Attempting to load user from database...');
        console.log('📥 About to call loadUser with UID:', authUser.uid);
        await loadUser(authUser.uid);
        console.log('✅ User loaded successfully, setting isNewUser to false');
        setIsNewUser(false);
      } catch (error: any) {
        // Check if this is a "user not found" error (404) vs a connection error
        if (error.message && error.message.includes('User not found')) {
          // This is expected for new users
          console.log('👤 User not found, setting isNewUser to true');
          setIsNewUser(true);
        } else {
          // This is a real connection error
          console.error('❌ Connection error:', error);
          setConnectionError(error.message || 'Failed to connect to database');
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize user:', error);
      setConnectionError(error.message || 'Failed to initialize user');
    } finally {
      console.log('🏁 Setting initialized to true');
      setIsInitialized(true);
    }
  }, [authUser, loadUser]);

  // Initialize user data when Firebase auth user changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - authUser:', authUser?.uid, 'loadUser function:', !!loadUser);
    console.log('🔄 useEffect - loadUser function type:', typeof loadUser);
    console.log('🔄 useEffect - loadUser function toString:', loadUser?.toString().substring(0, 50));
    console.log('🔄 useEffect - authLoading:', authLoading);

    // Only run if authentication is not loading and we have an auth user
    if (!authLoading && authUser) {
      console.log('🔄 Authentication ready, initializing user');
      initializeUser();
    } else if (!authLoading && !authUser) {
      console.log('🔄 Authentication ready but no user, setting initialized');
      setIsInitialized(true);
    }
  }, [authUser, authLoading, initializeUser]);

  // Handle new user setup completion
  const handleNewUserComplete = useCallback(() => {
    console.log('handleNewUserComplete called, setting isNewUser to false');
    setIsNewUser(false);
    // Reload user data after creation
    if (authUser) {
      console.log('Reloading user data for:', authUser.uid);
      loadUser(authUser.uid);
    }
  }, [authUser, loadUser]);

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
    return <Login />;
  }

  // Show new user setup if user is new
  if (isNewUser) {
    return <WelcomeMessage onComplete={handleNewUserComplete} />;
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
          <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
          <p className="text-gray-400 mb-4">{connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#F70000] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show main application
  return <Layout />;
}
