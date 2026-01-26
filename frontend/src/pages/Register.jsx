import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { pinMetadata, registerUser, storeIdentityData } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { encryptSymmetric, getSymmetricKey } from "../utils/encryption";

function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, connectWallet, user, refreshProfile, login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: searchParams.get("role") || "user",
    companyName: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    // If user is already registered, redirect to dashboard
    if (user?.registrationDate) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Encrypt Metadata
      setStatus("Encrypting your data...");
      const encryptionKey = await getSymmetricKey(window.ethereum, address);
      const metadata = {
        name: formData.name,
        email: formData.email,
        companyName: formData.companyName,
        description: formData.description,
        registrationDate: new Date().toISOString()
      };
      const encryptedData = encryptSymmetric(metadata, encryptionKey);

      // Step 2: Pin to IPFS
      setStatus("Pinning to IPFS via Pinata...");
      const ipfsResult = await pinMetadata({ data: encryptedData });
      const cid = ipfsResult.cid;

      // Step 3: Store CID on-chain
      setStatus("Storing Identity CID on-chain...");
      await storeIdentityData(cid);

      // Step 4: Register in Backend
      setStatus("Finalizing registration...");
      await registerUser(address, formData.role, {
        name: formData.name,
        email: formData.email,
        companyName: formData.companyName,
        description: formData.description,
        identityCid: cid 
      });
      
      // Update local state and context
      login(formData.role, address);
      await refreshProfile();
      
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Registration failed. Please try again. " + (error.message || ""));
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Create Profile</h1>
          <p className="text-gray-400">Join the SecureTransac ecosystem</p>
        </div>

        {!address ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-6 text-sm">You need a connected wallet to register an on-chain identity.</p>
            <button
              onClick={connectWallet}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
            >
              Connect MetaMask
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl mb-6">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Authenticated Wallet</p>
              <p className="text-white font-mono text-sm truncate">{address}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="user">Normal User</option>
                  <option value="company">Company</option>
                  <option value="admin">System Admin</option>
                  <option value="deployer">Contract Deployer</option>
                </select>
              </div>

              {formData.role === "company" && (
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Acme Corp"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] mt-4"
            >
              {loading ? status || "Registering..." : "Complete Registration"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Register;
