/**
 * Dashboard Selector Component
 * Allows users with multiple roles to switch between dashboards without reconnecting
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_INFO = {
  admin: {
    title: 'Admin Dashboard',
    description: 'Full system administration and oversight',
    icon: '🛡️',
    color: 'from-red-500 to-orange-500',
    path: '/dashboard'
  },
  deployer: {
    title: 'Deployer Dashboard',
    description: 'Smart contract deployment and management',
    icon: '🚀',
    color: 'from-purple-500 to-indigo-500',
    path: '/dashboard'
  },

  company: {
    title: 'Trusted Company Dashboard',
    description: 'Business verification and KYB services',
    icon: '🏢',
    color: 'from-blue-500 to-cyan-500',
    path: '/dashboard'
  },

  viewer: {
    title: 'Public Viewer',
    description: 'Read-only access for auditing and transparency',
    icon: '👁️',
    color: 'from-gray-500 to-slate-500',
    path: '/dashboard'
  },
  user: {
    title: 'User Dashboard',
    description: 'Personal trust score and identity management',
    icon: '👤',
    color: 'from-green-500 to-emerald-500',
    path: '/dashboard'
  }
};

export default function DashboardSelector({ onSelect, onClose }) {
  const navigate = useNavigate();
  const { roles, activeRole, switchRole, setShowDashboardSelector } = useAuth();

  const handleSelectRole = async (role) => {
    try {
      await switchRole(role);
      const roleInfo = ROLE_INFO[role] || ROLE_INFO.user;
      
      if (onSelect) {
        onSelect(role);
      }
      
      if (onClose) {
        onClose();
      }
      
      setShowDashboardSelector(false);
      navigate(roleInfo.path);
    } catch (error) {
      console.error('Failed to switch role:', error);
      alert(error.message);
    }
  };

  if (!roles || roles.length <= 1) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">Select Dashboard</h2>
          <p className="text-gray-400 text-sm">
            You have access to multiple dashboards. Choose one to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => {
            const info = ROLE_INFO[role] || ROLE_INFO.user;
            const isActive = role === activeRole;

            return (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                className={`
                  relative p-6 rounded-xl border-2 text-left transition-all duration-200
                  ${isActive 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] bg-cyan-500 text-white px-2 py-0.5 rounded-full font-bold">
                      CURRENT
                    </span>
                  </div>
                )}

                <div className={`
                  w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} 
                  flex items-center justify-center text-2xl mb-4 shadow-lg
                `}>
                  {info.icon}
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  {info.title}
                </h3>
                <p className="text-xs text-gray-400">
                  {info.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500 mb-4">
            You can switch dashboards anytime from the user menu
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Continue with current dashboard →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact role switcher for navbar/sidebar
 */
export function RoleSwitcher() {
  const { roles, activeRole, switchRole } = useAuth();
  const navigate = useNavigate();

  const isAdmin = roles && (roles.includes('admin') || roles.includes('deployer'));
  
  // For admins, ensure all roles are available for switching/demo
  let displayRoles = roles ? [...roles] : [];
  if (isAdmin) {
    if (!displayRoles.includes('company')) displayRoles.push('company');
    if (!displayRoles.includes('user')) displayRoles.push('user');
    if (!displayRoles.includes('viewer')) displayRoles.push('viewer');
  }

  if (!displayRoles || displayRoles.length <= 1) {
    return null;
  }

  const handleSwitch = async (newRole) => {
    try {
      await switchRole(newRole);
      const roleInfo = ROLE_INFO[newRole] || ROLE_INFO.user;
      navigate(roleInfo.path);
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-800 rounded-lg">
      {displayRoles.map((role) => {
        const info = ROLE_INFO[role] || ROLE_INFO.user;
        const isActive = role === activeRole;

        return (
          <button
            key={role}
            onClick={() => handleSwitch(role)}
            title={info.title}
            className={`
              p-2 rounded-lg transition-all text-sm
              ${isActive 
                ? 'bg-cyan-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }
            `}
          >
            {info.icon}
          </button>
        );
      })}
    </div>
  );
}
