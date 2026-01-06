import { useState } from "react";
import PageWrapper from "../layout/PageWrapper";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

// Reports page with export and audit logs
function Reports() {
  const [exportLoading, setExportLoading] = useState(null);

  const exportTypes = [
    { id: "transactions", label: "Transaction Report", format: "CSV" },
    { id: "scores", label: "Trust Score Summary", format: "PDF" },
    { id: "acl", label: "ACL Export", format: "JSON" },
    { id: "audit", label: "Full Audit Trail", format: "PDF" },
  ];

  const auditLogs = [
    {
      id: "1",
      action: "Address Whitelisted",
      user: "admin@securetransac.io",
      target: "0x742d...e322",
      timestamp: "2024-01-15 14:32:00",
      type: "access_control",
    },
    {
      id: "2",
      action: "Threshold Updated",
      user: "security@securetransac.io",
      target: "Global threshold: 0.65",
      timestamp: "2024-01-15 12:15:00",
      type: "configuration",
    },
    {
      id: "3",
      action: "Decryption Approved",
      user: "admin@securetransac.io",
      target: "Request #1234",
      timestamp: "2024-01-14 09:45:00",
      type: "identity",
    },
    {
      id: "4",
      action: "Manual Override",
      user: "compliance@securetransac.io",
      target: "0x8Ba1...BA72",
      timestamp: "2024-01-13 16:20:00",
      type: "access_control",
    },
    {
      id: "5",
      action: "Authority Added",
      user: "admin@securetransac.io",
      target: "mike@securetransac.io",
      timestamp: "2024-01-12 11:00:00",
      type: "identity",
    },
    {
      id: "6",
      action: "Report Exported",
      user: "analyst@securetransac.io",
      target: "Transaction Report (CSV)",
      timestamp: "2024-01-11 08:30:00",
      type: "export",
    },
  ];

  const handleExport = (type) => {
    setExportLoading(type);
    setTimeout(() => {
      setExportLoading(null);
      console.log("Exported:", type);
    }, 1500);
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
    <PageWrapper title="Reports & Audit Logs">
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
            <h3 className="text-lg font-semibold text-white">Audit Log</h3>
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
                {auditLogs.map((log) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Reports;
