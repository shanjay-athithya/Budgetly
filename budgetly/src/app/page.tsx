"use client";
import { useEffect, useState, useRef } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { app } from "./firebase";
import type { User } from "firebase/auth";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import IncomeModal from '../components/IncomeModal';
import IncomeManager from '../components/IncomeManager';
import React from 'react';
import DashboardSummary from '../components/DashboardSummary';

const CATEGORY_OPTIONS: string[] = [
  "Food",
  "Entertainment",
  "Rent",
  "Utilities",
  "Transport",
  "Health",
  "Education",
  "Other"
];

function ProfileSetupModal({ uid, onComplete, googleProfile }: { uid: string, onComplete: () => void, googleProfile?: { name?: string, email?: string, photoURL?: string } }) {
  const [name, setName] = useState(googleProfile?.name || "");
  const [savings, setSavings] = useState("");
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!savings || isNaN(Number(savings))) {
      setError("Current savings is required and must be a number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          name,
          savings: Number(savings),
          location,
          occupation,
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form onSubmit={handleSubmit} className="bg-[#232326] rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--primary)', fontFamily: 'Lexend, sans-serif' }}>Complete Your Profile</h2>
        {googleProfile?.photoURL && (
          <img src={googleProfile.photoURL} alt="Profile" className="mx-auto mb-2 rounded-full w-16 h-16 border-2 border-[var(--primary)]" />
        )}
        <input className="px-4 py-2 rounded bg-[#18181a] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        {googleProfile?.email && (
          <input className="px-4 py-2 rounded bg-[#18181a] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] opacity-60" value={googleProfile.email} disabled />
        )}
        <input className="px-4 py-2 rounded bg-[#18181a] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="Current Savings" type="number" value={savings} onChange={e => setSavings(e.target.value)} required />
        <input className="px-4 py-2 rounded bg-[#18181a] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} />
        <input className="px-4 py-2 rounded bg-[#18181a] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="Occupation (optional)" value={occupation} onChange={e => setOccupation(e.target.value)} />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button type="submit" className="w-full bg-[var(--primary)] hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow mt-2" disabled={loading}>{loading ? "Saving..." : "Save Profile"}</button>
      </form>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const auth = getAuth(app);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const avatarRef = useRef<HTMLButtonElement>(null) as React.RefObject<HTMLButtonElement>;
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [editIncomeIdx, setEditIncomeIdx] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [section, setSection] = useState('dashboard');
  const [addIncomeMonth, setAddIncomeMonth] = useState<string | undefined>(undefined);
  const [addIncomeSource, setAddIncomeSource] = useState<string | undefined>(undefined);
  const [incomeMessage, setIncomeMessage] = useState<string | null>(null);
  const [incomeMessageType, setIncomeMessageType] = useState<'success' | 'error' | null>(null);

  const handleShowAddIncome = (month?: string, source?: string) => {
    setAddIncomeMonth(month);
    setAddIncomeSource(source);
    setShowIncomeModal(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user) {
      // Fetch profile from API
      fetch(`/api/profile?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => setProfileComplete(!!(data.profile && data.profile.name && data.profile.incomes && data.profile.incomes.length)))
        .catch(() => setProfileComplete(false));
    } else {
      setProfileComplete(null);
    }
  }, [user]);

  useEffect(() => {
    if (user && profileComplete) {
      fetch(`/api/profile?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => setProfileData(data.profile));
    }
  }, [user, profileComplete]);

  useEffect(() => {
    if (profileData?.incomes) setIncomes(profileData.incomes);
  }, [profileData]);

  // Debug: log incomes passed to IncomeManager
  useEffect(() => {
    if (section === 'income') {
      console.log('IncomeManager incomes:', incomes);
    }
  }, [incomes, section]);

  const handleAddIncomeNew = async (income: any) => {
    if (!user) return;
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, incomes: [...incomes, income] }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIncomes(updated.profile.incomes);
      setProfileData(updated.profile);
      setIncomeMessage('Income added successfully!');
      setIncomeMessageType('success');
    } else {
      setIncomeMessage('Failed to add income.');
      setIncomeMessageType('error');
    }
  };

  const handleEditIncome = (idx: number) => setEditIncomeIdx(idx);
  const handleSaveEditIncome = async (income: any) => {
    if (editIncomeIdx === null || !user) return;
    const updatedIncomes = incomes.map((inc, i) => i === editIncomeIdx ? { ...inc, ...income } : inc);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, incomes: updatedIncomes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIncomes(updated.profile.incomes);
      setProfileData(updated.profile);
      setIncomeMessage('Income updated successfully!');
      setIncomeMessageType('success');
    } else {
      setIncomeMessage('Failed to update income.');
      setIncomeMessageType('error');
    }
    setEditIncomeIdx(null);
  };

  const handleDeleteIncome = async (idx: number) => {
    if (!user) return;
    if (!window.confirm('Delete this income entry?')) return;
    const updatedIncomes = incomes.filter((_, i) => i !== idx);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, incomes: updatedIncomes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIncomes(updated.profile.incomes);
      setProfileData(updated.profile);
      setIncomeMessage('Income deleted successfully!');
      setIncomeMessageType('success');
    } else {
      setIncomeMessage('Failed to delete income.');
      setIncomeMessageType('error');
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setError(error.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setError(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      setError("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  // Calculate last 6 months
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return d.toISOString().slice(0, 7);
  });
  const incomeByMonth = months.map(month =>
    incomes.filter(i => i.date === month).reduce((sum, i) => sum + i.amount, 0)
  );
  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Total Income',
        data: incomeByMonth,
        backgroundColor: 'rgba(247, 0, 0, 0.7)',
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Income Trends (Last 6 Months)', color: '#ededed', font: { size: 18 } },
    },
    scales: {
      x: { ticks: { color: '#ededed' }, grid: { color: '#333' } },
      y: { ticks: { color: '#ededed' }, grid: { color: '#333' } },
    },
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1C1C1E] text-[#F70000] font-sans">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F70000]"></div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1C1C1E] text-[#F70000] font-sans">
        <div className="bg-[#2A2A2C] rounded-2xl shadow-2xl p-10 flex flex-col items-center w-full max-w-sm">
          <h1 className="text-3xl font-bold mb-8" style={{ color: "#F70000", fontFamily: "Lexend, sans-serif" }}>Budgetly</h1>
          <button
            onClick={handleGoogleLogin}
            className="w-full mb-6 flex items-center justify-center gap-2 bg-[#F70000] hover:bg-[#c00000] text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.6 0 5 .8 7 2.2l6.4-6.4C33.5 5.5 28.1 3 22 3 11.5 3 3 11.5 3 22s8.5 19 19 19c9.5 0 18-7.5 18-19 0-1.3-.1-2.7-.5-4z" /><path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 17.1 18.3 15 22 15c2.6 0 5 .8 7 2.2l6.4-6.4C33.5 5.5 28.1 3 22 3 14.2 3 7.4 7.8 6.3 14.7z" /><path fill="#FBBC05" d="M24 44c6.1 0 11.2-2 14.9-5.4l-7-5.7C29.7 34.5 27 35.5 24 35.5c-6.1 0-11.3-4.1-13.2-9.7l-7.1 5.5C7.4 40.2 14.2 44 24 44z" /><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.1 3.1-4.1 5.5-7.7 5.5-4.6 0-8.3-3.7-8.3-8.3s3.7-8.3 8.3-8.3c2.6 0 5 .8 7 2.2l6.4-6.4C33.5 5.5 28.1 3 22 3 11.5 3 3 11.5 3 22s8.5 19 19 19c9.5 0 18-7.5 18-19 0-1.3-.1-2.7-.5-4z" /></g></svg>
            Continue with Google
          </button>
          <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-4 mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-[#1A1A1C] text-white border border-[#444] focus:outline-none focus:ring-2 focus:ring-[#F70000]"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-[#1A1A1C] text-white border border-[#444] focus:outline-none focus:ring-2 focus:ring-[#F70000]"
            />
            {error && <div className="text-[#F70000] text-sm text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-[#F70000] hover:bg-[#c00000] text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow mt-2"
            >
              {authMode === "login" ? "Sign In" : "Sign Up"}
            </button>
          </form>
          <div className="text-sm text-white">
            {authMode === "login" ? (
              <span>Don't have an account? <button className="text-[#F70000] hover:underline" onClick={() => setAuthMode("signup")}>Sign up</button></span>
            ) : (
              <span>Already have an account? <button className="text-[#F70000] hover:underline" onClick={() => setAuthMode("login")}>Sign in</button></span>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (user && profileComplete === false) {
    return <ProfileSetupModal uid={user.uid} onComplete={() => setProfileComplete(true)} googleProfile={{ name: user.displayName || undefined, email: user.email || undefined, photoURL: user.photoURL || undefined }} />;
  }

  if (user && profileComplete) {
    return (
      <>
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => setShowProfileModal(true)}
          user={user}
          avatarRef={avatarRef}
        />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={setSection} />
        <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} profile={{ ...profileData, email: user.email, photoURL: user.photoURL }} />
        <main className="flex min-h-screen flex-col items-center justify-start bg-[var(--background)] text-[var(--foreground)] font-sans pt-8">
          {section === 'income' && (
            <IncomeManager incomes={incomes} onAdd={handleAddIncomeNew} />
          )}
        </main>
        <IncomeModal
          open={showIncomeModal}
          onClose={() => setShowIncomeModal(false)}
          onSave={handleAddIncomeNew}
          initial={{ date: addIncomeMonth, source: addIncomeSource }}
        />
        <IncomeModal open={editIncomeIdx !== null} onClose={() => setEditIncomeIdx(null)} onSave={handleSaveEditIncome} initial={editIncomeIdx !== null ? incomes[editIncomeIdx] : undefined} />
      </>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#1C1C1E] text-[#F70000] font-sans">
      <div className="bg-[#2A2A2C] rounded-2xl shadow-lg p-10 flex flex-col items-center w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "#F70000", fontFamily: "Lexend, sans-serif" }}>Budgetly</h1>
        <div className="flex flex-col items-center gap-4">
          <img src={user.photoURL || ""} alt="User avatar" className="rounded-full w-20 h-20 border-4 border-[#F70000] shadow-lg shadow-[#F70000]/30" />
          <p className="text-lg font-medium text-white text-center">Welcome, {user.displayName || user.email}</p>
          <button
            onClick={handleLogout}
            className="mt-4 bg-[#F70000] hover:bg-[#c00000] text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
