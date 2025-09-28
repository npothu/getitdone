import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Initialize Supabase client
let supabase: SupabaseClient | null = null

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}

export interface CedarTask {
  id?: number
  title: string
  task_type: string
  energy_required: string
  focus_required: string
  scheduled_date: string
  cycle_day: number
  phase: string
  confidence: number
  reasoning: string[]
  optimization_tips: string[]
  alternatives: any[]
  constraints: any
  completed: boolean
  created_at?: string
  updated_at?: string
  short_summary?: string // Add this
}

export async function saveCedarTask(task: Omit<CedarTask, 'id' | 'created_at' | 'updated_at'>): Promise<CedarTask> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('cedar_tasks')
    .insert([
      {
        title: task.title,
        task_type: task.task_type,
        energy_required: task.energy_required,
        focus_required: task.focus_required,
        scheduled_date: task.scheduled_date,
        cycle_day: task.cycle_day,
        phase: task.phase,
        confidence: task.confidence,
        reasoning: task.reasoning,
        optimization_tips: task.optimization_tips,
        alternatives: task.alternatives,
        constraints: task.constraints,
        completed: task.completed
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    throw new Error(`Failed to save task: ${error.message}`)
  }

  return data
}

export async function getUpcomingCedarTasks(limit = 10): Promise<CedarTask[]> {
  const supabase = getSupabaseClient()
  
  // Debug: Check what today's date looks like
  const today = new Date().toISOString().split('T')[0]
  console.log('Today for query:', today)
  
  const { data, error } = await supabase
    .from('cedar_tasks')
    .select('*')
    .eq('completed', false)
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit)

  console.log('Supabase query result:', { data, error })
  console.log('Number of tasks found:', data?.length || 0)

  if (error) {
    console.error('Supabase select error:', error)
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return data || []
}

export async function updateTaskCompletion(taskId: number, completed: boolean): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('cedar_tasks')
    .update({ 
      completed: completed,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)

  if (error) {
    console.error('Supabase update error:', error)
    throw new Error(`Failed to update task: ${error.message}`)
  }
}

export async function deleteCedarTask(taskId: number): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('cedar_tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Supabase delete error:', error)
    throw new Error(`Failed to delete task: ${error.message}`)
  }
}