import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./layout/Navbar";
import Sidebar from "./layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import AddressProfile from "./pages/AddressProfile";
import Registry from "./pages/Registry";
import IdentityVault from "./pages/IdentityVault";
import Reports from "./pages/Reports";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* MANDATORY LAYOUT START */}
        <div className="flex min-h-screen bg-gray-950 font-sans text-gray-400">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 p-6 bg-gray-950">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/search" element={<Search />} />
                <Route path="/address/:address" element={<AddressProfile />} />
                <Route path="/registry" element={<Registry />} />
                <Route path="/identity" element={<IdentityVault />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </main>
          </div>
        </div>
        {/* MANDATORY LAYOUT END */}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
