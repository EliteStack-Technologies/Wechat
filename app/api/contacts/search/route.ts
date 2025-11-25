import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Search contacts
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const tag = searchParams.get("tag");

    // Build query
    let dbQuery = supabase
      .from("contacts")
      .select("*")
      .eq("owner_id", user.id);

    // Apply search filter
    if (query) {
      dbQuery = dbQuery.or(`custom_name.ilike.%${query}%,whatsapp_name.ilike.%${query}%,phone_number.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`);
    }

    // Apply tag filter
    if (tag) {
      dbQuery = dbQuery.contains("tags", [tag]);
    }

    const { data: contacts, error } = await dbQuery.order("custom_name", { 
      ascending: true, 
      nullsFirst: false 
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      contacts: contacts || [],
      count: contacts?.length || 0,
      query,
      tag
    });

  } catch (error) {
    console.error("Error searching contacts:", error);
    return NextResponse.json(
      { error: "Failed to search contacts" },
      { status: 500 }
    );
  }
}
