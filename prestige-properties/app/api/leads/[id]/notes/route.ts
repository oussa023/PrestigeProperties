import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  try {
    // Await the params promise first
    const { id } = await params
    
    console.log('Fetching notes for lead:', id)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required', data: [] },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('notes')
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

export async function POST(
    request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    // Await the params promise first
    const { id } = await params
    const body = await request.json()
    
    console.log('Fetching notes for lead:', id)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required', data: [] },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
    .from('notes')
    .insert([
      {
        lead_id: id,
        note: body.note,
      },
    ])
    .select()
    .single()

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

// export async function POST(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   const body = await request.json()
  
//   const { data, error } = await supabase
//     .from('notes')
//     .insert([
//       {
//         lead_id: params.id,
//         note: body.note,
//       },
//     ])
//     .select()
//     .single()

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }

//   return NextResponse.json(data)
// }