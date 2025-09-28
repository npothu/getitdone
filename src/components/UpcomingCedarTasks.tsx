'use client'

import { useState, useEffect } from 'react'

interface CedarTask {
  id: number
  title: string
  task_type: string
  scheduled_date: string
  cycle_day: number
  phase: string
  confidence: number
  reasoning: string[]
  optimization_tips: string[]
  completed: boolean
  short_summary?: string // Add this field
}

interface UpcomingCedarTasksProps {
  refreshTrigger?: number
}

export default function UpcomingCedarTasks({ refreshTrigger }: UpcomingCedarTasksProps) {
  const [tasks, setTasks] = useState<CedarTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [refreshTrigger])

  // Listen for task addition events to refresh the list
  useEffect(() => {
    const handleTaskAdded = () => {
      console.log('Cedar task added event received, refreshing...')
      fetchTasks()
    }
    
    window.addEventListener('cedarTaskAdded', handleTaskAdded)
    
    return () => {
      window.removeEventListener('cedarTaskAdded', handleTaskAdded)
    }
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/cedar-tasks')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Filter tasks to show only next 3 days
          const today = new Date()
          const threeDaysFromNow = new Date(today)
          threeDaysFromNow.setDate(today.getDate() + 3)
          
          const filteredTasks = data.tasks.filter((task: CedarTask) => {
            const taskDate = new Date(task.scheduled_date)
            return taskDate >= today && taskDate <= threeDaysFromNow
          })
          
          setTasks(filteredTasks)
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    try {
      const response = await fetch('/api/cedar-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed })
      })

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch('/api/cedar-tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isTaskToday = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getPhaseColor = (phase: string) => {
    const colors = {
      menstrual: '#ef4444',
      follicular: '#10b981',
      ovulatory: '#f59e0b',
      luteal: '#8b5cf6'
    }
    return colors[phase as keyof typeof colors] || '#6b7280'
  }

  const getHighConfidenceCount = () => {
    return tasks.filter(task => task.confidence >= 0.8).length
  }

  const condenseReasoning = (reasoning: string) => {
    // Create a concise summary of the original Gemini AI reasoning
    if (!reasoning || reasoning.trim().length === 0) {
      return 'AI-optimized timing for your cycle phase'
    }
    
    // Extract key concepts from the original reasoning
    let condensed = reasoning
      .replace(/^(During the|In the|The|This is because|Since|As|When)/i, '') // Remove common starting phrases
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    // If it's already short enough (under 80 chars), return it
    if (condensed.length <= 80) {
      return condensed
    }
    
    // Try to extract the most important part - usually the first sentence or main clause
    const sentences = condensed.split(/[.!?]+/).filter(s => s.trim().length > 10)
    if (sentences.length > 0) {
      let firstSentence = sentences[0].trim()
      
      // If first sentence is still too long, try to extract the main clause
      if (firstSentence.length > 80) {
        // Look for key connecting words to split on
        const splitWords = [', which', ', leading to', ', resulting in', ' because', ' since', ' as']
        for (const word of splitWords) {
          if (firstSentence.includes(word)) {
            const parts = firstSentence.split(word)
            if (parts[0].trim().length > 20 && parts[0].trim().length <= 80) {
              firstSentence = parts[0].trim()
              break
            }
          }
        }
        
        // If still too long, truncate intelligently
        if (firstSentence.length > 80) {
          const words = firstSentence.split(' ')
          let truncated = ''
          for (const word of words) {
            if ((truncated + ' ' + word).length > 75) break
            truncated += (truncated ? ' ' : '') + word
          }
          firstSentence = truncated + '...'
        }
      }
      
      return firstSentence
    }
    
    // Fallback: truncate at word boundary
    const words = condensed.split(' ')
    let result = ''
    for (const word of words) {
      if ((result + ' ' + word).length > 75) break
      result += (result ? ' ' : '') + word
    }
    
    return result + (result.length < condensed.length ? '...' : '')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Cedar-scheduled Tasks</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upcoming Cedar-scheduled Tasks
      </h3>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📅</div>
          <div>No Cedar tasks in the next 3 days</div>
          <div className="text-sm text-gray-400 mt-1">
            Use the AI scheduler to create cycle-optimized tasks
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Task List */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const isTodayTask = isTaskToday(task.scheduled_date)
              
              return (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-rose-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {Math.round(task.confidence * 100)}% match
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {formatDate(task.scheduled_date)} • Cycle Day {task.cycle_day} • <span style={{ color: getPhaseColor(task.phase) }} className="font-medium">{task.phase} phase</span>
                      </div>

                      <div className="text-sm text-gray-600">
                        <strong>Cedar reasoning:</strong><br />
                        {task.short_summary || task.reasoning[0] || 'AI-optimized timing for your cycle phase'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {isTodayTask && (
                        <span className="text-sm text-orange-600 font-medium">
                          Today's priority
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleComplete(task.id, true)}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="text-sm text-gray-600 pt-4 border-t border-gray-200">
            {tasks.length} total Cedar task{tasks.length !== 1 ? 's' : ''} • {tasks.length} pending • {getHighConfidenceCount()} high-confidence match{getHighConfidenceCount() !== 1 ? 'es' : ''}
          </div>
        </div>
      )}
    </div>
  )
}