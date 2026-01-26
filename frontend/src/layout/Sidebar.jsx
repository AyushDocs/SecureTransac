import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Role Definitions:
// - user: Standard individual participant with a reputation identity.
// - viewer: Read-only access for auditing or public transparency.
// - company: Trusted institutional entity (Business/Enterprise).
// - admin: Platform administrator (Governance & Operations).
// - deployer: System Developer managing smart contract integrations.

// Role-based navigation permissions
// Define which roles can access each route
const NAV_PERMISSIONS = {
  "/": ["user", "viewer", "company", "creator", "admin", "deployer"], // Dashboard - all
  "/dashboard": ["user", "viewer", "company", "creator", "admin", "deployer"],
  "/search": ["company", "creator", "admin", "deployer"], // Not for regular users
  "/registry": ["company", "creator", "admin", "deployer"], // Not for regular users
  "/identity": ["user", "viewer", "creator"], // All users except admin/deployer
  "/certified": ["user", "viewer", "creator"],
  "/kyb": ["company", "creator"], // Corporate only
  "/reports": ["user", "viewer", "company", "creator", "admin", "deployer"], // All can report
  "/submit-report": ["user", "viewer", "company", "creator", "admin", "deployer"],
  "/appeals": ["user", "viewer","creator"], // All can appeal
  "/privacy": ["user", "viewer", "creator"], // All users
  "/analytics": ["admin", "deployer"], // Admin only
  "/ecosystem": ["creator", "admin", "deployer"], // Partners only
  "/bridge": ["user","viewer"], // Admin only
  "/war-room": ["admin", "deployer"], // Admin only
  "/system": ["admin"], // Admin only
  "/dao": ["user", "viewer", "company", "creator", "admin", "deployer"], // All can participate
  "/verification-requests": ["company", "creator", "admin", "deployer"], // Verifiers only
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
    { path: "/verification-requests", label: "Verification Requests", icon: "clipboard", section: "main" },
    { path: "/identity", label: "Identity Vault", icon: "shield", section: "user" },
    { path: "/certified", label: "Get Certified", icon: "activity", section: "user" },
    { path: "/kyb", label: "Business Verification (KYB)", icon: "briefcase", section: "business" },
    { path: "/submit-report", label: "File Report", icon: "alert", section: "user" },
    { path: "/reports", label: "My Reports", icon: "file", section: "user" },
    { path: "/appeals", label: "Appeals", icon: "radar", section: "user" },
    { path: "/privacy", label: "Privacy", icon: "lock", section: "user" },
    { path: "/analytics", label: "Analytics", icon: "chart", section: "admin" },
    { path: "/ecosystem", label: "Ecosystem", icon: "globe", section: "business" },
    { path: "/bridge", label: "Bridge", icon: "bridge", section: "admin" },
    { path: "/war-room", label: "War Room", icon: "radar", section: "admin" },
    { path: "/system", label: "System Controls", icon: "settings", section: "admin" },
    { path: "/dao", label: "Governance", icon: "dao", section: "main" },
  ];

  // Filter navigation items strictly based on current ACTIVE role
  const filteredNavItems = navItems.filter(item => {
    const allowedRoles = NAV_PERMISSIONS[item.path] || [];
    return allowedRoles.includes(currentRole);
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12m-2 0a2 2 0 104 0a2 2 0 10-4 0" />
          </svg>
        );
      case "settings":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "alert":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "clipboard":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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

      <nav className="flex-1 p-4 overflow-y-auto no-scrollbar">
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
