import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function addTrip() {
  const agencyId = '902f4b1a-be6d-4c70-945f-20aa9ed059a8'
  const { error } = await s.from('trips').insert({
    agency_id: agencyId,
    title: 'Istanbul Magic',
    description: 'Explore the historic streets of Istanbul, from the Blue Mosque to the Grand Bazaar.',
    price: 85000,
    destination: 'Turkey',
    duration_days: 7,
    image_urls: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&auto=format&fit=crop&q=80'],
    is_active: true
  })
  if (error) console.error(error)
  else console.log('Trip added successfully')
}

addTrip()
