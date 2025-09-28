// test-supabase.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testSupabase() {
  try {
    // Test connection
    const { data, error } = await supabase
      .from('cedar_tasks')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase error:', error)
    } else {
      console.log('✓ Supabase connected successfully!')
      console.log('Current task count:', data)
    }
  } catch (error) {
    console.error('Connection failed:', error)
  }
}

testSupabase()