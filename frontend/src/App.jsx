import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardSelector from "./components/DashboardSelector";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MobileNav from "./layout/MobileNav";
import Navbar from "./layout/Navbar";
import Sidebar from "./layout/Sidebar";

// Lazy-loaded pages — each becomes its own chunk
const AddressProfile = lazy(() => import("./pages/AddressProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const Appeals = lazy(() => import("./pages/Appeals"));
const BridgePortal = lazy(() => import("./pages/BridgePortal"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const ContractDetails = lazy(() => import("./pages/ContractDetails"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DeployerDashboard = lazy(() => import("./pages/DeployerDashboard"));
const IdentityVault = lazy(() => import("./pages/IdentityVault"));
const InstitutionalPortal = lazy(() => import("./pages/InstitutionalPortal"));
const Login = lazy(() => import("./pages/Login"));
const PartnerEcosystem = lazy(() => import("./pages/PartnerEcosystem"));
const PrivacyPortal = lazy(() => import("./pages/PrivacyPortal"));
const Register = lazy(() => import("./pages/Register"));
const Registry = lazy(() => import("./pages/Registry"));
const Reports = lazy(() => import("./pages/Reports"));
const ReputationActivity = lazy(() => import("./pages/ReputationActivity"));
const RiskWarRoom = lazy(() => import("./pages/RiskWarRoom"));
const Search = lazy(() => import("./pages/Search"));
const SubmitReport = lazy(() => import("./pages/SubmitReport"));
const SystemControl = lazy(() => import("./pages/SystemControl"));
const TrustDAO = lazy(() => import("./pages/TrustDAO"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const VerificationRequests = lazy(() => import("./pages/VerificationRequests"));

// Public pages — also lazy
const PublicFooter = lazy(() => import("./layout/PublicFooter"));
const PublicNavbar = lazy(() => import("./layout/PublicNavbar"));
const About = lazy(() => import("./pages/About"));
const Connect = lazy(() => import("./pages/Connect"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Home = lazy(() => import("./pages/Home"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Loading...</span>
    </div>
  </div>
);

// Component to redirect to the correct dashboard based on active role
const DashboardSwitch = () => {
  const { role, activeRole } = useAuth();
  
  const currentRole = activeRole || role;
  if (!currentRole) return <Navigate to="/" />;
  
  const normalizedRole = (currentRole || "").toLowerCase();
  
  switch (normalizedRole) {
    case "user":
      return <UserDashboard />;
    case "viewer":
      return <Dashboard />;
    case "company":
    case "creator":
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

const ProtectedRoute = ({ children }) => {
  const { role } = useAuth();
  if (!role) return <Navigate to="/" />;
  return children;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { role, roles, hasAnyRole } = useAuth();
  
  if (!role) return <Navigate to="/" />;
  
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

const routePermissions = {
  "/identity": ["user", "viewer", "admin", "deployer"],
  "/certified": ["user", "viewer", "company", "admin", "deployer"],
  "/kyb": ["company", "admin", "deployer"],
  "/analytics": ["admin"],
  "/bridge": ["admin"],
  "/war-room": ["admin"],
};

function AppContent() {
  const { role, showDashboardSelector, setShowDashboardSelector, isMultiRole, networkWarning, isCorrectNetwork } = useAuth();

  return (
    <HashRouter>
      <ScrollToTop />
      {networkWarning && (
        <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
          isCorrectNetwork
            ? 'bg-yellow-900/80 text-yellow-200'
            : 'bg-red-900/80 text-red-200'
        }`}>
          {networkWarning}
        </div>
      )}
      {showDashboardSelector && isMultiRole && (
        <DashboardSelector 
          onClose={() => setShowDashboardSelector(false)}
        />
      )}
      
      <Suspense fallback={<PageLoader />}>
      {role ? (
        <div className={`flex h-screen bg-gray-950 font-sans text-gray-400 overflow-hidden ${networkWarning ? 'pt-10' : ''}`}>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full min-w-0">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-950 pb-24 lg:pb-6 scroll-smooth no-scrollbar">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
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
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
            <MobileNav />
          </div>
        </div>
      ) : (
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
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <PublicFooter />
        </div>
      )}
      </Suspense>
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
