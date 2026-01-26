import Badge from "../components/common/Badge";

// Access Control List table component
function ACLTable({ entries, onRemove }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recently Authorized Accounts: </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Added By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry, index) => (
              <tr key={index} className="hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-foreground">{entry.address}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={entry.type === "whitelist" ? "success" : "destructive"}>
                    {entry.type}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">{entry.addedBy}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">{entry.date}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ACLTable;
