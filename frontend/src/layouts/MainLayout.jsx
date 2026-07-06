import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function MainLayout({ sidebar, navbar, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 text-neutral-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/20 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-neutral-200 bg-white transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Close Button in Sidebar Header */}
        <div className="flex h-14 items-center justify-end px-4 md:hidden border-b border-neutral-100">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 transition-colors focus:outline-hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sidebar}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-3 left-4 z-30 rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-50 shadow-xs md:hidden transition-colors focus:outline-hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-center border-b border-neutral-200 bg-white px-4 md:px-6">
          {navbar}
        </header>

        {/* Chat Content Panel */}
        <main className="flex-1 overflow-hidden bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
