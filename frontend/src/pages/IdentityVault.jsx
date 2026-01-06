import PageWrapper from "../layout/PageWrapper";
import AuthorityList from "../identity/AuthorityList";
import DecryptionQueue from "../identity/DecryptionQueue";
import RevealViewer from "../identity/RevealViewer";

// Identity vault page for managing authorities and decryption
function IdentityVault() {
  const authorities = [
    { id: "1", name: "John Admin", email: "john@securetransac.io", level: "admin" },
    { id: "2", name: "Sarah Security", email: "sarah@securetransac.io", level: "security" },
    { id: "3", name: "Mike Compliance", email: "mike@securetransac.io", level: "compliance" },
    { id: "4", name: "Lisa Analyst", email: "lisa@securetransac.io", level: "analyst" },
  ];

  const decryptionRequests = [
    {
      id: "1",
      requester: "Compliance Team",
      reason: "AML investigation case #4521",
      targetAddress: "0x742d...e322",
      status: "pending",
      timestamp: "10 min ago",
    },
    {
      id: "2",
      requester: "Legal Department",
      reason: "Subpoena response",
      targetAddress: "0x8Ba1...BA72",
      status: "pending",
      timestamp: "2 hours ago",
    },
    {
      id: "3",
      requester: "Security Team",
      reason: "Fraud investigation",
      targetAddress: "0xdAC1...1ec7",
      status: "approved",
      timestamp: "1 day ago",
    },
    {
      id: "4",
      requester: "External Auditor",
      reason: "Quarterly audit review",
      targetAddress: "0xA0b8...eB48",
      status: "denied",
      timestamp: "3 days ago",
    },
  ];

  const sensitiveData = {
    "Real Name": "John Doe",
    "Email": "j***e@email.com",
    "KYC Status": "Verified",
    "Verification Date": "2024-01-15",
  };

  const handleRevoke = (id) => {
    console.log("Revoke authority:", id);
  };

  const handleApprove = (id) => {
    console.log("Approve request:", id);
  };

  const handleDeny = (id) => {
    console.log("Deny request:", id);
  };

  return (
    <PageWrapper title="Identity Vault">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuthorityList authorities={authorities} onRevoke={handleRevoke} />
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
