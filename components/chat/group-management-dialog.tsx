"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Users, Save, Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Contact {
  id: string;
  phone_number: string;
  custom_name: string;
  whatsapp_name?: string;
  email?: string;
  company?: string;
}

interface ChatUser {
  id: string;
  name: string;
  custom_name?: string;
  whatsapp_name?: string;
}

interface Group {
  group_id: string;
  group_name: string;
  group_description?: string;
  member_count: number;
}

interface GroupManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: ChatUser[];
  group?: Group | null; // If provided, we're editing; otherwise creating
  onGroupSaved: () => void;
}

export function GroupManagementDialog({
  isOpen,
  onClose,
  // users,
  group,
  onGroupSaved,
}: GroupManagementDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  const supabase = createClient();

  // Load contacts when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  // Load existing group data if editing
  useEffect(() => {
    if (group) {
      setName(group.group_name);
      setDescription(group.group_description || "");
      loadGroupMembers(group.group_id);
    } else {
      setName("");
      setDescription("");
      setSelectedUserIds([]);
    }
  }, [group]);

  const loadContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, phone_number, custom_name, whatsapp_name, email, company")
        .order("custom_name", { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setError("Failed to load contacts");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from("contact_groups")
        .select("contact_id")
        .eq("group_id", groupId);
      
      if (error) throw error;
      if (data) {
        setSelectedUserIds(data.map((m: { contact_id: string }) => m.contact_id));
      }
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    if (selectedUserIds.length === 0) {
      setError("Please select at least one member");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (group) {
        // Update existing group
        const updateResponse = await fetch(`/api/groups/${group.group_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update group');
        }

        // Get current members from contact_groups
        const { data: currentMembers } = await supabase
          .from("contact_groups")
          .select("contact_id")
          .eq("group_id", group.group_id);
        
        const currentMemberIds = currentMembers?.map((m: { contact_id: string }) => m.contact_id) || [];

        // Find members to add and remove
        const toAdd = selectedUserIds.filter(id => !currentMemberIds.includes(id));
        const toRemove = currentMemberIds.filter((id: string) => !selectedUserIds.includes(id));

        // Remove members
        if (toRemove.length > 0) {
          await supabase
            .from("contact_groups")
            .delete()
            .eq("group_id", group.group_id)
            .in("contact_id", toRemove);
        }

        // Add new members
        if (toAdd.length > 0) {
          const memberships = toAdd.map(contactId => ({
            contact_id: contactId,
            group_id: group.group_id,
          }));
          
          await supabase
            .from("contact_groups")
            .insert(memberships);
        }
      } else {
        // Create new group
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            memberIds: selectedUserIds,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create group');
        }
      }

      onGroupSaved();
      onClose();
    } catch (error) {
      console.error('Error saving group:', error);
      setError(error instanceof Error ? error.message : 'Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.custom_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone_number.includes(searchTerm) ||
    contact.whatsapp_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getContactDisplayName = (contact: Contact) => {
    return contact.custom_name || contact.whatsapp_name || contact.phone_number;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold">
              {group ? 'Edit Group' : 'Create New Group'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              placeholder="e.g., VIP Customers, Weekly Newsletter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description">Description (Optional)</Label>
            <Textarea
              id="group-description"
              placeholder="Brief description of this group..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Members Selection */}
          <div className="space-y-3">
            <Label>Select Contacts * ({selectedUserIds.length} selected)</Label>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Contact List */}
            <div className="border border-border rounded-lg max-h-64 overflow-y-auto">
              {isLoadingContacts ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading contacts...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {contacts.length === 0 ? "No contacts available. Add contacts first." : "No contacts found"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredContacts.map(contact => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(contact.id)}
                        onCheckedChange={() => handleToggleUser(contact.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{getContactDisplayName(contact)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="truncate">{contact.phone_number}</span>
                          {contact.company && (
                            <>
                              <span>•</span>
                              <span className="truncate">{contact.company}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {group ? 'Update Group' : 'Create Group'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

