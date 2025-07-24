import React from 'react';

export default function Header({ onMenuClick, onProfileClick, user, avatarRef }: {
    onMenuClick: () => void,
    onProfileClick: () => void,
    user: any,
    avatarRef: React.RefObject<HTMLButtonElement>
}) {
    return (
        <header className="w-full flex justify-between items-center p-4 bg-[#232326]">
            <button onClick={onMenuClick} className="text-2xl text-gray-200 mr-2" title="Open menu">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button ref={avatarRef} onClick={onProfileClick} className="flex items-center gap-2 focus:outline-none ml-auto">
                <img src={user.photoURL || "/favicon.ico"} alt="avatar" className="rounded-full w-10 h-10 border-2 border-[var(--primary)]" />
                <span className="text-gray-200 font-medium hidden sm:inline">{user.displayName || user.email}</span>
            </button>
        </header>
    );
} 