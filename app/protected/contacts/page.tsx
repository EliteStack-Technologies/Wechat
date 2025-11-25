"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Save, X, Phone, User, Mail, Building, MapPin, Calendar, Tag, FileText, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Contact {
  id: string;
  owner_id: string;
  phone_number: string;
  custom_name: string;
  whatsapp_name?: string;
  email?: string;
  company?: string;
  position?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  last_active?: string;
  created_at: string;
  updated_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    customName: "",
    email: "",
    company: "",
    position: "",
    address: "",
    notes: "",
    tags: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = contacts.filter(
        (contact) =>
          contact.custom_name?.toLowerCase().includes(term) ||
          contact.whatsapp_name?.toLowerCase().includes(term) ||
          contact.phone_number.toLowerCase().includes(term) ||
          contact.email?.toLowerCase().includes(term) ||
          contact.company?.toLowerCase().includes(term)
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("custom_name", { ascending: true, nullsFirst: false });

      if (error) throw error;

      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setError("Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setFormData({
      phoneNumber: "",
      customName: "",
      email: "",
      company: "",
      position: "",
      address: "",
      notes: "",
      tags: "",
    });
    setShowAddDialog(true);
    setError(null);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      phoneNumber: contact.phone_number,
      customName: contact.custom_name || "",
      email: contact.email || "",
      company: contact.company || "",
      position: contact.position || "",
      address: contact.address || "",
      notes: contact.notes || "",
      tags: contact.tags?.join(", ") || "",
    });
    setShowAddDialog(true);
    setError(null);
  };

  const handleSaveContact = async () => {
    if (editingContact) {
      // Update existing contact
      if (!formData.customName.trim()) {
        setError("Name is required");
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        // Update the contact
        const { error } = await supabase
          .from("contacts")
          .update({
            custom_name: formData.customName.trim(),
            email: formData.email.trim() || null,
            company: formData.company.trim() || null,
            position: formData.position.trim() || null,
            address: formData.address.trim() || null,
            notes: formData.notes.trim() || null,
            tags: formData.tags
              ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : null,
          })
          .eq("id", editingContact.id);

        if (error) throw error;

        await loadContacts();
        setShowAddDialog(false);
      } catch (error) {
        console.error("Error updating contact:", error);
        setError("Failed to update contact");
      } finally {
        setIsSaving(false);
      }
    } else {
      // Create new contact
      if (!formData.phoneNumber.trim() || !formData.customName.trim()) {
        setError("Phone number and name are required");
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const newPhoneNumber = formData.phoneNumber.trim();
        
        // Create the contact
        const { error: insertError } = await supabase
          .from("contacts")
          .insert({
            phone_number: newPhoneNumber,
            custom_name: formData.customName.trim(),
            email: formData.email.trim() || null,
            company: formData.company.trim() || null,
            position: formData.position.trim() || null,
            address: formData.address.trim() || null,
            notes: formData.notes.trim() || null,
            tags: formData.tags
              ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : null,
            last_active: new Date().toISOString(),
          });

        if (insertError) {
          if (insertError.code === '23505') {
            setError("Contact with this phone number already exists");
            setIsSaving(false);
            return;
          }
          throw insertError;
        }

        await loadContacts();
        setShowAddDialog(false);
      } catch (error) {
        console.error("Error creating contact:", error);
        setError("Failed to create contact");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return;
    }

    try {
      setError(null);
      
      console.log("Deleting contact:", contactId);
      
      // Delete the contact from contacts table
      const { error: deleteError } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setFilteredContacts(prev => prev.filter(c => c.id !== contactId));
      
      console.log("Contact deleted successfully");
      
    } catch (error) {
      console.error("Error deleting contact:", error);
      setError(`Failed to delete contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await loadContacts();
    }
  };

  const getDisplayName = (contact: Contact) => {
    return contact.custom_name || contact.whatsapp_name || contact.phone_number;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/protected")}
            className="h-10 w-10"
            title="Back to Chat"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contact Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your WhatsApp contacts and customer information
            </p>
          </div>
        </div>
        <Button onClick={handleAddContact} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search contacts by name, phone, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contact Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted-foreground">Loading contacts...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? "No contacts found" : "No contacts yet"}
          </p>
          {!searchTerm && (
            <Button onClick={handleAddContact} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Contact
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-lg">
                        {getDisplayName(contact).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {getDisplayName(contact)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs mt-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone_number}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditContact(contact)}
                      title="Edit contact"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => handleDeleteContact(contact.id)}
                      title="Delete contact"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {contact.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {contact.company}
                      {contact.position && ` • ${contact.position}`}
                    </span>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{contact.address}</span>
                  </div>
                )}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {contact.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {contact.notes && (
                  <div className="flex gap-2 text-muted-foreground pt-2 border-t">
                    <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p className="text-xs line-clamp-2">{contact.notes}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <Calendar className="h-3 w-3" />
                  <span>Added {formatDate(contact.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Contact Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingContact ? "Edit Contact" : "Add New Contact"}
                  </CardTitle>
                  <CardDescription>
                    {editingContact
                      ? "Update contact information"
                      : "Add a new contact to your list"}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddDialog(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="918097296453"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  disabled={!!editingContact || isSaving}
                  className={editingContact ? "bg-muted" : ""}
                />
                {editingContact && (
                  <p className="text-xs text-muted-foreground">
                    Phone number cannot be changed
                  </p>
                )}
              </div>

              {/* Custom Name */}
              <div className="space-y-2">
                <Label htmlFor="customName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name *
                </Label>
                <Input
                  id="customName"
                  placeholder="John Doe"
                  value={formData.customName}
                  onChange={(e) =>
                    setFormData({ ...formData, customName: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>

              {/* Company & Position */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company
                  </Label>
                  <Input
                    id="company"
                    placeholder="Acme Inc"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Position
                  </Label>
                  <Input
                    id="position"
                    placeholder="Sales Manager"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </Label>
                <Input
                  id="tags"
                  placeholder="customer, vip, premium (comma separated)"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple tags with commas
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this contact..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  disabled={isSaving}
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveContact}
                  disabled={isSaving}
                  className="flex-1 gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingContact ? "Update Contact" : "Add Contact"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
