'use client'

import { useState } from 'react'
import { getCurrentCycleInfo, getTaskOptimalPhase, getOptimalPhaseInfo, isOptimalTiming } from '../lib/utils'

export default function Dashboard() {
  // Real cycle data - in production this would come from user input
  const lastPeriodDate = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) // 12 days ago
  const currentCycle = getCurrentCycleInfo(lastPeriodDate, 28)
  
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Task A (label)', completed: false },
    { id: 2, text: 'Task B (label)', completed: false },
    { id: 3, text: 'Complete 3rd quarterly report', completed: false },
    { id: 4, text: 'Prepare presentation slides', completed: false },
  ])

  const [newTask, setNewTask] = useState('')

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }


  const addTask = () => {
    if (newTask.trim()) {
      const optimalPhase = getTaskOptimalPhase(newTask);
      const isOptimal = isOptimalTiming(newTask, currentCycle.phase);
      
      setTasks([...tasks, { 
        id: Date.now(), 
        text: newTask, 
        completed: false 
      }])
      setNewTask('')
      
      // Optional: Show a quick notification about optimal timing
      if (!isOptimal) {
        const phaseInfo = getOptimalPhaseInfo(optimalPhase);
        console.log(`Tip: "${newTask}" would be optimal during ${phaseInfo.name} phase`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Get it done.</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Cycle Visualization */}
          <div className="space-y-6">
            {/* Cycle Wheel */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-center mb-4">
                <div className="w-48 h-48 relative">
                  {/* Cycle Circle */}
                  <div className="w-full h-full border-4 border-gray-200 rounded-full relative">
                    {/* Current phase indicator - blue dot */}
                    <div className="absolute w-4 h-4 rounded-full" 
                    style={{ backgroundColor: currentCycle.phaseColor, top: '20%', left: '60%' }}>
                    </div>
                    {/* Dashed line to center */}
                    <div className="absolute top-1/2 left-1/2 w-16 h-0 border-t-2 border-dashed border-blue-500 transform -translate-x-full -translate-y-1/2 rotate-[-30deg]">
                    </div>
                  </div>
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">Day {currentCycle.cycleDay}</div>
                    <div className="text-sm text-gray-600">{currentCycle.phaseName}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Phase info */}
              <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-2">{currentCycle.phaseName}</div>
              <div className="text-sm text-gray-600 mb-4">{currentCycle.description}</div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-800">Optimal for today:</div>
                  <div className="text-sm text-orange-700">{currentCycle.optimalTasks.join(', ')}</div>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
              
              {/* Task List */}
              <div className="space-y-3 mb-4">
  {tasks.map(task => {
    const optimalPhase = getTaskOptimalPhase(task.text);
    const phaseInfo = getOptimalPhaseInfo(optimalPhase);
    const isOptimal = isOptimalTiming(task.text, currentCycle.phase);
    
    return (
      <div key={task.id} className={`p-3 rounded-lg border-2 ${isOptimal ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTask(task.id)}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.text}
          </span>
          <div className="flex items-center space-x-2">
            {isOptimal ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                ✨ Optimal Now
              </span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-full font-medium" 
                    style={{ backgroundColor: phaseInfo.color + '20', color: phaseInfo.color }}>
                {phaseInfo.emoji} Best in {phaseInfo.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  })}
</div>

{/* Task Category Helper */}
<div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="text-sm font-medium text-blue-800 mb-2">Quick task ideas for your current phase:</div>
  <div className="flex flex-wrap gap-2">
    {currentCycle.optimalTasks.map((task, index) => (
      <button
        key={index}
        onClick={() => setNewTask(task)}
        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
      >
        + {task}
      </button>
    ))}
  </div>
</div>

              {/* Add Task */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <button
                  onClick={addTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Task
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Logging History */}
<div className="space-y-6">
  {/* Today's Focus */}
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Focus</h2>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="font-medium" style={{ color: currentCycle.phaseColor }}>Day {currentCycle.cycleDay} - {currentCycle.phaseName}</div>
      <div className="text-sm mt-1" style={{ color: currentCycle.phaseColor }}>
        {currentCycle.description}
      </div>
    </div>
    
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Energy Level:</span>
        <span className="font-medium">Rising</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Best For:</span>
        <span className="font-medium">Creative work</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Next Phase:</span>
        <span className="font-medium">Ovulatory (5 days)</span>
      </div>
    </div>
  </div>

  {/* Daily Logs */}
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Logs</h2>
    
    {/* Logging History */}
    <div className="space-y-3 mb-4">
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-gray-900">Day {currentCycle.cycleDay} - {currentCycle.phaseName}</span>
          <span className="text-xs text-gray-500">Today</span>
        </div>
        <div className="text-sm text-gray-600">Energy: ⭐⭐⭐⭐ | Mood: 😊</div>
        <div className="text-xs text-gray-500 mt-1">Feeling productive and creative today</div>
      </div>
      
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-gray-900">Day {currentCycle.cycleDay - 1} - {currentCycle.phaseName}</span>
          <span className="text-xs text-gray-500">Yesterday</span>
        </div>
        <div className="text-sm text-gray-600">Energy: ⭐⭐⭐ | Mood: 😐</div>
        <div className="text-xs text-gray-500 mt-1">Started new project, feeling motivated</div>
      </div>
      
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-gray-900">Day {currentCycle.cycleDay - 2} - {currentCycle.phaseName}</span>
          <span className="text-xs text-gray-500">2 days ago</span>
        </div>
        <div className="text-sm text-gray-600">Energy: ⭐⭐ | Mood: 😔</div>
        <div className="text-xs text-gray-500 mt-1">Low energy, took it easy</div>
      </div>
    </div>

    {/* Add Log Button */}
    <button 
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      + Log Today
    </button>
  </div>
</div>
    </div>
    </div>
    </div>
)
}