import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Role-based mobile nav permissions
const MOBILE_NAV_PERMISSIONS = {
  "/": ["user", "viewer", "company", "creator", "admin", "deployer"],
  "/search": ["company", "creator", "admin", "deployer"], // Not for regular users
  "/identity": ["user", "viewer", "company", "creator", "admin", "deployer"],
  "/reports": ["user", "viewer", "company", "creator", "admin", "deployer"],
  "/dao": ["user", "viewer", "company", "creator", "admin", "deployer"],
  "/bridge": ["admin", "deployer"], // Admin only
  "/ecosystem": ["company", "creator", "admin", "deployer"],
  "/analytics": ["admin", "deployer"],
  "/kyb": ["company", "creator", "admin", "deployer"],
};

function MobileNav() {
  const { role, roles, activeRole } = useAuth();
  const currentRole = activeRole || role;

  // Define nav items with role-specific alternatives
  const getNavItems = () => {
    const isAdmin = ["admin", "deployer"].includes(currentRole);
    const isCompany = ["company", "creator"].includes(currentRole);
    const isUser = ["user", "viewer"].includes(currentRole);

    // Base items for all users
    const baseItems = [
      { path: "/", label: "Home", icon: "grid" },
      { path: "/identity", label: "Vault", icon: "shield" },
      { path: "/dao", label: "Gov", icon: "dao" },
    ];

    // Add role-specific items
    if (isAdmin) {
      return [
        ...baseItems.slice(0, 1), // Home
        { path: "/analytics", label: "Analytics", icon: "chart" },
        { path: "/bridge", label: "Bridge", icon: "bridge" },
        ...baseItems.slice(1), // Vault, Gov
      ];
    } else if (isCompany) {
      return [
        ...baseItems.slice(0, 1), // Home
        { path: "/search", label: "Search", icon: "search" },
        { path: "/kyb", label: "KYB", icon: "briefcase" },
        ...baseItems.slice(1), // Vault, Gov
      ];
    } else {
      // Regular user - simpler nav
      return [
        ...baseItems.slice(0, 1), // Home
        { path: "/reports", label: "Report", icon: "file" },
        ...baseItems.slice(1), // Vault, Gov
      ];
    }
  };

  const navItems = getNavItems();

  // Filter based on role permissions
  const filteredNavItems = navItems.filter(item => {
    const allowedRoles = MOBILE_NAV_PERMISSIONS[item.path] || [];
    if (allowedRoles.includes(currentRole)) return true;
    if (roles && roles.length > 0) {
      return allowedRoles.some(r => roles.includes(r));
    }
    return false;
  });

  const getIcon = (icon) => {
    switch (icon) {
      case "grid":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case "search":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case "shield":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case "file":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "briefcase":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "dao":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case "bridge":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case "chart":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-2 py-3 z-50 flex items-center justify-around pb-safe">
      {filteredNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-colors ${
              isActive ? "text-cyan-400" : "text-gray-500"
            }`
          }
        >
          {getIcon(item.icon)}
          <span className="text-[10px] font-bold uppercase tracking-tighter">
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileNav;
