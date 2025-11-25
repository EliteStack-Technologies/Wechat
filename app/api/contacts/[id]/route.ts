import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch a specific contact
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const contactId = params.id;

    // Fetch the contact
    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("owner_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      contact 
    });

  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

// PUT - Update a contact
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const contactId = params.id;
    const body = await request.json();
    const { 
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
    if (!customName) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Update the contact
    const { data: contact, error: updateError } = await supabase
      .from("contacts")
      .update({
        custom_name: customName.trim(),
        whatsapp_name: whatsappName?.trim() || null,
        email: email?.trim() || null,
        company: company?.trim() || null,
        position: position?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        tags: tags && Array.isArray(tags) ? tags : null,
      })
      .eq("id", contactId)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      contact,
      message: "Contact updated successfully" 
    });

  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a contact
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const contactId = params.id;

    // Delete the contact (CASCADE will handle related data)
    const { error: deleteError } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId)
      .eq("owner_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ 
      success: true,
      message: "Contact deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
