import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client - try service role key first (bypasses RLS), fallback to anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, name, phone, email } = body

    console.log('Create lead API called:', { taskId, name, phone, email })

    if (!taskId || !phone) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'taskId and phone are required'
      }, { status: 400 })
    }

    // First, check if a lead already exists for this task with the same email or phone
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, name, email, phone')
      .eq('task_id', taskId)
      .or(`email.eq.${email || ''},phone.eq.${phone}`)
      .maybeSingle()

    if (existingLead) {
      console.log('Found existing lead:', existingLead)
      // Update the existing lead with latest info
      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update({
          name: name || existingLead.name,
          email: email || existingLead.email,
          phone: phone,
        })
        .eq('id', existingLead.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating lead:', updateError)
        // Return existing lead even if update failed
        return NextResponse.json({ 
          success: true,
          lead: existingLead,
          wasUpdated: false
        })
      }
      
      console.log('Updated existing lead:', updatedLead)
      return NextResponse.json({ 
        success: true,
        lead: updatedLead,
        wasUpdated: true
      })
    }

    // Create new lead
    console.log('Creating new lead:', { task_id: taskId, name, phone, email })
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        task_id: taskId,
        phone: phone,
        name: name || null,
        email: email || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json({ 
        error: 'Failed to create lead',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    console.log('Successfully created lead:', lead)
    return NextResponse.json({ 
      success: true,
      lead: lead,
      wasUpdated: false
    })

  } catch (error) {
    console.error('Create lead API error:', error)
    return NextResponse.json({
      error: 'Failed to create lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
