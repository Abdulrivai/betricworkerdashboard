'use client';

import Image from 'next/image';

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-blue-900/10 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {/* Logo Betric - UKURAN YANG BENAR */}
            <div className="w-40 h-40 flex items-center justify-center">
              <Image
                src="/betriclogoblue.png"  
                alt="Betric Logo"
                width={180}
                height={180}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">Admin Dashboard</h1>
              <p className="text-blue-700/70 text-xs font-medium hidden sm:block">Kelola SPK & Monitor Workers</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Admin Status Info */}
            <div className="hidden sm:flex items-center space-x-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-purple-900 text-sm font-medium">Administrator</span>
            </div>
            
            <div className="text-right hidden sm:block">
              <p className="text-blue-900 text-sm font-semibold">Admin Panel</p>
              <p className="text-blue-700/70 text-xs">Full Access Control</p>
            </div>
            
            <button
              onClick={onLogout}
              className="bg-red-500/90 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              {/* Arrow Icon untuk Logout */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}