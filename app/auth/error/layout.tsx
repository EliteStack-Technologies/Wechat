export default function ErrorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Error pages should be accessible regardless of auth status
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 