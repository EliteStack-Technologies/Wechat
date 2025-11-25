import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch all contacts for the authenticated user
export async function GET() {
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

    // Fetch all contacts for the current user
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("owner_id", user.id)
      .order("custom_name", { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      contacts: contacts || [],
      count: contacts?.length || 0
    });

  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST - Create a new contact
export async function POST(request: Request) {
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

    const body = await request.json();
    const { 
      phoneNumber, 
      customName, 
      whatsappName,
      email, 
      company, 
      position, 
      address, 
      notes, 
      tags 
    } = body;

    // Validate required fields
    if (!phoneNumber || !customName) {
      return NextResponse.json(
        { error: "Phone number and name are required" },
        { status: 400 }
      );
    }

    // Create the contact
    const { data: contact, error: insertError } = await supabase
      .from("contacts")
      .insert({
        phone_number: phoneNumber.trim(),
        custom_name: customName.trim(),
        whatsapp_name: whatsappName?.trim() || null,
        email: email?.trim() || null,
        company: company?.trim() || null,
        position: position?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        tags: tags && Array.isArray(tags) ? tags : null,
        last_active: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: "Contact with this phone number already exists" },
          { status: 409 }
        );
      }
      throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      contact,
      message: "Contact created successfully" 
    });

  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
