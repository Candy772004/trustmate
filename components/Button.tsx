import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  isLoading = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "py-3.5 px-6 rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-brand-yellow text-brand-dark hover:bg-yellow-300 shadow-md",
    secondary: "bg-brand-dark text-white hover:bg-slate-800 shadow-md",
    outline: "border-2 border-brand-dark text-brand-dark hover:bg-gray-50",
    ghost: "bg-transparent text-brand-dark hover:bg-gray-100"
  };

  const widthStyle = fullWidth ? "w-full" : "";
  const opacityStyle = props.disabled || isLoading ? "opacity-70 cursor-not-allowed active:scale-100" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${opacityStyle} ${className}`}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : children}
    </button>
  );
};