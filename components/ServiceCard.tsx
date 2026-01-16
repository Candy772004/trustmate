import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ label, icon: Icon, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-brand-yellow/50 transition-all duration-200 group active:scale-95 aspect-square w-full"
    >
      <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-dark flex items-center justify-center mb-2 group-hover:bg-brand-yellow group-hover:text-brand-dark transition-colors duration-200 shrink-0">
        <Icon size={24} strokeWidth={2} />
      </div>
      {/* Fixed height container with top alignment for consistent icon-to-text spacing */}
      <div className="h-10 w-full flex items-start justify-center">
        <span className="text-sm font-medium text-slate-700 text-center leading-tight group-hover:text-brand-dark line-clamp-2">
          {label}
        </span>
      </div>
    </button>
  );
};