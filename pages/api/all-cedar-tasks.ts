import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('=== ALL CEDAR TASKS API CALLED ===')
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client initialized')

    // Fetch ALL tasks without any filters to debug
    console.log('Fetching all Cedar tasks...')
    const { data, error } = await supabase
      .from('cedar_tasks')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Query executed')
    console.log('Error:', error)
    console.log('Data length:', data?.length || 0)
    console.log('First task:', data?.[0])

    if (error) {
      console.error('Supabase query error:', error)
      return res.status(500).json({
        success: false,
        error: `Database query failed: ${error.message}`,
        details: error
      })
    }

    console.log(`Successfully retrieved ${data?.length || 0} tasks`)
    
    res.status(200).json({
      success: true,
      tasks: data || [],
      count: data?.length || 0,
      debug: {
        supabaseUrl: supabaseUrl,
        hasApiKey: !!supabaseKey,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all Cedar tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}