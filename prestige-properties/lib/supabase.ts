import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  budget: number | null
  timeline: string | null
  working_with_agent: boolean | null
  status: string
  is_vip: boolean
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  lead_id: string
  message: string
  sender: 'ai' | 'lead'
  created_at: string
}

export interface Note {
  id: string
  lead_id: string
  note: string
  created_at: string
}