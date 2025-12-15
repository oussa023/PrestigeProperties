// utils/n8n.ts
export interface LeadData {
  name: string;
  phone: string;
  email?: string;
  budget?: number;
  timeline?: string;
  is_vip?: boolean;
  notes?: string;
  source?: string;
}

export async function createLeadViaN8N(leadData: LeadData) {
  // Update this URL with your actual n8n webhook URL
  const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/create-lead';
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending to n8n:', error);
    throw error;
  }
}

// Pre-defined test leads for quick add
export const testLeads = [
  {
    name: 'John Smith',
    phone: '+15551234567',
    email: 'john.smith@example.com',
    budget: 500000,
    timeline: 'immediate',
    is_vip: true,
    source: 'dashboard_quick_add',
    notes: 'Added via quick add button'
  },
  {
    name: 'Sarah Johnson',
    phone: '+15559876543',
    email: 'sarah.j@example.com',
    budget: 750000,
    timeline: '3-6_months',
    is_vip: false,
    source: 'dashboard_quick_add',
    notes: 'Added via quick add button'
  },
  {
    name: 'Michael Chen',
    phone: '+15555555555',
    email: 'michael.c@example.com',
    budget: 1200000,
    timeline: '6-12_months',
    is_vip: true,
    source: 'dashboard_quick_add',
    notes: 'Added via quick add button'
  },
  {
    name: 'Emily Williams',
    phone: '+15556667777',
    email: 'emily.w@example.com',
    budget: 300000,
    timeline: 'immediate',
    is_vip: false,
    source: 'dashboard_quick_add',
    notes: 'Added via quick add button'
  },
  {
    name: 'David Brown',
    phone: '+15558889999',
    email: 'david.b@example.com',
    budget: 950000,
    timeline: '3-6_months',
    is_vip: true,
    source: 'dashboard_quick_add',
    notes: 'Added via quick add button'
  },
];