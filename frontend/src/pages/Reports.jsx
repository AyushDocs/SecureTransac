import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { fetchACL, fetchAuditLogs, fetchAuthorities, fetchDashboardMetrics, fetchUserReport } from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

// Reports page with export and audit logs
function Reports() {
  const [exportLoading, setExportLoading] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, activeRole, role } = useAuth();
  const currentRole = activeRole || role;

  const isAdminOrDeployer = ["admin", "deployer"].includes(currentRole);
  const isCompany = ["company", "creator"].includes(currentRole);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isAdminOrDeployer) {
          const logs = await fetchAuditLogs();
          setAuditLogs(logs);
        } else if (user?.address) {
          const report = await fetchUserReport(user.address);
          // Map user statement to audit log format for the table
          const mappedLogs = (report.statement || []).map((entry, idx) => ({
            id: `user_${idx}`,
            action: entry.event,
            user: 'You',
            target: 'Account',
            type: entry.status === 'Verified' ? 'access_control' : 'identity',
            timestamp: entry.date
          }));
          setAuditLogs(mappedLogs);
        }
      } catch (error) {
        logger.error("Failed to load report data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdminOrDeployer, user?.address]);

  const adminExportTypes = [
    { id: "transactions", label: "System Transaction Report", format: "CSV" },
    { id: "scores", label: "Trust Score Summary", format: "PDF" },
    { id: "acl", label: "ACL Export", format: "JSON" },
    { id: "audit", label: "Full Audit Trail", format: "PDF" },
  ];

  const userExportTypes = [
    { id: "my_statement", label: "My Reputational Statement", format: "PDF" },
    { id: "my_access", label: "Who Viewed My Profile", format: "CSV" }
  ];

  const companyExportTypes = [
    { id: "kyb_logs", label: "KYB Verification Logs", format: "CSV" },
    { id: "ecosystem_activity", label: "Ecosystem Partner Activity", format: "PDF" },
    ...userExportTypes, // Companies can also see their own basic reports
  ];

  let exportTypes = userExportTypes;
  if (isAdminOrDeployer) {
      exportTypes = adminExportTypes;
  } else if (isCompany) {
      exportTypes = companyExportTypes;
  }

  const generatePDF = (title, columns, data, filename) => {
    const doc = new jsPDF();
    doc.text(title, 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [columns],
      body: data,
    });
    doc.save(filename);
  };

  const generateCSV = (data, filename) => {
      if (!data || !data.length) return;
      const headers = Object.keys(data[0]).join(",");
      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers, ...data.map(row => Object.values(row).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const generateJSON = (data, filename) => {
    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (type) => {
    setExportLoading(type);
    try {
      if (type === "audit") {
        const columns = ["Action", "User", "Target", "Type", "Timestamp"];
        const rows = auditLogs.map(log => [
          log.action, 
          log.user, 
          log.target, 
          log.type, 
          new Date(log.timestamp).toLocaleString()
        ]);
        generatePDF("Audit Log Report", columns, rows, "audit_logs.pdf");
      } 
      else if (type === "acl") {
        const data = await fetchACL();
        generateJSON(data, "acl_export.json");
      }
      else if (type === "scores") {
        // Fetch authorities as a proxy for scored users or fetch actual scores if API exists
        const data = await fetchAuthorities();
        // Convert to array if object
        const list = Array.isArray(data) ? data : Object.entries(data).map(([k,v]) => ({id: k, ...v}));
        const columns = ["Address", "Name", "Email", "Status"];
        const rows = list.map(item => [item.id, item.name, item.email, item.status || 'active']);
        generatePDF("Trust Score / Authority Summary", columns, rows, "trust_scores.pdf");
      }

      else if (type === "my_statement") {
          // Generate PDF for User Statement (Real Data)
          const data = await fetchUserReport(user.address);
          const columns = ["Date", "Event", "Status"];
          
          let rows = [];
          if (data && data.statement) {
             rows = data.statement.map(item => [item.date, item.event, item.status]);
          }
          
          generatePDF(`Reputational Statement: ${user?.address}`, columns, rows, "my_statement.pdf");
      }
      else if (type === "my_access") {
          // Mock Access Logs
          const logs = [
              { viewer: "Bank of America", date: "2025-01-22", purpose: "Loan Application" },
              { viewer: "RentCheck Corp", date: "2025-01-18", purpose: "Rental History" }
          ];
          generateCSV(logs, "access_log.csv");
      }
      else if (type === "transactions") {
        // Mocking transaction data export for now, or use metrics
        // In a real scenario, fetchTransactions() would be called
        const metrics = await fetchDashboardMetrics();
        // Assuming metrics might have some recent txs, or just export audit logs filtered by TX
        const txLogs = auditLogs.filter(l => l.type === 'TRANSACTION' || l.type === 'tx_event');
        if (txLogs.length > 0) {
            generateCSV(txLogs, "transactions.csv");
        } else {
             // Fallback mock
             const mockTx = [
                 { id: "tx_1", from: "0x123", to: "0x456", amount: 100, timestamp: new Date().toISOString() },
                 { id: "tx_2", from: "0x456", to: "0x789", amount: 50, timestamp: new Date().toISOString() }
             ];
             generateCSV(mockTx, "transactions.csv");
        }
      }
      else if (type === "kyb_logs") {
          const logs = [
              { verificationId: "KYB_001", entity: "Tesla Inc", status: "Verified", date: "2024-12-01" },
              { verificationId: "KYB_002", entity: "SpaceX LLC", status: "Pending", date: "2025-01-15" }
          ];
          generateCSV(logs, "kyb_logs.csv");
      }
      else if (type === "ecosystem_activity") {
          const columns = ["Partner", "Interaction", "Date"];
          const rows = [
             ["ChainLink", "Oracle Update", "2025-01-20"],
             ["Aave", "Liquidity Provision", "2025-01-18"]
          ];
          generatePDF("Ecosystem Activity Report", columns, rows, "ecosystem_activity.pdf");
      }
      logger.info(`Report generated: ${type}`);
    } catch (error) {
      logger.error(`Failed to generate report: ${type}`, error);
      alert("Failed to generate report");
    } finally {
      setExportLoading(null);
    }
  };

  const getTypeVariant = (type) => {
    switch (type) {
      case "access_control": return "warning";
      case "configuration": return "default";
      case "identity": return "destructive";
      case "export": return "success";
      default: return "outline";
    }
  };

  return (
    <PageWrapper title="SecureTransac: Reports & Audit Logs">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Export Reports</h3>
          <div className="space-y-3">
            {exportTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-white">{type.label}</p>
                  <p className="text-xs text-gray-400">{type.format}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(type.id)}
                  disabled={exportLoading === type.id}
                >
                  {exportLoading === type.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">
              {isAdminOrDeployer ? "System Audit Log" : "Recent Personal Activity"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-white">{log.action}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-400">{log.user}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-400">{log.target}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getTypeVariant(log.type)}>{log.type.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-400">{log.timestamp}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Reports;
