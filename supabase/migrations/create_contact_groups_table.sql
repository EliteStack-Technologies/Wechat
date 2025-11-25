-- Create contact_groups junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS contact_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  UNIQUE(contact_id, group_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_groups_contact_id ON contact_groups(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_groups_group_id ON contact_groups(group_id);

-- Enable Row Level Security
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view contact groups they own" ON contact_groups;
DROP POLICY IF EXISTS "Users can add contacts to their groups" ON contact_groups;
DROP POLICY IF EXISTS "Users can remove contacts from their groups" ON contact_groups;

-- Create RLS policies
-- Users can view contact-group relationships for contacts they own
CREATE POLICY "Users can view contact groups they own"
  ON contact_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_groups.contact_id
      AND contacts.owner_id = auth.uid()
    )
  );

-- Users can add contacts to groups they own
CREATE POLICY "Users can add contacts to their groups"
  ON contact_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_groups.contact_id
      AND contacts.owner_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM chat_groups
      WHERE chat_groups.id = contact_groups.group_id
      AND chat_groups.owner_id = auth.uid()
    )
  );

-- Users can remove contacts from groups they own
CREATE POLICY "Users can remove contacts from their groups"
  ON contact_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_groups.contact_id
      AND contacts.owner_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE contact_groups IS 'Junction table linking contacts to groups';
COMMENT ON COLUMN contact_groups.contact_id IS 'Reference to the contact';
COMMENT ON COLUMN contact_groups.group_id IS 'Reference to the group';
COMMENT ON COLUMN contact_groups.added_by IS 'User who added the contact to the group';
