import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT - Update a group
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: groupId } = await params;
    const body = await request.json();
    const { name, description } = body;

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // Update the group
    const { data: group, error: updateError } = await supabase
      .from('chat_groups')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .eq('id', groupId)
      .eq('owner_id', user.id) // Ensure user owns the group
      .select()
      .single();

    if (updateError) {
      console.error('Error updating group:', updateError);
      return NextResponse.json(
        { error: 'Failed to update group', details: updateError.message },
        { status: 500 }
      );
    }

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Group updated successfully',
      group,
    });

  } catch (error) {
    console.error('Error in update group API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: groupId } = await params;

    // Delete the group (cascade will delete members)
    const { error: deleteError } = await supabase
      .from('chat_groups')
      .delete()
      .eq('id', groupId)
      .eq('owner_id', user.id); // Ensure user owns the group

    if (deleteError) {
      console.error('Error deleting group:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete group', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });

  } catch (error) {
    console.error('Error in delete group API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

