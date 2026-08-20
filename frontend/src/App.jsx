import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardSelector from "./components/DashboardSelector";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MobileNav from "./layout/MobileNav";
import Navbar from "./layout/Navbar";
import Sidebar from "./layout/Sidebar";
import AddressProfile from "./pages/AddressProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import Appeals from "./pages/Appeals";
import BridgePortal from "./pages/BridgePortal";
import CompanyDashboard from "./pages/CompanyDashboard";
import ContractDetails from "./pages/ContractDetails";
import Dashboard from "./pages/Dashboard";
import DeployerDashboard from "./pages/DeployerDashboard";
import IdentityVault from "./pages/IdentityVault";
import InstitutionalPortal from "./pages/InstitutionalPortal";
import Login from "./pages/Login";
import PartnerEcosystem from "./pages/PartnerEcosystem";
import PrivacyPortal from "./pages/PrivacyPortal";
import Register from "./pages/Register";
import Registry from "./pages/Registry";
import Reports from "./pages/Reports";
import ReputationActivity from "./pages/ReputationActivity";
import RiskWarRoom from "./pages/RiskWarRoom";
import Search from "./pages/Search";
import SubmitReport from "./pages/SubmitReport";
import SystemControl from "./pages/SystemControl";
import TrustDAO from "./pages/TrustDAO";
import UserDashboard from "./pages/UserDashboard";
import VerificationRequests from "./pages/VerificationRequests";
// Component to redirect to the correct dashboard based on active role
// (The DashboardSelector modal is rendered once by AppContent — not here.)
const DashboardSwitch = () => {
  const { role, activeRole } = useAuth();
  
  const currentRole = activeRole || role;
  if (!currentRole) return <Navigate to="/" />;
  
  // Render dashboard based on active role
  const normalizedRole = (currentRole || "").toLowerCase();
  
  switch (normalizedRole) {
    case "user":
      return <UserDashboard />;
    case "viewer":
      return <Dashboard />;
    case "company":
    case "creator":  // Legacy fallback
      return <CompanyDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "deployer":
      return <DeployerDashboard />;
    default:
      console.warn(`[DashboardSwitch] Unrecognized role: ${normalizedRole}, falling back to UserDashboard`);
      return <UserDashboard />;
  }
};

// Basic protected route - requires any authenticated role
const ProtectedRoute = ({ children }) => {
  const { role } = useAuth();
  if (!role) return <Navigate to="/" />;
  return children;
};

// Role-specific protected route - requires specific role(s)
const RoleRoute = ({ children, allowedRoles }) => {
  const { role, roles, hasAnyRole } = useAuth();
  
  if (!role) return <Navigate to="/" />;
  
  // Check if user has any of the allowed roles
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 text-sm">
            You need one of these roles: {allowedRoles.join(', ')}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Your roles: {roles.join(', ')}
          </p>
        </div>
      </div>
    );
  }
  
  return children;
};

// Define route permissions
const routePermissions = {
  "/identity": ["user", "viewer", "admin", "deployer"], // All users
  "/certified": ["user", "viewer", "company", "admin", "deployer"], // All users
  "/kyb": ["company", "admin", "deployer"], // Corporate only
  "/analytics": ["admin"],
  "/bridge": ["admin"],
  "/war-room": ["admin"],
  // Add other routes and their required roles here
};

import PublicFooter from "./layout/PublicFooter";
import PublicNavbar from "./layout/PublicNavbar";
import About from "./pages/About";
import Connect from "./pages/Connect";
import Documentation from "./pages/Documentation";
import Home from "./pages/Home";

function AppContent() {
  const { role, showDashboardSelector, setShowDashboardSelector, isMultiRole, networkWarning, isCorrectNetwork } = useAuth();


// ...

  return (
    <HashRouter>
      <ScrollToTop />
      {/* Network Warning Banner */}
      {networkWarning && (
        <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
          isCorrectNetwork
            ? 'bg-yellow-900/80 text-yellow-200'
            : 'bg-red-900/80 text-red-200'
        }`}>
          {networkWarning}
        </div>
      )}
      {/* Dashboard Selector Modal - Valid for both if needed, but mostly for auth users */}
      {showDashboardSelector && isMultiRole && (
        <DashboardSelector 
          onClose={() => setShowDashboardSelector(false)}
        />
      )}
      
      {role ? (
        <div className={`flex h-screen bg-gray-950 font-sans text-gray-400 overflow-hidden ${networkWarning ? 'pt-10' : ''}`}>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full min-w-0">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-950 pb-24 lg:pb-6 scroll-smooth no-scrollbar">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                {/* Redirect login to dashboard if already logged in */}
                <Route path="/login" element={<Navigate to="/dashboard" />} />
                
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<DashboardSwitch />} />
                <Route path="/select-dashboard" element={
                  <DashboardSelector onClose={() => window.history.back()} />
                } />
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/address/:address" element={<ProtectedRoute><AddressProfile /></ProtectedRoute>} />
                <Route path="/registry" element={<ProtectedRoute><Registry /></ProtectedRoute>} />
                <Route path="/identity" element={
                  <RoleRoute allowedRoles={routePermissions["/identity"]}>
                    <IdentityVault />
                  </RoleRoute>
                } />
                <Route path="/certified" element={
                  <RoleRoute allowedRoles={routePermissions["/certified"]}>
                    <ReputationActivity />
                  </RoleRoute>
                } />
                <Route path="/kyb" element={
                  <RoleRoute allowedRoles={routePermissions["/kyb"]}>
                    <InstitutionalPortal />
                  </RoleRoute>
                } />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/submit-report" element={<ProtectedRoute><SubmitReport /></ProtectedRoute>} />
                <Route path="/appeals" element={<ProtectedRoute><Appeals /></ProtectedRoute>} />
                <Route path="/privacy" element={<ProtectedRoute><PrivacyPortal /></ProtectedRoute>} />
                <Route path="/analytics" element={
                  <RoleRoute allowedRoles={routePermissions["/analytics"]}>
                    <AdvancedAnalytics />
                  </RoleRoute>
                } />
                <Route path="/ecosystem" element={<ProtectedRoute><PartnerEcosystem /></ProtectedRoute>} />
                <Route path="/bridge" element={
                  <RoleRoute allowedRoles={['admin', 'deployer']}>
                    <BridgePortal />
                  </RoleRoute>
                } />
                <Route path="/war-room" element={
                  <RoleRoute allowedRoles={['admin', 'deployer']}>
                    <RiskWarRoom />
                  </RoleRoute>
                } />
                <Route path="/system" element={
                  <RoleRoute allowedRoles={['admin', 'deployer']}>
                     <SystemControl />
                  </RoleRoute>
                } />
                <Route path="/dao" element={<ProtectedRoute><TrustDAO /></ProtectedRoute>} />
                <Route path="/verification-requests" element={
                  <RoleRoute allowedRoles={['company', 'admin', 'deployer']}>
                    <VerificationRequests />
                  </RoleRoute>
                } />
                <Route path="/admin/contract/:name/:address" element={
                    <RoleRoute allowedRoles={['admin', 'deployer']}>
                        <ContractDetails />
                    </RoleRoute>
                } />
                {/* Fallback for auth users */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
            <MobileNav />
          </div>
        </div>
      ) : (
        /* PUBLIC LAYOUT */
        <div className="min-h-screen bg-gray-950 font-sans text-gray-400 flex flex-col">
          <PublicNavbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Fallback for public users */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <PublicFooter />
        </div>
      )}
    </HashRouter>
  );
}

import { SocketProvider } from "./context/SocketContext";
import { PWABadge } from "./hooks/usePWA";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
        <PWABadge />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
