import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Get all members of a group
 */
export async function GET(
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

    // Verify group ownership
    const { data: group } = await supabase
      .from('chat_groups')
      .select('id')
      .eq('id', groupId)
      .eq('owner_id', user.id)
      .single();

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get members with details
    const { data: members, error: membersError } = await supabase
      .rpc('get_group_members_with_details', { p_group_id: groupId });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch members', details: membersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      members: members || [],
    });

  } catch (error) {
    console.error('Error in get members API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Add members to a group
 */
export async function POST(
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
    const { userIds } = body;

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    // Verify group ownership
    const { data: group } = await supabase
      .from('chat_groups')
      .select('id')
      .eq('id', groupId)
      .eq('owner_id', user.id)
      .single();

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or unauthorized' },
        { status: 404 }
      );
    }

    // Add members (duplicates will be ignored due to unique constraint)
    const members = userIds.map(userId => ({
      group_id: groupId,
      user_id: userId,
    }));

    const { data, error: insertError } = await supabase
      .from('group_members')
      .insert(members)
      .select();

    if (insertError) {
      console.error('Error adding members:', insertError);
      return NextResponse.json(
        { error: 'Failed to add members', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${data?.length || 0} member(s) added successfully`,
      added: data?.length || 0,
    });

  } catch (error) {
    console.error('Error in add members API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a member from a group
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify group ownership
    const { data: group } = await supabase
      .from('chat_groups')
      .select('id')
      .eq('id', groupId)
      .eq('owner_id', user.id)
      .single();

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or unauthorized' },
        { status: 404 }
      );
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove member', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });

  } catch (error) {
    console.error('Error in remove member API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

