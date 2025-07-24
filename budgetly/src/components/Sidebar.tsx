import React from 'react';

export default function Sidebar({ open, onClose, onNavigate }: { open: boolean, onClose: () => void, onNavigate: (section: string) => void }) {
    return (
        <div className={`fixed inset-0 z-50 transition-all ${open ? 'visible' : 'invisible pointer-events-none'}`}>
            <div className={`fixed inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
            <aside className={`fixed left-0 top-0 h-full w-64 bg-[#232326] shadow-2xl z-50 transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>Budgetly</span>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">&times;</button>
                </div>
                <nav className="flex flex-col gap-2 p-4">
                    <button onClick={() => { onNavigate('dashboard'); onClose(); }} className="text-left px-2 py-2 rounded hover:bg-[#383838] text-gray-200">Dashboard</button>
                    <button onClick={() => { onNavigate('income'); onClose(); }} className="text-left px-2 py-2 rounded hover:bg-[#383838] text-gray-200">Income</button>
                    <button onClick={() => { onNavigate('expenses'); onClose(); }} className="text-left px-2 py-2 rounded hover:bg-[#383838] text-gray-200">Expenses</button>
                    <button onClick={() => { onNavigate('profile'); onClose(); }} className="text-left px-2 py-2 rounded hover:bg-[#383838] text-gray-200">Profile</button>
                </nav>
            </aside>
        </div>
    );
} 