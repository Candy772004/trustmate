import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, leftIcon, className = '', ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full bg-white border border-slate-200 text-slate-900 rounded-xl 
            focus:ring-2 focus:ring-brand-yellow focus:border-transparent 
            placeholder-slate-400 transition-all duration-200
            ${leftIcon ? 'pl-10' : 'pl-4'} pr-4 py-3.5
            ${error ? 'border-red-500 focus:ring-red-200' : ''}
            disabled:bg-slate-50 disabled:text-slate-500
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
};