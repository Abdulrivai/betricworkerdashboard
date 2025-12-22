import { useState } from 'react';
import Image from 'next/image';

interface HeaderProps {
  onLogout: () => void;
  workerInfo: any;
}

export default function Header({ onLogout, workerInfo }: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-blue-900/10 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
              <Image
                src="/betriclogoblue.png"
                alt="Betric Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-xl font-bold text-blue-900 truncate">Worker Dashboard</h1>
              <p className="text-blue-700/70 text-xs font-medium hidden sm:block">Kelola SPK & Projects</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Worker Info */}
            <div className="text-right hidden md:block">
              <p className="text-blue-900 text-sm font-semibold truncate max-w-[150px] lg:max-w-none">
                {workerInfo?.full_name || 'Worker'}
              </p>
              <p className="text-blue-700/70 text-xs truncate max-w-[150px] lg:max-w-none">
                {workerInfo?.email || 'Loading...'}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="bg-red-500/90 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-1 sm:space-x-2"
            >
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