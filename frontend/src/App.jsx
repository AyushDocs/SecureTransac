import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./layout/Navbar";
import Sidebar from "./layout/Sidebar";
import AddressProfile from "./pages/AddressProfile";
import AdminDashboard from "./pages/AdminDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import DeployerDashboard from "./pages/DeployerDashboard";
import IdentityVault from "./pages/IdentityVault";
import Register from "./pages/Register";
import Registry from "./pages/Registry";
import Reports from "./pages/Reports";
import RoleSelection from "./pages/RoleSelection";
import Search from "./pages/Search";
import UserDashboard from "./pages/UserDashboard";

// Component to redirect to the correct dashboard based on role
const DashboardSwitch = () => {
  const { role } = useAuth();
  
  if (!role) return <Navigate to="/" />;
  
  switch (role) {
    case "user": return <UserDashboard />;
    case "company": return <CompanyDashboard />;
    case "admin": return <AdminDashboard />;
    case "deployer": return <DeployerDashboard />;
    default: return <Navigate to="/" />;
  }
};

const ProtectedRoute = ({ children }) => {
  const { role } = useAuth();
  if (!role) return <Navigate to="/" />;
  return children;
};

function AppContent() {
  const { role } = useAuth();

  return (
    <HashRouter>
      {/* MANDATORY LAYOUT START */}
      <div className="flex min-h-screen bg-gray-950 font-sans text-gray-400">
        {role && <Sidebar />}
        <div className="flex-1 flex flex-col">
          {role && <Navbar />}
          <main className="flex-1 p-6 bg-gray-950">
            <Routes>
              <Route path="/" element={role ? <Navigate to="/dashboard" /> : <RoleSelection />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<DashboardSwitch />} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/address/:address" element={<ProtectedRoute><AddressProfile /></ProtectedRoute>} />
              <Route path="/registry" element={<ProtectedRoute><Registry /></ProtectedRoute>} />
              <Route path="/identity" element={<ProtectedRoute><IdentityVault /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </div>
      {/* MANDATORY LAYOUT END */}
    </HashRouter>
  );
}

import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
