// Page wrapper component for consistent layout
function PageWrapper({ title, children }) {
  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
        </div>
      )}
      {children}
    </div>
  );
}

export default PageWrapper;