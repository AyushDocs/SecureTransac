import { useEffect, useState } from "react";
import { fetchACL, fetchScoreUpdates } from "../api/client";
import { useSocket } from "../context/SocketContext";
import PageWrapper from "../layout/PageWrapper";
import ACLTable from "../registry/ACLTable";
import LiveFeed from "../registry/LiveFeed";
import { logger } from "../utils/logger";

function Registry() {
  const [aclEntries, setAclEntries] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [aclData, updatesData] = await Promise.all([
          fetchACL(),
          fetchScoreUpdates()
        ]);
        
        const classified = aclData
          .filter(e => e.trustScore >= 0.8 || e.trustScore <= 0.2)
          .map(e => {
            let formattedDate = 'N/A';
            if (e.date) {
              try {
                const dateObj = new Date(e.date);
                formattedDate = dateObj.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
              } catch (err) {
                formattedDate = e.date;
              }
            }
            
            return {
              address: e.address,
              type: e.trustScore >= 0.8 ? 'whitelist' : 'blacklist',
              addedBy: e.addedBy || 'System',
              date: formattedDate
            };
          });
        setAclEntries(classified);

        const formatted = updatesData.map(u => {
          const diff = Date.now() - u.timestamp;
          const minutes = Math.floor(diff / 60000);
          let timestamp;
          if (minutes < 1) timestamp = "Just now";
          else if (minutes < 60) timestamp = `${minutes} min ago`;
          else {
            const hours = Math.floor(minutes / 60);
            timestamp = `${hours} hour${hours > 1 ? 's' : ''} ago`;
          }
          return {
            address: `${u.address.slice(0, 6)}...${u.address.slice(-4)}`,
            oldScore: u.oldScore,
            newScore: u.newScore,
            timestamp
          };
        });
        setLiveUpdates(formatted);

      } catch (error) {
        logger.error("Failed to load Registry data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const { lastEvent } = useSocket();
  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "score_event") return;
    const { data } = lastEvent;
    const update = {
      address: `${(data.user || data.address || "").slice(0, 6)}...${(data.user || data.address || "").slice(-4)}`,
      oldScore: null,
      newScore: data.newScore ?? 0,
      timestamp: "Just now"
    };
    setLiveUpdates((prev) => [update, ...prev].slice(0, 50));
  }, [lastEvent]);

  const handleRemove = (address) => {
    console.log("Remove address:", address);
  };

  if (loading) {
    return (
      <PageWrapper title="Registry Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading ACL...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Registry Management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ACLTable entries={aclEntries} onRemove={handleRemove} />
        </div>
        <div className="space-y-6">
          <LiveFeed updates={liveUpdates} />
        </div>
      </div>
    </PageWrapper>
  );
}

export default Registry;
