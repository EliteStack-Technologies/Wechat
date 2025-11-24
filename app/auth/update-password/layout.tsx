import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // For update-password, user should be authenticated
  // If not authenticated, redirect to login
  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 