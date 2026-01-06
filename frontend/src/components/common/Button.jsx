// Reusable button component with variants
function Button({ children, variant = "primary", size = "md", disabled = false, onClick, className = "" }) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300",
    secondary: "bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-600",
    destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    outline: "border border-gray-800 bg-transparent text-white hover:bg-gray-800 focus:ring-gray-500",
    ghost: "bg-transparent text-white hover:bg-gray-800 focus:ring-gray-500",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
