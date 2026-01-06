import { useEffect, useState } from "react";
import { deleteAuthorityMetadata, fetchAuthorities, saveAuthorityMetadata, setAuthorityStatus } from "../api/client";
import AuthorityList from "../identity/AuthorityList";
import DecryptionQueue from "../identity/DecryptionQueue";
import RevealViewer from "../identity/RevealViewer";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

// Identity vault page for managing authorities and decryption
function IdentityVault() {
  const [authorities, setAuthorities] = useState([]);
  const [newAuth, setNewAuth] = useState({ address: "", name: "", email: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthorities = async () => {
      try {
        const data = await fetchAuthorities();
        setAuthorities(data);
      } catch (error) {
        logger.error("Failed to load authorities", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthorities();
  }, []);

  const handleRevoke = async (address) => {
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

  const decryptionRequests = [
    { id: "1", requester: "Compliance Team", reason: "AML investigation case #4521", targetAddress: "0x742d...e322", status: "pending", timestamp: "10 min ago" },
    { id: "2", requester: "Legal Department", reason: "Subpoena response", targetAddress: "0x8Ba1...BA72", status: "pending", timestamp: "2 hours ago" },
    { id: "3", requester: "Security Team", reason: "Fraud investigation", targetAddress: "0xdAC1...1ec7", status: "approved", timestamp: "1 day ago" },
  ];

  const sensitiveData = {
    "Real Name": "John Doe",
    "Email": "j***e@email.com",
    "KYC Status": "Verified",
    "Verification Date": "2024-01-15",
  };

  const handleApprove = (id) => logger.info("Approve request:", id);
  const handleDeny = (id) => logger.info("Deny request:", id);

  return (
    <PageWrapper title="Identity Vault">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <form onSubmit={handleAddAuthority} className="mb-6 space-y-4 bg-secondary/50 p-4 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">Add Trusted Authority</h4>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                placeholder="Company Wallet Address (0x...)"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={newAuth.address}
                onChange={(e) => setNewAuth({ ...newAuth, address: e.target.value })}
                disabled={isAdding}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Company Name"
                  className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={newAuth.name}
                  onChange={(e) => setNewAuth({ ...newAuth, name: e.target.value })}
                  disabled={isAdding}
                />
                <input
                  type="email"
                  placeholder="Contact Email"
                  className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={newAuth.email}
                  onChange={(e) => setNewAuth({ ...newAuth, email: e.target.value })}
                  disabled={isAdding}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isAdding || !newAuth.address || !newAuth.name || !newAuth.email}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isAdding ? "Saving Authority..." : "Add Trusted Authority"}
            </button>
          </form>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading authorities...</div>
          ) : (
            <AuthorityList authorities={authorities} onRevoke={handleRevoke} />
          )}
        </div>
        <DecryptionQueue
          requests={decryptionRequests}
          onApprove={handleApprove}
          onDeny={handleDeny}
        />
      </div>
      <div className="mt-6 max-w-md">
        <RevealViewer data={sensitiveData} expiresIn={60} />
      </div>
    </PageWrapper>
  );
}

export default IdentityVault;
