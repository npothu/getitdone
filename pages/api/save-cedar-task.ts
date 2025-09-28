import type { NextApiRequest, NextApiResponse } from 'next'
import { saveCedarTask } from '../../src/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const taskData = req.body
    
    // Validate required fields
    const requiredFields = ['title', 'task_type', 'energy_required', 'focus_required', 'scheduled_date', 'cycle_day', 'phase', 'confidence']
    for (const field of requiredFields) {
      if (!taskData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` })
      }
    }

    // Save to database
    const savedTask = await saveCedarTask({
      title: taskData.title,
      task_type: taskData.task_type,
      energy_required: taskData.energy_required,
      focus_required: taskData.focus_required,
      scheduled_date: taskData.scheduled_date,
      cycle_day: taskData.cycle_day,
      phase: taskData.phase,
      confidence: taskData.confidence,
      reasoning: taskData.reasoning || [],
      optimization_tips: taskData.optimization_tips || [],
      alternatives: taskData.alternatives || [],
      constraints: taskData.constraints || {},
      completed: false
    })

    res.status(201).json({
      success: true,
      task: savedTask
    })

  } catch (error) {
    console.error('Error saving Cedar task:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to save task',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}