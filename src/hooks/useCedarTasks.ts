// src/hooks/useCedarTasks.ts
import { useState, useCallback } from 'react'

interface CedarTask {
  id: number
  text: string
  completed: boolean
  scheduledDate?: Date
  cycleDay?: number
  phase?: string
  confidence?: number
  reasoning?: string[]
  constraints?: any
  source: 'manual' | 'cedar-scheduled'
  createdAt: Date
}

export function useCedarTasks() {
  const [cedarTasks, setCedarTasks] = useState<CedarTask[]>([
    // Sample data to show functionality
    {
      id: 1,
      text: 'Review quarterly metrics',
      completed: false,
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      cycleDay: 15,
      phase: 'luteal',
      confidence: 0.92,
      reasoning: ['Detail work optimized during luteal phase for enhanced focus'],
      source: 'cedar-scheduled',
      createdAt: new Date()
    }
  ])

  const addCedarTask = useCallback((taskData: any) => {
    const newTask: CedarTask = {
      id: taskData.id || Date.now(),
      text: taskData.text,
      completed: false,
      scheduledDate: taskData.scheduledDate,
      cycleDay: taskData.cycleDay,
      phase: taskData.phase,
      confidence: taskData.confidence,
      reasoning: taskData.reasoning,
      constraints: taskData.constraints,
      source: taskData.source || 'manual',
      createdAt: new Date()
    }
    
    setCedarTasks(prev => [newTask, ...prev])
  }, [])

  const toggleCedarTask = useCallback((taskId: number) => {
    setCedarTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }, [])

  const deleteCedarTask = useCallback((taskId: number) => {
    setCedarTasks(prev => prev.filter(task => task.id !== taskId))
  }, [])

  const rescheduleCedarTask = useCallback((taskId: number, newDate: Date, newCycleInfo?: any) => {
    setCedarTasks(prev => prev.map(task =>
      task.id === taskId 
        ? { 
            ...task, 
            scheduledDate: newDate,
            cycleDay: newCycleInfo?.cycleDay,
            phase: newCycleInfo?.phase
          } 
        : task
    ))
  }, [])

  const getCedarTasksBySource = useCallback((source: 'manual' | 'cedar-scheduled') => {
    return cedarTasks.filter(task => task.source === source)
  }, [cedarTasks])

  const getUpcomingCedarTasks = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for comparison
    
    return cedarTasks
      .filter(task => !task.completed && task.scheduledDate)
      .filter(task => {
        const taskDate = new Date(task.scheduledDate!)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate >= today
      })
      .sort((a, b) => a.scheduledDate!.getTime() - b.scheduledDate!.getTime())
  }, [cedarTasks])

  const getHighConfidenceTasks = useCallback(() => {
    return cedarTasks.filter(task => (task.confidence || 0) > 0.8)
  }, [cedarTasks])

  const getTodaysTasks = useCallback(() => {
    const today = new Date()
    const todayStr = today.toDateString()
    return cedarTasks.filter(task => 
      task.scheduledDate && 
      task.scheduledDate.toDateString() === todayStr &&
      !task.completed
    )
  }, [cedarTasks])

  return {
    cedarTasks,
    addCedarTask,
    toggleCedarTask,
    deleteCedarTask,
    rescheduleCedarTask,
    getCedarTasksBySource,
    getUpcomingCedarTasks,
    getHighConfidenceTasks,
    getTodaysTasks
  }
}