import Badge from "../components/common/Badge";
import Button from "../components/common/Button";

// Decryption request queue
function DecryptionQueue({ requests, onApprove, onDeny }) {
  const getStatusVariant = (status) => {
    switch (status) {
      case "pending": return "warning";
      case "approved": return "success";
      case "denied": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Decryption Requests</h3>
        <Badge variant="warning">{requests.filter(r => r.status === "pending").length} Pending</Badge>
      </div>
      <div className="space-y-3">
        {requests.map((request, index) => (
          <div
            key={index}
            className="p-4 bg-gray-800 rounded-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white">{request.requester}</p>
                <p className="text-xs text-gray-400 mt-1">Reason: {request.reason}</p>
              </div>
              <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                <span>Target: </span>
                <span className="font-mono">{request.targetAddress}</span>
              </div>
              {request.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeny && onDeny(request.id)}
                  >
                    Deny
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onApprove && onApprove(request.id)}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">{request.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DecryptionQueue;
