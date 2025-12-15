"use client";

import React, { useState, useEffect } from 'react';
import { Search, Crown, MessageSquare, Phone, Mail, Calendar, DollarSign, Users, RefreshCw, Clock, TrendingUp, X, Plus, User, Smartphone, CalendarDays, Briefcase, Send} from 'lucide-react';

// Types
type LeadStatus =
  | 'new'
  | 'in_progress'
  | 'qualified'
  | 'needs_human_review';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  budget: number | null;
  timeline: string | null;
  working_with_agent: boolean | null;
  status: LeadStatus;
  is_vip: boolean;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  lead_id: string;
  message: string;
  sender: 'ai' | 'lead';
  created_at: string;
}

interface Note {
  id: string;
  lead_id: string;
  note: string;
  created_at: string;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    budget: '',
    timeline: '',
    is_vip: false,
    notes: ''
  });
  const [creatingLead, setCreatingLead] = useState(false);

  // Function to create a new lead via n8n
  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.phone) {
      alert('Name and phone are required');
      return;
    }

    setCreatingLead(true);
    try {
      // Send POST request to your n8n webhook
      const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLead.name,
          phone: newLead.phone,
          email: newLead.email || null,
          budget: newLead.budget ? parseInt(newLead.budget) : null,
          timeline: newLead.timeline || null,
          is_vip: newLead.is_vip,
          notes: newLead.notes || null,
          source: 'dashboard'
        }),
      });

      if (response.ok) {
        // Reset form
        setNewLead({
          name: '',
          phone: '',
          email: '',
          budget: '',
          timeline: '',
          is_vip: false,
          notes: ''
        });
        setShowLeadForm(false);

        // Refresh leads list
        fetchLeads();

        alert('Lead created successfully!');
      } else {
        throw new Error('Failed to create lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Error creating lead. Please try again.');
    } finally {
      setCreatingLead(false);
    }
  };

  // Fetch leads
  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch conversations for selected lead
  const fetchConversations = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/conversations`);
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch notes for selected lead
  const fetchNotes = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/notes`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim()) return;

    try {
      const response = await fetch(`/api/leads/${selectedLead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });

      if (response.ok) {
        setNewNote('');
        fetchNotes(selectedLead.id);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // Select lead
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    fetchConversations(lead.id);
    fetchNotes(lead.id);
  };

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeads();
    if (selectedLead) {
      fetchConversations(selectedLead.id);
      fetchNotes(selectedLead.id);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Filter leads
  const filteredLeads = leads ? leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) : {};

  // Stats
  const stats = {
    total: leads.length,
    vip: leads.filter(l => l.is_vip).length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    inProgress: leads.filter(l => l.status === 'in_progress').length,
  };

  // Status badge helper
  // const getStatusBadge = (status: string) => {
  //   const styles = {
  //     new: 'bg-blue-100 text-blue-700',
  //     in_progress: 'bg-yellow-100 text-yellow-700',
  //     qualified: 'bg-green-100 text-green-700',
  //     needs_human_review: 'bg-red-100 text-red-700',
  //   };
  //   const labels = {
  //     new: 'New',
  //     in_progress: 'In Progress',
  //     qualified: 'Qualified',
  //     needs_human_review: 'Needs Review',
  //   };
  //   return (
  //     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
  //       {labels[status] || status}
  //     </span>
  //   );
  // };
  const getStatusBadge = (status: LeadStatus) => {
    const styles: Record<LeadStatus, string> = {
      new: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      qualified: 'bg-green-100 text-green-700',
      needs_human_review: 'bg-red-100 text-red-700',
    };

    const labels: Record<LeadStatus, string> = {
      new: 'New',
      in_progress: 'In Progress',
      qualified: 'Qualified',
      needs_human_review: 'Needs Review',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };


  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      {/* <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prestige Properties</h1>
            <p className="text-sm text-slate-600">Lead Management System</p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </header> */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Prestige Properties</h1>
              <p className="text-sm text-slate-600">Lead Management System</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLeadForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Lead
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Create Lead Modal/Form */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Create New Lead</h2>
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Name *
                    </div>
                  </label>
                  <input
                    type="text"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Phone Number *
                    </div>
                  </label>
                  <input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    placeholder="+1234567890"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Budget
                    </div>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={newLead.budget}
                      onChange={(e) => setNewLead({...newLead, budget: e.target.value})}
                      placeholder="500000"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Timeline
                    </div>
                  </label>
                  <select
                    value={newLead.timeline}
                    onChange={(e) => setNewLead({...newLead, timeline: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Select timeline</option>
                    <option value="immediate">Immediate (1-3 months)</option>
                    <option value="3-6_months">3-6 months</option>
                    <option value="6-12_months">6-12 months</option>
                    <option value="exploring">Just exploring</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_vip"
                    checked={newLead.is_vip}
                    onChange={(e) => setNewLead({...newLead, is_vip: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_vip" className="flex items-center gap-2 text-sm text-slate-700">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Mark as VIP Lead
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Initial Notes
                  </label>
                  <textarea
                    value={newLead.notes}
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    placeholder="Any additional notes about this lead..."
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowLeadForm(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    disabled={creatingLead}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateLead}
                    disabled={creatingLead}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creatingLead ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Create Lead
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Leads</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-900 font-medium">VIP Leads</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{stats.vip}</p>
              </div>
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Qualified</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.qualified}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  {['all', 'new', 'in_progress', 'qualified'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === status
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {status === 'all' ? 'All' : status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto max-h-[600px]">
                {filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No leads found</p>
                  </div>
                ) : (
                  filteredLeads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className={`w-full p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left ${selectedLead?.id === lead.id ? 'bg-slate-50' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                            {lead.is_vip && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-amber-900 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-full">
                                <Crown className="w-3 h-3" />
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{lead.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        {getStatusBadge(lead.status)}
                        <span className="text-xs text-slate-400">{formatDate(lead.created_at)}</span>
                      </div>

                      {lead.budget && (
                        <p className="text-xs text-slate-600 mt-2 font-medium">
                          {formatCurrency(lead.budget)}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Lead Detail */}
          <div className="lg:col-span-2">
            {selectedLead ? (
              <div className="space-y-6">
                {/* Lead Info Card with Close Button */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-slate-900">{selectedLead.name}</h2>
                        {selectedLead.is_vip && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold text-amber-900 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-full">
                            <Crown className="w-4 h-4" />
                            VIP Lead
                          </span>
                        )}
                      </div>
                      {getStatusBadge(selectedLead.status)}
                    </div>
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Close lead details"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm font-medium text-slate-900">{selectedLead.phone}</p>
                      </div>
                    </div>

                    {selectedLead.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm font-medium text-slate-900">{selectedLead.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Budget</p>
                        <p className="text-sm font-medium text-slate-900">{formatCurrency(selectedLead.budget)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Timeline</p>
                        <p className="text-sm font-medium text-slate-900">{selectedLead.timeline || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversation History */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Conversation History
                    </h3>
                  </div>

                  <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    {(!conversations || !Array.isArray(conversations) || conversations.length === 0) ? (
                      <p className="text-center text-slate-500 py-8">No conversation yet</p>
                    ) : (
                      conversations.map(conv => (
                        <div
                          key={conv.id}
                          className={`flex ${conv.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-3 ${conv.sender === 'ai'
                              ? 'bg-slate-100 text-slate-900'
                              : 'bg-slate-900 text-white'
                              }`}
                          >
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {conv.sender === 'ai' ? 'AI Assistant' : selectedLead.name}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{conv.message}</p>
                            <p className="text-xs mt-2 opacity-60">{formatDate(conv.created_at)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">Agent Notes</h3>
                  </div>

                  <div className="p-4">
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a private note..."
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                      />
                      <button
                        onClick={handleAddNote}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Add Note
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(!notes || !Array.isArray(notes) || notes.length === 0) ? (
                        <p className="text-center text-slate-500 py-4">No notes yet</p>
                      ) : (
                        notes.map(note => (
                          <div key={note.id} className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-900">{note.note}</p>
                            <p className="text-xs text-slate-500 mt-1">{formatDate(note.created_at)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Lead</h3>
                <p className="text-slate-600">Choose a lead from the list to view details and conversation history</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  //       {/* Header */}
  //       <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
  //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
  //           <div className="flex items-center justify-between">
  //             <div>
  //               <h1 className="text-2xl font-bold text-slate-900">Prestige Properties</h1>
  //               <p className="text-sm text-slate-600">Lead Management System</p>
  //             </div>
  //             <button
  //               onClick={handleRefresh}
  //               disabled={refreshing}
  //               className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
  //             >
  //               <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
  //               Refresh
  //             </button>
  //           </div>
  //         </div>
  //       </header>

  //       {/* Stats */}
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  //           <div className="bg-white rounded-xl p-5 border border-slate-200">
  //             <div className="flex items-center justify-between">
  //               <div>
  //                 <p className="text-sm text-slate-600">Total Leads</p>
  //                 <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
  //               </div>
  //               <Users className="w-8 h-8 text-blue-500" />
  //             </div>
  //           </div>

  //           <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200">
  //             <div className="flex items-center justify-between">
  //               <div>
  //                 <p className="text-sm text-amber-900 font-medium">VIP Leads</p>
  //                 <p className="text-2xl font-bold text-amber-900 mt-1">{stats.vip}</p>
  //               </div>
  //               <Crown className="w-8 h-8 text-amber-500" />
  //             </div>
  //           </div>

  //           <div className="bg-white rounded-xl p-5 border border-slate-200">
  //             <div className="flex items-center justify-between">
  //               <div>
  //                 <p className="text-sm text-slate-600">Qualified</p>
  //                 <p className="text-2xl font-bold text-green-600 mt-1">{stats.qualified}</p>
  //               </div>
  //               <TrendingUp className="w-8 h-8 text-green-500" />
  //             </div>
  //           </div>

  //           <div className="bg-white rounded-xl p-5 border border-slate-200">
  //             <div className="flex items-center justify-between">
  //               <div>
  //                 <p className="text-sm text-slate-600">In Progress</p>
  //                 <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
  //               </div>
  //               <Clock className="w-8 h-8 text-yellow-500" />
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Main Content */}
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
  //         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  //           {/* Lead List */}
  //           <div className="lg:col-span-1">
  //             <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
  //               <div className="p-4 border-b border-slate-200">
  //                 <div className="relative mb-3">
  //                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  //                   <input
  //                     type="text"
  //                     placeholder="Search leads..."
  //                     value={searchTerm}
  //                     onChange={(e) => setSearchTerm(e.target.value)}
  //                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
  //                   />
  //                 </div>

  //                 <div className="flex gap-2">
  //                   {['all', 'new', 'in_progress', 'qualified'].map(status => (
  //                     <button
  //                       key={status}
  //                       onClick={() => setFilterStatus(status)}
  //                       className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === status
  //                         ? 'bg-slate-900 text-white'
  //                         : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
  //                         }`}
  //                     >
  //                       {status === 'all' ? 'All' : status.replace('_', ' ')}
  //                     </button>
  //                   ))}
  //                 </div>
  //               </div>

  //               <div className="overflow-y-auto max-h-[600px]">
  //                 {filteredLeads.length === 0 ? (
  //                   <div className="p-8 text-center text-slate-500">
  //                     <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
  //                     <p>No leads found</p>
  //                   </div>
  //                 ) : (
  //                   filteredLeads.map(lead => (
  //                     <button
  //                       key={lead.id}
  //                       onClick={() => handleSelectLead(lead)}
  //                       className={`w-full p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left ${selectedLead?.id === lead.id ? 'bg-slate-50' : ''
  //                         }`}
  //                     >
  //                       <div className="flex items-start justify-between mb-2">
  //                         <div className="flex-1">
  //                           <div className="flex items-center gap-2 mb-1">
  //                             <h3 className="font-semibold text-slate-900">{lead.name}</h3>
  //                             {lead.is_vip && (
  //                               <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-amber-900 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-full">
  //                                 <Crown className="w-3 h-3" />
  //                                 VIP
  //                               </span>
  //                             )}
  //                           </div>
  //                           <p className="text-xs text-slate-500">{lead.phone}</p>
  //                         </div>
  //                       </div>

  //                       <div className="flex items-center justify-between">
  //                         {getStatusBadge(lead.status)}
  //                         <span className="text-xs text-slate-400">{formatDate(lead.created_at)}</span>
  //                       </div>

  //                       {lead.budget && (
  //                         <p className="text-xs text-slate-600 mt-2 font-medium">
  //                           {formatCurrency(lead.budget)}
  //                         </p>
  //                       )}
  //                     </button>
  //                   ))
  //                 )}
  //               </div>
  //             </div>
  //           </div>

  //           {/* Lead Detail */}
  //           <div className="lg:col-span-2">
  //             {selectedLead ? (
  //               <div className="space-y-6">
  //                 {/* Lead Info Card */}
  //                 <div className="bg-white rounded-xl border border-slate-200 p-6">
  //                   <div className="flex items-start justify-between mb-4">
  //                     <div>
  //                       <div className="flex items-center gap-3 mb-2">
  //                         <h2 className="text-2xl font-bold text-slate-900">{selectedLead.name}</h2>
  //                         {selectedLead.is_vip && (
  //                           <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold text-amber-900 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-full">
  //                             <Crown className="w-4 h-4" />
  //                             VIP Lead
  //                           </span>
  //                         )}
  //                       </div>
  //                       {getStatusBadge(selectedLead.status)}
  //                     </div>
  //                   </div>

  //                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  //                     <div className="flex items-center gap-3">
  //                       <Phone className="w-5 h-5 text-slate-400" />
  //                       <div>
  //                         <p className="text-xs text-slate-500">Phone</p>
  //                         <p className="text-sm font-medium text-slate-900">{selectedLead.phone}</p>
  //                       </div>
  //                     </div>

  //                     {selectedLead.email && (
  //                       <div className="flex items-center gap-3">
  //                         <Mail className="w-5 h-5 text-slate-400" />
  //                         <div>
  //                           <p className="text-xs text-slate-500">Email</p>
  //                           <p className="text-sm font-medium text-slate-900">{selectedLead.email}</p>
  //                         </div>
  //                       </div>
  //                     )}

  //                     <div className="flex items-center gap-3">
  //                       <DollarSign className="w-5 h-5 text-slate-400" />
  //                       <div>
  //                         <p className="text-xs text-slate-500">Budget</p>
  //                         <p className="text-sm font-medium text-slate-900">{formatCurrency(selectedLead.budget)}</p>
  //                       </div>
  //                     </div>

  //                     <div className="flex items-center gap-3">
  //                       <Calendar className="w-5 h-5 text-slate-400" />
  //                       <div>
  //                         <p className="text-xs text-slate-500">Timeline</p>
  //                         <p className="text-sm font-medium text-slate-900">{selectedLead.timeline || 'Not specified'}</p>
  //                       </div>
  //                     </div>
  //                   </div>
  //                 </div>

  //                 {/* Conversation History
  //                 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
  //                   <div className="p-4 border-b border-slate-200">
  //                     <h3 className="font-semibold text-slate-900 flex items-center gap-2">
  //                       <MessageSquare className="w-5 h-5" />
  //                       Conversation History
  //                     </h3>
  //                   </div>

  //                   <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
  //                     {conversations.length === 0 || !conversations ? (
  //                       <p className="text-center text-slate-500 py-8">No conversation yet</p>
  //                     ) : (
  //                       conversations.map(conv => (
  //                         <div
  //                           key={conv.id}
  //                           className={`flex ${conv.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
  //                         >
  //                           <div
  //                             className={`max-w-[80%] rounded-xl px-4 py-3 ${
  //                               conv.sender === 'ai'
  //                                 ? 'bg-slate-100 text-slate-900'
  //                                 : 'bg-slate-900 text-white'
  //                             }`}
  //                           >
  //                             <p className="text-xs font-medium mb-1 opacity-70">
  //                               {conv.sender === 'ai' ? 'AI Assistant' : selectedLead.name}
  //                             </p>
  //                             <p className="text-sm whitespace-pre-wrap">{conv.message}</p>
  //                             <p className="text-xs mt-2 opacity-60">{formatDate(conv.created_at)}</p>
  //                           </div>
  //                         </div>
  //                       ))
  //                     )}
  //                   </div>
  //                 </div> */}
  //                 {/* Conversation History */}
  //                 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
  //                   <div className="p-4 border-b border-slate-200">
  //                     <h3 className="font-semibold text-slate-900 flex items-center gap-2">
  //                       <MessageSquare className="w-5 h-5" />
  //                       Conversation History
  //                     </h3>
  //                   </div>

  //                   <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
  //                     {(!conversations || !Array.isArray(conversations) || conversations.length === 0) ? (
  //                       <p className="text-center text-slate-500 py-8">No conversation yet</p>
  //                     ) : (
  //                       conversations.map(conv => (
  //                         <div
  //                           key={conv.id}
  //                           className={`flex ${conv.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
  //                         >
  //                           <div
  //                             className={`max-w-[80%] rounded-xl px-4 py-3 ${conv.sender === 'ai'
  //                               ? 'bg-slate-100 text-slate-900'
  //                               : 'bg-slate-900 text-white'
  //                               }`}
  //                           >
  //                             <p className="text-xs font-medium mb-1 opacity-70">
  //                               {conv.sender === 'ai' ? 'AI Assistant' : selectedLead.name}
  //                             </p>
  //                             <p className="text-sm whitespace-pre-wrap">{conv.message}</p>
  //                             <p className="text-xs mt-2 opacity-60">{formatDate(conv.created_at)}</p>
  //                           </div>
  //                         </div>
  //                       ))
  //                     )}
  //                   </div>
  //                 </div>
  //                 {/* Notes */}
  //                 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
  //                   <div className="p-4 border-b border-slate-200">
  //                     <h3 className="font-semibold text-slate-900">Agent Notes</h3>
  //                   </div>

  //                   <div className="p-4">
  //                     <div className="flex gap-2 mb-4">
  //                       <input
  //                         type="text"
  //                         value={newNote}
  //                         onChange={(e) => setNewNote(e.target.value)}
  //                         placeholder="Add a private note..."
  //                         className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
  //                         onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
  //                       />
  //                       <button
  //                         onClick={handleAddNote}
  //                         className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
  //                       >
  //                         Add Note
  //                       </button>
  //                     </div>

  //                     <div className="space-y-3">
  //                       {(!notes || !Array.isArray(notes) || notes.length === 0) ? (
  //                         <p className="text-center text-slate-500 py-4">No notes yet</p>
  //                       ) : (
  //                         notes.map(note => (
  //                           <div key={note.id} className="p-3 bg-slate-50 rounded-lg">
  //                             <p className="text-sm text-slate-900">{note.note}</p>
  //                             <p className="text-xs text-slate-500 mt-1">{formatDate(note.created_at)}</p>
  //                           </div>
  //                         ))
  //                       )}
  //                     </div>
  //                   </div>
  //                 </div>
  //                 {/* Notes
  //                 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
  //                   <div className="p-4 border-b border-slate-200">
  //                     <h3 className="font-semibold text-slate-900">Agent Notes</h3>
  //                   </div>

  //                   <div className="p-4">
  //                     <div className="flex gap-2 mb-4">
  //                       <input
  //                         type="text"
  //                         value={newNote}
  //                         onChange={(e) => setNewNote(e.target.value)}
  //                         placeholder="Add a private note..."
  //                         className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
  //                         onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
  //                       />
  //                       <button
  //                         onClick={handleAddNote}
  //                         className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
  //                       >
  //                         Add Note
  //                       </button>
  //                     </div>

  //                     <div className="space-y-3">
  //                       {notes.map(note => (
  //                         <div key={note.id} className="p-3 bg-slate-50 rounded-lg">
  //                           <p className="text-sm text-slate-900">{note.note}</p>
  //                           <p className="text-xs text-slate-500 mt-1">{formatDate(note.created_at)}</p>
  //                         </div>
  //                       ))}
  //                     </div>
  //                   </div>
  //                 </div> */}
  //               </div>
  //             ) : (
  //               <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
  //                 <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
  //                 <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Lead</h3>
  //                 <p className="text-slate-600">Choose a lead from the list to view details and conversation history</p>
  //               </div>
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
}