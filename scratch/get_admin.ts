import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function getAdmin() {
  const { data: agency } = await supabase.from('agencies').select('id').eq('subdomain', 'ephedia').single()
  if (!agency) {
    console.error('Agency not found')
    return
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('agency_id', agency.id)
    .eq('role', 'superadmin')
    .limit(1)
    .single()
    
  if (!profile) {
    console.error('Admin profile not found')
    return
  }
  
  const { data: user } = await supabase.auth.admin.getUserById(profile.id)
  console.log('ADMIN_EMAIL:', user.user?.email)
}

getAdmin()
