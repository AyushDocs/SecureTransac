import { useEffect, useState } from "react";
import { deleteAuthorityMetadata, fetchAuthorities, saveAuthorityMetadata, setAuthorityStatus } from "../api/client";
import IdentityCard from "../components/IdentityCard";
import ZKProofSystem from "../components/ZKProofSystem";
import { useAuth } from "../context/AuthContext";
import AuthorityList from "../identity/AuthorityList";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

// Identity vault page with role-based feature visibility
function IdentityVault() {
  const { role, roles, activeRole, isAdmin } = useAuth();
  const currentRole = activeRole || role;
  
  const isRestricted = ["admin", "deployer"].includes(currentRole);

  if (isRestricted) {
      return (
          <PageWrapper title="SecureTransac: Identity Vault">
              <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl text-center">
                  <h3 className="text-xl font-bold text-red-500 mb-2">Access Restricted</h3>
                  <p className="text-gray-400">System Developers and Contract Deployers cannot access personal identity vaults to ensure neutrality.</p>
              </div>
          </PageWrapper>
      );
  }

  // Check role permissions for others
  const isCompany = ["company", "creator"].includes(currentRole);
  const canManageAuthorities = isCompany; // Admins removed from here
  const canViewDecryption = false; 

  const [authorities, setAuthorities] = useState([]);
  const [newAuth, setNewAuth] = useState({ address: "", name: "", email: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthorities = async () => {
      // Only load authorities if user has permission
      if (!canManageAuthorities) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await fetchAuthorities();
        if (Array.isArray(data)) {
          setAuthorities(data);
        } else {
          // Convert object map to array
          const authArray = Object.entries(data).map(([address, details]) => ({
            id: address,
            ...details
          }));
          setAuthorities(authArray);
        }
      } catch (error) {
        logger.error("Failed to load authorities", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthorities();
  }, [canManageAuthorities]);

  const handleRevoke = async (address) => {
    if (!canManageAuthorities) return;
    
    try {
      logger.info(`Revoking authority: ${address}`);
      // 1. Revoke on-chain
      await setAuthorityStatus(address, false);
      // 2. Remove metadata from backend
      await deleteAuthorityMetadata(address);
      
      setAuthorities(prev => prev.filter(a => a.id.toLowerCase() !== address.toLowerCase()));
      logger.info(`Successfully revoked authority: ${address}`);
    } catch (error) {
      logger.error(`Failed to revoke authority: ${address}`, error);
      alert("Failed to revoke: " + error.message);
    }
  };

  const handleAddAuthority = async (e) => {
    e.preventDefault();
    if (!canManageAuthorities) return;
    
    const { address, name, email } = newAuth;
    if (!address || !name || !email) return;
    
    try {
      setIsAdding(true);
      logger.info(`Adding authority: ${address} (${name})`);
      
      // 1. Set status on-chain
      await setAuthorityStatus(address, true);
      // 2. Save metadata in backend
      await saveAuthorityMetadata(address, name, email);
      
      setAuthorities(prev => [...prev, { id: address.toLowerCase(), name, email, level: "security" }]);
      setNewAuth({ address: "", name: "", email: "" });
      logger.info(`Successfully added authority: ${address}`);
    } catch (error) {
      logger.error(`Failed to add authority: ${address}`, error);
      alert("Failed to add: " + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  // Mock decryption requests - only used by admins
  const decryptionRequests = [
    { id: "1", requester: "Compliance Team", reason: "AML investigation case #4521", targetAddress: "0x742d...e322", status: "pending", timestamp: "10 min ago" },
    { id: "2", requester: "Legal Department", reason: "Subpoena response", targetAddress: "0x8Ba1...BA72", status: "pending", timestamp: "2 hours ago" },
    { id: "3", requester: "Security Team", reason: "Fraud investigation", targetAddress: "0xdAC1...1ec7", status: "approved", timestamp: "1 day ago" },
  ];

  const handleApprove = (id) => logger.info("Approve request:", id);
  const handleDeny = (id) => logger.info("Deny request:", id);

  return (
    <PageWrapper title="SecureTransac: Identity Vault">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column - Personal Identity Tools (All Users) */}
        <div className="space-y-6">
          <IdentityCard />
          {/* CreditManager moved to Governance Dashboard */}
        </div>

        {/* Right Column - ZK Proofs & Admin Features */}
        <div className="space-y-6">
          <ZKProofSystem />

          {/* Authority Management - Admin/Company Only */}
          {canManageAuthorities && (
            <>
              <form onSubmit={handleAddAuthority} className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white">Add Trusted Authority</h4>
                  <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">
                    {isAdmin ? "ADMIN" : "COMPANY"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    placeholder="Company Wallet Address (0x...)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    value={newAuth.address}
                    onChange={(e) => setNewAuth({ ...newAuth, address: e.target.value })}
                    disabled={isAdding}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Company Name"
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      value={newAuth.name}
                      onChange={(e) => setNewAuth({ ...newAuth, name: e.target.value })}
                      disabled={isAdding}
                    />
                    <input
                      type="email"
                      placeholder="Contact Email"
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      value={newAuth.email}
                      onChange={(e) => setNewAuth({ ...newAuth, email: e.target.value })}
                      disabled={isAdding}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isAdding || !newAuth.address || !newAuth.name || !newAuth.email}
                  className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase disabled:opacity-50 transition-colors"
                >
                  {isAdding ? "Saving Authority..." : "Authorize Entity"}
                </button>
              </form>
              
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading authorities...</div>
              ) : (
                <AuthorityList authorities={authorities} onRevoke={handleRevoke} />
              )}
            </>
          )}

        </div>
      </div>
    </PageWrapper>
  );
}

export default IdentityVault;
