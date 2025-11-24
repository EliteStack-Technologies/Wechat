export default function ConfirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This page should be accessible regardless of auth status
  // as it's used for email confirmation
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 