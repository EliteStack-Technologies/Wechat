-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_groups_with_counts();

-- Create function to get user groups with contact counts
CREATE OR REPLACE FUNCTION get_user_groups_with_counts()
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  group_description TEXT,
  member_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cg.id AS group_id,
    cg.name AS group_name,
    cg.description AS group_description,
    COALESCE(COUNT(DISTINCT contacts.id), 0) AS member_count
  FROM chat_groups cg
  LEFT JOIN contact_groups ON contact_groups.group_id = cg.id
  LEFT JOIN contacts ON contacts.id = contact_groups.contact_id
  WHERE cg.owner_id = auth.uid()
  GROUP BY cg.id, cg.name, cg.description
  ORDER BY cg.created_at DESC;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_user_groups_with_counts() IS 'Returns all groups for the authenticated user with contact member counts from contacts table via contact_groups';
