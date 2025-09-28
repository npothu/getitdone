import type { NextApiRequest, NextApiResponse } from 'next'
import { getUpcomingCedarTasks, updateTaskCompletion, deleteCedarTask } from '../../src/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get upcoming tasks
      const tasks = await getUpcomingCedarTasks()
      res.status(200).json({
        success: true,
        tasks
      })
    } 
    else if (req.method === 'PATCH') {
      // Update task completion
      const { taskId, completed } = req.body
      
      if (!taskId || typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'taskId and completed status required' })
      }
      
      await updateTaskCompletion(taskId, completed)
      res.status(200).json({ success: true })
    }
    else if (req.method === 'DELETE') {
      // Delete task
      const { taskId } = req.body
      
      if (!taskId) {
        return res.status(400).json({ error: 'taskId required' })
      }
      
      await deleteCedarTask(taskId)
      res.status(200).json({ success: true })
    }
    else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Cedar tasks API error:', error)
    res.status(500).json({
      success: false,
      error: 'Database operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}