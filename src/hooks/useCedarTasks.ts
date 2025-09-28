// src/hooks/useCedarTasks.ts
import { useState, useCallback, useEffect } from 'react'

interface CedarTask {
  id: number
  text: string
  completed: boolean
  scheduledDate?: Date | string
  cycleDay?: number
  phase?: string
  confidence?: number
  reasoning?: string[]
  constraints?: any
  source: 'manual' | 'cedar-scheduled'
  createdAt: Date | string
}

export function useCedarTasks() {
  const [cedarTasks, setCedarTasks] = useState<CedarTask[]>([])
  const [loading, setLoading] = useState(false)

  // Function to fetch tasks from database/API
  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Attempting to fetch Cedar tasks...')
      
      // Replace with your actual API endpoint
      const response = await fetch('/api/cedar-tasks')
      console.log('API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        if (data.success && Array.isArray(data.tasks)) {
          // Transform API data to match our interface
          const transformedTasks = data.tasks.map((task: any) => {
            // Map task_type to cycle phase
            const mapTaskTypeToPhase = (taskType: string) => {
              const type = String(taskType).toLowerCase()
              switch (type) {
                case 'planning':
                case 'general':
                  return 'follicular'
                case 'presentation':
                case 'collaboration':
                  return 'ovulatory'
                case 'detail':
                case 'accounting':
                  return 'luteal'
                case 'reflection':
                case 'journaling':
                  return 'menstrual'
                default:
                  return 'follicular' // Default fallback
              }
            }

            return {
              id: task.id,
              text: task.title || task.text || 'Untitled Task',
              completed: task.completed || false,
              scheduledDate: task.scheduledDate || task.scheduled_date || new Date().toISOString(),
              cycleDay: task.cycleDay || task.cycle_day || Math.floor(Math.random() * 28) + 1, // Temporary random day
              phase: mapTaskTypeToPhase(task.task_type),
              confidence: task.confidence || 0.8,
              reasoning: task.reasoning || [],
              constraints: task.constraints,
              source: task.source || 'cedar-scheduled',
              createdAt: task.createdAt || task.created_at || new Date()
            }
          })
          
          setCedarTasks(transformedTasks)
          console.log('Set Cedar tasks:', transformedTasks)
        } else {
          console.log('Invalid API response format or no tasks')
        }
      } else {
        console.error('API request failed:', response.statusText)
        // If API fails, keep existing tasks (don't clear them)
      }
    } catch (error) {
      console.error('Error fetching Cedar tasks:', error)
      // If API fails, keep existing tasks (don't clear them)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load tasks on mount
  useEffect(() => {
    refreshTasks()
  }, [refreshTasks])

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
      source: taskData.source || 'cedar-scheduled',
      createdAt: new Date()
    }
    
    setCedarTasks(prev => [newTask, ...prev])
  }, [])

  const toggleCedarTask = useCallback(async (taskId: number) => {
  console.log('Toggling task:', taskId)
  
  try {
    // Find the current task to get its current state
    const currentTask = cedarTasks.find(t => t.id === taskId)
    if (!currentTask) {
      console.error('Task not found:', taskId)
      return
    }

    console.log('Current task state:', currentTask.completed)
    
    // Optimistic update
    setCedarTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))

    // Try to match your API endpoint format
    // Option 1: PUT request to update the task
    const response = await fetch(`/api/cedar-tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        completed: !currentTask.completed 
      })
    })

    if (!response.ok) {
      console.error('API call failed with status:', response.status)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      
      // Revert the optimistic update
      setCedarTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ))
    } else {
      console.log('Task toggled successfully')
    }
  } catch (error) {
    console.error('Network error toggling task:', error)
    
    // Revert the optimistic update
    setCedarTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }
}, [cedarTasks])

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
    today.setHours(0, 0, 0, 0)
    
    return cedarTasks
      .filter(task => !task.completed && task.scheduledDate)
      .filter(task => {
        const taskDate = new Date(task.scheduledDate!)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate >= today
      })
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
  }, [cedarTasks])

  const getHighConfidenceTasks = useCallback(() => {
    return cedarTasks.filter(task => (task.confidence || 0) > 0.8)
  }, [cedarTasks])

  const getTodaysTasks = useCallback(() => {
    const today = new Date()
    const todayStr = today.toDateString()
    return cedarTasks.filter(task => 
      task.scheduledDate && 
      new Date(task.scheduledDate).toDateString() === todayStr &&
      !task.completed
    )
  }, [cedarTasks])

  return {
    cedarTasks,
    loading,
    addCedarTask,
    toggleCedarTask,
    deleteCedarTask,
    rescheduleCedarTask,
    getCedarTasksBySource,
    getUpcomingCedarTasks,
    getHighConfidenceTasks,
    getTodaysTasks,
    refreshTasks
  }
}