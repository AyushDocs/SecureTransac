import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Role-based navigation permissions
// Define which roles can access each route
const NAV_PERMISSIONS = {
  "/": ["user", "viewer", "company", "creator", "admin", "deployer"], // Dashboard - all
  "/dashboard": ["user", "viewer", "company", "creator", "admin", "deployer"],
  "/search": ["company", "creator", "admin", "deployer"], // Not for regular users
  "/registry": ["company", "creator", "admin", "deployer"], // Not for regular users
  "/identity": ["user", "viewer", "company", "creator", "admin", "deployer"], // All users
  "/certified": ["user", "viewer", "company", "creator", "admin", "deployer"],
  "/kyb": ["company", "creator", "admin", "deployer"], // Corporate only
  "/reports": ["user", "viewer", "company", "creator", "admin", "deployer"], // All can report
  "/appeals": ["user", "viewer", "company", "creator", "admin", "deployer"], // All can appeal
  "/privacy": ["user", "viewer", "company", "creator", "admin", "deployer"], // All users
  "/analytics": ["admin", "deployer"], // Admin only
  "/ecosystem": ["company", "creator", "admin", "deployer"], // Partners only
  "/bridge": ["admin", "deployer"], // Admin only
  "/war-room": ["admin", "deployer"], // Admin only
  "/dao": ["user", "viewer", "company", "creator", "admin", "deployer"], // All can participate
};

// Sidebar navigation with route links
function Sidebar() {
  const { user, role, roles, activeRole, hasRole, hasAnyRole } = useAuth();

  // Current effective role
  const currentRole = activeRole || role;

  // All navigation items with metadata
  const navItems = [
    { path: "/", label: "Dashboard", icon: "grid", section: "main" },
    { path: "/search", label: "Search", icon: "search", section: "main" },
    { path: "/registry", label: "Registry", icon: "list", section: "main" },
    { path: "/identity", label: "Identity Vault", icon: "shield", section: "user" },
    { path: "/certified", label: "Get Certified", icon: "activity", section: "user" },
    { path: "/kyb", label: "Corporate KYB", icon: "briefcase", section: "business" },
    { path: "/reports", label: "Reports", icon: "file", section: "user" },
    { path: "/appeals", label: "Appeals", icon: "radar", section: "user" },
    { path: "/privacy", label: "Privacy", icon: "lock", section: "user" },
    { path: "/analytics", label: "Analytics", icon: "chart", section: "admin" },
    { path: "/ecosystem", label: "Ecosystem", icon: "globe", section: "business" },
    { path: "/bridge", label: "Bridge", icon: "bridge", section: "admin" },
    { path: "/war-room", label: "War Room", icon: "radar", section: "admin" },
    { path: "/dao", label: "Governance", icon: "dao", section: "main" },
  ];

  // Filter navigation items based on current role
  const filteredNavItems = navItems.filter(item => {
    const allowedRoles = NAV_PERMISSIONS[item.path] || [];
    
    // Check if current role is allowed
    if (allowedRoles.includes(currentRole)) {
      return true;
    }
    
    // Also check if user has ANY of the allowed roles (for multi-role users)
    if (roles && roles.length > 0) {
      return allowedRoles.some(r => roles.includes(r));
    }
    
    return false;
  });

  // Group items by section for visual organization
  const mainSection = filteredNavItems.filter(i => i.section === "main");
  const userSection = filteredNavItems.filter(i => i.section === "user");
  const businessSection = filteredNavItems.filter(i => i.section === "business");
  const adminSection = filteredNavItems.filter(i => i.section === "admin");

  const getIcon = (icon) => {
    switch (icon) {
      case "grid":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case "search":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case "list":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        );
      case "shield":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case "file":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "briefcase":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "lock":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case "chart":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case "globe":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case "dao":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case "bridge":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case "activity":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "radar":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12m-2 0a2 2 0 104 0a2 2 0 10-4 0" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderSection = (items, title) => {
    if (items.length === 0) return null;
    
    return (
      <>
        {title && (
          <li className="px-3 pt-4 pb-1">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{title}</span>
          </li>
        )}
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-gray-400 hover:bg-gray-900 hover:text-white"
                }`
              }
            >
              {getIcon(item.icon)}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </>
    );
  };

  return (
    <aside className="hidden lg:flex w-64 bg-gray-950 border-r border-gray-800 flex-col shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white">SecureTransac</span>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {renderSection(mainSection, null)}
          {renderSection(userSection, "Personal")}
          {renderSection(businessSection, "Business")}
          {renderSection(adminSection, "Administration")}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
