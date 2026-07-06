import React from 'react';

export default function Navbar({ currentMode, onModeChange }) {
  return (
    <div className="flex items-center justify-center w-full max-w-xs">
      <div className="inline-flex rounded-lg bg-neutral-100 p-0.75 w-full">
        <button
          onClick={() => onModeChange('Home')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
            currentMode === 'Home'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => onModeChange('Business')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
            currentMode === 'Business'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Business
        </button>
      </div>
    </div>
  );
}
