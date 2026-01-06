import { useState } from "react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import { useAuth } from "../../context/AuthContext";

// Admin-only manual override controls
function ManualOverride({ address, currentStatus, onOverride }) {
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState("");

  if (!isAdmin) {
    return null;
  }

  const handleAction = (action) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const confirmAction = () => {
    if (onOverride) {
      onOverride({ action: selectedAction, reason, address });
    }
    setIsModalOpen(false);
    setReason("");
    setSelectedAction(null);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-foreground">Manual Override</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Admin controls for manual address management. Actions are logged and require justification.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => handleAction("whitelist")}
        >
          Add to Whitelist
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleAction("blacklist")}
        >
          Add to Blacklist
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleAction("reset")}
        >
          Reset Score
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Confirm ${selectedAction}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are about to {selectedAction} the address:
          </p>
          <p className="text-sm font-mono text-foreground bg-secondary p-2 rounded truncate">
            {address}
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter justification for this action..."
              className="w-full h-24 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedAction === "blacklist" ? "destructive" : "primary"}
              disabled={!reason.trim()}
              onClick={confirmAction}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManualOverride;
