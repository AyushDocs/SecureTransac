import Badge from "../components/common/Badge";
import Button from "../components/common/Button";

// Authority management list
function AuthorityList({ authorities, onRevoke }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Authorized Entities</h3>
        <Button variant="outline" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Authority
        </Button>
      </div>
      <div className="space-y-3">
        {authorities.map((auth, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-secondary rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{auth.name}</p>
                <p className="text-xs text-muted-foreground">{auth.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={auth.level === "admin" ? "default" : "outline"}>
                {auth.level}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRevoke && onRevoke(auth.id)}
              >
                <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AuthorityList;
