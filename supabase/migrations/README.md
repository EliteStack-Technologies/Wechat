# Contacts Table Setup

## Run Migration in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `create_contacts_table.sql`
4. Click **Run** to execute the migration

## Table Structure

The `contacts` table stores user contacts with the following schema:

```sql
contacts (
  id              UUID PRIMARY KEY (auto-generated)
  owner_id        UUID (references auth.users)
  phone_number    TEXT (WhatsApp phone number)
  custom_name     TEXT (required - user-defined name)
  whatsapp_name   TEXT (optional - from WhatsApp profile)
  email           TEXT
  company         TEXT
  position        TEXT
  address         TEXT
  notes           TEXT
  tags            TEXT[] (array of tags)
  last_active     TIMESTAMPTZ
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ
)
```

## Features

✅ **Row Level Security (RLS)** - Users can only access their own contacts
✅ **Unique Constraint** - One contact per phone number per user
✅ **Indexes** - Optimized for fast queries on owner_id, phone_number, custom_name, and tags
✅ **Auto-updated timestamps** - `updated_at` automatically updates on changes
✅ **CASCADE deletion** - Contacts deleted when user is deleted

## RLS Policies

- `SELECT`: Users can view their own contacts
- `INSERT`: Users can create their own contacts
- `UPDATE`: Users can update their own contacts
- `DELETE`: Users can delete their own contacts

## API Endpoints

After running the migration, these endpoints will work:

- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/[id]` - Get specific contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact
- `GET /api/contacts/search?q=query&tag=tag` - Search contacts
