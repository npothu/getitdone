'use client'

import { useState, useEffect } from 'react'

interface CedarTask {
  id: number
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
  created_at: string
  updated_at: string
}

export default function AllCedarTasks() {
  const [tasks, setTasks] = useState<CedarTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState<number | null>(null)

  useEffect(() => {
    fetchAllTasks()
  }, [])

  const fetchAllTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Create a custom API call to fetch ALL tasks
      const response = await fetch('/api/all-cedar-tasks')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setTasks(data.tasks)
        console.log('All Cedar tasks loaded:', data.tasks)
      } else {
        throw new Error(data.error || 'Failed to fetch tasks')
      }
    } catch (error) {
      console.error('Error fetching all tasks:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
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
        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, completed } : task
        ))
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
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString // Return original if parsing fails
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US')
    } catch {
      return dateString
    }
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

  const getTaskTypeIcon = (taskType: string) => {
    const icons = {
      creative: '🎨',
      presentation: '📊',
      detail: '🔍',
      planning: '📋',
      social: '👥',
      general: '📝'
    }
    return icons[taskType as keyof typeof icons] || '📝'
  }

  const isTaskUpcoming = (scheduledDate: string) => {
    const today = new Date()
    const taskDate = new Date(scheduledDate)
    return taskDate >= today
  }

  const categorizedTasks = {
    upcoming: tasks.filter(task => !task.completed && isTaskUpcoming(task.scheduled_date)),
    overdue: tasks.filter(task => !task.completed && !isTaskUpcoming(task.scheduled_date)),
    completed: tasks.filter(task => task.completed)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Cedar Tasks (Debug View)</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Cedar Tasks (Debug View)</h3>
        <div className="text-red-600 mb-4">
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={fetchAllTasks}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          All Cedar Tasks (Debug View)
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Total: {tasks.length}</span>
          <button 
            onClick={fetchAllTasks}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <div>No Cedar tasks found in database</div>
          <div className="text-sm text-gray-400 mt-1">
            Try creating a task to see if it appears here
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          {categorizedTasks.upcoming.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-3">
                Upcoming Tasks ({categorizedTasks.upcoming.length})
              </h4>
              <div className="space-y-3">
                {categorizedTasks.upcoming.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    showDetails={showDetails}
                    setShowDetails={setShowDetails}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteTask}
                    formatDate={formatDate}
                    formatDateTime={formatDateTime}
                    getPhaseColor={getPhaseColor}
                    getTaskTypeIcon={getTaskTypeIcon}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Overdue Tasks */}
          {categorizedTasks.overdue.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-3">
                Overdue Tasks ({categorizedTasks.overdue.length})
              </h4>
              <div className="space-y-3">
                {categorizedTasks.overdue.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    showDetails={showDetails}
                    setShowDetails={setShowDetails}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteTask}
                    formatDate={formatDate}
                    formatDateTime={formatDateTime}
                    getPhaseColor={getPhaseColor}
                    getTaskTypeIcon={getTaskTypeIcon}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {categorizedTasks.completed.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-600 mb-3">
                Completed Tasks ({categorizedTasks.completed.length})
              </h4>
              <div className="space-y-3">
                {categorizedTasks.completed.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    showDetails={showDetails}
                    setShowDetails={setShowDetails}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteTask}
                    formatDate={formatDate}
                    formatDateTime={formatDateTime}
                    getPhaseColor={getPhaseColor}
                    getTaskTypeIcon={getTaskTypeIcon}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Separate TaskCard component to avoid repetition
function TaskCard({ 
  task, 
  showDetails, 
  setShowDetails, 
  onToggleComplete, 
  onDelete,
  formatDate,
  formatDateTime,
  getPhaseColor,
  getTaskTypeIcon
}: {
  task: CedarTask
  showDetails: number | null
  setShowDetails: (id: number | null) => void
  onToggleComplete: (id: number, completed: boolean) => void
  onDelete: (id: number) => void
  formatDate: (date: string) => string
  formatDateTime: (date: string) => string
  getPhaseColor: (phase: string) => string
  getTaskTypeIcon: (type: string) => string
}) {
  const isOverdue = !task.completed && new Date(task.scheduled_date) < new Date()
  
  return (
    <div className={`border rounded-lg p-4 ${
      task.completed ? 'border-gray-200 bg-gray-50' : 
      isOverdue ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getTaskTypeIcon(task.task_type)}</span>
            <h4 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h4>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {Math.round(task.confidence * 100)}% match
            </span>
            {task.completed && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Completed
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <span>{formatDate(task.scheduled_date)}</span>
            <span>
              Day {task.cycle_day} - 
              <span style={{ color: getPhaseColor(task.phase) }} className="font-medium ml-1">
                {task.phase} phase
              </span>
            </span>
            <span className="capitalize">{task.task_type}</span>
            <span>Energy: {task.energy_required}</span>
          </div>

          <div className="text-xs text-gray-500">
            Created: {formatDateTime(task.created_at)} | Updated: {formatDateTime(task.updated_at)}
          </div>

          {showDetails === task.id && (
            <div className="mt-3 p-3 bg-white rounded border text-sm">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div><strong>Focus Required:</strong> {task.focus_required}</div>
                <div><strong>Task ID:</strong> {task.id}</div>
              </div>
              
              {task.reasoning.length > 0 && (
                <div className="mb-2">
                  <strong>AI Reasoning:</strong>
                  <ul className="list-disc list-inside ml-2 text-gray-600">
                    {task.reasoning.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {task.optimization_tips.length > 0 && (
                <div className="mb-2">
                  <strong>Optimization Tips:</strong>
                  <ul className="list-disc list-inside ml-2 text-blue-600">
                    {task.optimization_tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {task.alternatives.length > 0 && (
                <div className="mb-2">
                  <strong>Alternatives:</strong> {task.alternatives.length} options
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setShowDetails(showDetails === task.id ? null : task.id)}
            className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
          >
            {showDetails === task.id ? 'Hide' : 'Details'}
          </button>
          
          {!task.completed && (
            <button
              onClick={() => onToggleComplete(task.id, true)}
              className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Complete
            </button>
          )}
          
          {task.completed && (
            <button
              onClick={() => onToggleComplete(task.id, false)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Reopen
            </button>
          )}
          
          <button
            onClick={() => onDelete(task.id)}
            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}