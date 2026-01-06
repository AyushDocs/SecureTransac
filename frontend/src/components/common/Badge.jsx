// Badge component for status indicators
function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-gray-800 text-gray-200",
    success: "bg-green-500/20 text-green-500",
    warning: "bg-yellow-400/20 text-yellow-400",
    destructive: "bg-red-500/20 text-red-500",
    outline: "border border-gray-800 bg-transparent text-white",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
