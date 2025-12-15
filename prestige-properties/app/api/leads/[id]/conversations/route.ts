import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // params is now a Promise
) {
  try {
    // Await the params promise first
    const { id } = await params
    
    console.log('Fetching conversations for lead:', id)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required', data: [] },
        { status: 400 }
      )
    }
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', data: [] }, { status: 500 })
  }
}
// export async function GET(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   const { data, error } = await supabase
//     .from('conversations')
//     .select('*')
//     .eq('lead_id', params.id)
//     .order('created_at', { ascending: true })
//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }

//   return NextResponse.json(data)
// }


// export async function GET(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   console.log('Route accessed with id:', params.id)
  
//   // Return test data first
//   return NextResponse.json([
//     { id: 1, message: 'Test message 1', sender: 'ai' },
//     { id: 2, message: 'Test message 2', sender: 'user' },
//   ])
// }