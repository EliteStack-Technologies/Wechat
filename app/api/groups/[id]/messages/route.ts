import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Get all broadcast messages for a group
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

    // Get all messages that are broadcast messages for this group
    // These are messages where media_data contains broadcast_group_id = groupId
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', user.id)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('Error fetching broadcast messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: messagesError.message },
        { status: 500 }
      );
    }

    // Filter messages that belong to this broadcast group
    // Check if media_data contains broadcast_group_id matching our groupId
    const broadcastMessages = messages?.filter(msg => {
      if (!msg.media_data) return false;
      try {
        const mediaData = typeof msg.media_data === 'string' 
          ? JSON.parse(msg.media_data) 
          : msg.media_data;
        return mediaData.broadcast_group_id === groupId;
      } catch {
        return false;
      }
    }) || [];

    // Group messages by their timestamp to identify unique broadcasts
    // (same broadcast sent to multiple people will have same timestamp)
    const uniqueBroadcasts = new Map();
    broadcastMessages.forEach(msg => {
      const key = msg.timestamp; // Use timestamp as key to group same broadcast
      if (!uniqueBroadcasts.has(key) || msg.id < uniqueBroadcasts.get(key).id) {
        // Keep the first message (or the one with smallest ID) for each timestamp
        uniqueBroadcasts.set(key, msg);
      }
    });

    // Convert map to array and format for display
    const formattedMessages = Array.from(uniqueBroadcasts.values()).map(msg => ({
      id: msg.id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      content: msg.content,
      timestamp: msg.timestamp,
      is_sent_by_me: true, // All broadcast messages are sent by the user
      message_type: msg.message_type,
      media_data: msg.media_data,
      is_read: true
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length
    });

  } catch (error) {
    console.error('Error in get broadcast messages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

