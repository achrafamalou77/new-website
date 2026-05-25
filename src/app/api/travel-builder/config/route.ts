import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile || !(profile as any).agency_id) {
      return NextResponse.json({ error: 'Agency profile not found' }, { status: 404 })
    }

    const { data: config, error } = await (supabase
      .from('website_configs') as any)
      .select('*')
      .eq('agency_id', (profile as any).agency_id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ config: config || null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile || !(profile as any).agency_id) {
      return NextResponse.json({ error: 'Agency profile not found' }, { status: 404 })
    }

    const body = await request.json()
    if (!body || !body.sections) {
      return NextResponse.json({ error: 'Invalid configuration data' }, { status: 400 })
    }

    const { error } = await (supabase
      .from('website_configs') as any)
      .update({
        builder_data: body,
        updated_at: new Date().toISOString()
      } as any)
      .eq('agency_id', (profile as any).agency_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
