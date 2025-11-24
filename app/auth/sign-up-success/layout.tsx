export default function SignUpSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This page should be accessible regardless of auth status
  // as it's a confirmation page after sign-up
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 