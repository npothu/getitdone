'use client'

import { useCedarTasks } from '../hooks/useCedarTasks'

interface CedarTaskDisplayProps {
  currentCycle: any
}

export default function CedarTaskDisplay({ currentCycle }: CedarTaskDisplayProps) {
  const { 
    cedarTasks, 
    toggleCedarTask, 
    deleteCedarTask,
    getTodaysTasks,
    getUpcomingCedarTasks
  } = useCedarTasks()

  const todaysTasks = getTodaysTasks()
  const upcomingTasks = getUpcomingCedarTasks().slice(0, 3)

  // Debug logs
  console.log('All Cedar tasks:', cedarTasks)
  console.log('Today\'s tasks:', todaysTasks)
  console.log('Upcoming tasks:', upcomingTasks)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    })
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800'
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (cedarTasks.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9] text-center">
        <div className="text-gray-500">No Cedar-scheduled tasks yet</div>
        <div className="text-sm text-gray-400 mt-1">Use the Cedar scheduler to get intelligent task recommendations</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {todaysTasks.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
          <h3 className="font-semibold text-gray-900 mb-4">Today's Cedar Tasks</h3>
          <div className="space-y-3">
            {todaysTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleCedarTask(task.id)}
                    className="w-5 h-5 text-rose-500 rounded border-gray-300 focus:ring-rose-400"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{task.text}</div>
                    {task.phase && (
                      <div className="text-sm text-gray-600">
                        Optimized for <span style={{ color: getPhaseColor(task.phase) }} className="font-medium">{task.phase} phase</span>
                      </div>
                    )}
                  </div>
                </div>
                {task.confidence && (
                  <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(task.confidence)}`}>
                    {Math.round(task.confidence * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
        <h3 className="font-semibold text-gray-900 mb-4">Upcoming Cedar-Scheduled Tasks</h3>
        
        {upcomingTasks.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No upcoming scheduled tasks
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingTasks.map(task => (
              <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:border-rose-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{task.text}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {task.scheduledDate && formatDate(task.scheduledDate)} • 
                      Cycle Day {task.cycleDay} • 
                      <span style={{ color: getPhaseColor(task.phase || '') }} className="font-medium ml-1">
                        {task.phase} phase
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.confidence && (
                      <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(task.confidence)}`}>
                        {Math.round(task.confidence * 100)}% match
                      </span>
                    )}
                    <button
                      onClick={() => deleteCedarTask(task.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove task"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {task.reasoning && task.reasoning.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    <div className="font-medium">Cedar reasoning:</div>
                    <div>{task.reasoning[0]}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{cedarTasks.length}</span> total Cedar tasks • 
            <span className="font-medium ml-1">{cedarTasks.filter(t => !t.completed).length}</span> pending • 
            <span className="font-medium ml-1">{cedarTasks.filter(t => (t.confidence || 0) > 0.8).length}</span> high-confidence matches
          </div>
        </div>
      </div>
    </div>
  )
}