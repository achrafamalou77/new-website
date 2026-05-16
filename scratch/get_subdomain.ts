import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getSubdomain() {
  const { data, error } = await supabase.from('agencies').select('subdomain').limit(1).single()
  if (error) {
    console.error('Error fetching agency:', error)
    process.exit(1)
  }
  console.log('SUBDOMAIN:', data.subdomain)
}

getSubdomain()
