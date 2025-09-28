'use client'

import { useState, useEffect } from 'react'
import { getCurrentCycleInfo, getCyclePhase } from '../lib/utils'

// Cedar WASM integration
let cedarEngine: any = null

const initializeCedar = async () => {
  if (cedarEngine) return cedarEngine
  
  try {
    const { isAuthorized } = await import('@cedar-policy/cedar-wasm')
    cedarEngine = { isAuthorized }
    return cedarEngine
  } catch (error) {
    console.error('Failed to load Cedar WASM:', error)
    return null
  }
}

interface TaskConstraints {
  description: string
  dueDate?: Date
  availableDays: string[]
  taskType: 'creative' | 'presentation' | 'detail' | 'planning' | 'social' | 'general'
  energyRequired: 'low' | 'medium' | 'high'
  focusRequired: 'low' | 'medium' | 'high'
  flexibilityDays: number
}

interface SchedulingSuggestion {
  suggestedDate: Date
  cycleDay: number
  phase: string
  confidence: number
  reasoning: string[]
  policyResults: any[]
  alternatives: Array<{
    date: Date
    cycleDay: number
    phase: string
    confidence: number
    reason: string
  }>
  optimizationTips?: string[]
  shortSummary?: string
}

class MastraGeminiScheduler {
  async evaluateTaskScheduling(
    constraints: TaskConstraints,
    currentCycleInfo: any,
    cycleLength: number = 28
  ): Promise<SchedulingSuggestion> {
    
    const agentInput = {
      taskDescription: constraints.description,
      taskType: constraints.taskType,
      energyRequired: constraints.energyRequired,
      focusRequired: constraints.focusRequired,
      currentCycleDay: currentCycleInfo.cycleDay,
      currentPhase: currentCycleInfo.phase,
      availableDays: constraints.availableDays,
      dueDate: constraints.dueDate?.toISOString().split('T')[0],
      cycleLength
    }

    try {
      const recommendation = await this.generateRecommendation(agentInput)
      return recommendation
    } catch (error) {
      console.error('Gemini scheduling error:', error)
      return this.generateSimpleFallback(constraints, currentCycleInfo, cycleLength)
    }
  }

  async generateRecommendation(input: any): Promise<SchedulingSuggestion> {
    const enhancedPrompt = this.buildEnhancedPrompt(input)

    try {
      const response = await fetch('/api/schedule-task', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ prompt: enhancedPrompt })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'API request failed')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API returned error')
      }

      console.log('API result structure:', data.result)

      const responseText = data.result.text || data.result.content || data.result
      const aiResponse = this.parseAIResponse(responseText)
      
      return this.convertToSchedulingSuggestion(aiResponse, input)
      
    } catch (error) {
      console.error('Error generating AI recommendation:', error)
      throw error
    }
  }

  private buildEnhancedPrompt(input: any): string {
    const today = new Date()
    const currentDateStr = today.toISOString().split('T')[0]
    
    return `
TASK SCHEDULING REQUEST:
Current Date: ${currentDateStr}
Current Cycle Day: ${input.currentCycleDay}
Current Phase: ${input.currentPhase}
Cycle Length: ${input.cycleLength} days

TASK DETAILS:
- Description: "${input.taskDescription}"
- Detected Type: ${input.taskType}
- Energy Required: ${input.energyRequired}
- Focus Required: ${input.focusRequired}
- Due Date: ${input.dueDate || 'No specific deadline'}
- Available Days: ${input.availableDays.length > 0 ? input.availableDays.join(', ') : 'Any day'}

ANALYSIS REQUIREMENTS:
1. Consider the user's current cycle phase and upcoming phase transitions
2. Optimize for the task type based on hormonal fluctuations
3. Factor in energy and focus requirements
4. Provide confidence scoring based on cycle science
5. Suggest 2-3 alternative dates with different phase alignments

CRITICAL: You MUST respond with ONLY valid JSON in exactly this format:

{
  "suggestedDate": "YYYY-MM-DD",
  "cycleDay": 15,
  "phase": "ovulatory",
  "confidence": 0.85,
  "reasoning": ["First reason", "Second reason"],
  "alternatives": [
    { "date": "YYYY-MM-DD", "cycleDay": 16, "phase": "ovulatory", "confidence": 0.75, "reason": "Alternative reason" }
  ],
  "optimizationTips": ["Tip 1", "Tip 2"],
  "hormonalInsight": "Brief hormonal explanation",
  "shortSummary": "One concise sentence under 50 characters for UI display"
}

Respond with ONLY the JSON object, no other text.
    `.trim()
  }

  private parseAIResponse(responseText: string): any {
    try {
      console.log('Raw AI response:', responseText)
      
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        throw new Error('AI returned HTML instead of JSON - possible server error')
      }
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        if (codeBlockMatch) {
          const cleanedResponse = codeBlockMatch[1]
          return JSON.parse(cleanedResponse)
        }
        throw new Error('No valid JSON found in AI response')
      }
      
      const cleanedResponse = jsonMatch[0]
      return JSON.parse(cleanedResponse)
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      console.log('Raw response:', responseText)
      throw new Error('Invalid JSON response from AI agent: ' + (error as Error).message)
    }
  }

  private convertToSchedulingSuggestion(aiResponse: any, input: any): SchedulingSuggestion {
    if (!aiResponse.suggestedDate || !aiResponse.cycleDay || !aiResponse.phase) {
      throw new Error('AI response missing required fields')
    }

    const suggestedDate = new Date(aiResponse.suggestedDate)
    
    const alternatives = (aiResponse.alternatives || []).map((alt: any) => ({
      date: new Date(alt.date),
      cycleDay: alt.cycleDay,
      phase: alt.phase,
      confidence: alt.confidence || 0.5,
      reason: alt.reason || 'Alternative timing option'
    }))

    return {
      suggestedDate,
      cycleDay: aiResponse.cycleDay,
      phase: aiResponse.phase,
      confidence: aiResponse.confidence || 0.7,
      reasoning: Array.isArray(aiResponse.reasoning) 
        ? aiResponse.reasoning 
        : [aiResponse.reasoning || 'AI-generated recommendation'],
      policyResults: [{ decision: 'Allow', source: 'gemini-ai' }],
      alternatives,
      optimizationTips: aiResponse.optimizationTips || [
        'Consider your natural energy patterns during this cycle phase',
        aiResponse.hormonalInsight || 'Align tasks with your hormonal rhythms for optimal performance'
      ],
      shortSummary: aiResponse.shortSummary || 'Optimized for your cycle phase'
    }
  }

  private generateSimpleFallback(
    constraints: TaskConstraints,
    currentCycleInfo: any,
    cycleLength: number
  ): SchedulingSuggestion {
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    
    let confidence = 0.6
    const reasoning = ['Fallback recommendation - using enhanced cycle heuristics']
    
    if (constraints.taskType === 'creative' && (currentCycleInfo.phase === 'follicular' || currentCycleInfo.phase === 'menstrual')) {
      confidence = 0.8
      reasoning.push('Creative tasks align well with follicular/menstrual phases when innovation peaks')
    } else if (constraints.taskType === 'presentation' && currentCycleInfo.phase === 'ovulatory') {
      confidence = 0.9
      reasoning.push('Presentation tasks optimal during ovulatory phase when confidence and communication skills peak')
    } else if (constraints.taskType === 'detail' && currentCycleInfo.phase === 'luteal') {
      confidence = 0.85
      reasoning.push('Detail work suits luteal phase when focus and attention to detail are enhanced')
    } else if (constraints.taskType === 'planning' && currentCycleInfo.phase === 'menstrual') {
      confidence = 0.75
      reasoning.push('Planning and strategic thinking align with menstrual phase introspection')
    }

    return {
      suggestedDate: tomorrow,
      cycleDay: currentCycleInfo.cycleDay + 1,
      phase: currentCycleInfo.phase,
      confidence,
      reasoning,
      policyResults: [{ decision: 'Allow', source: 'enhanced-fallback' }],
      alternatives: [],
      optimizationTips: ['Consider your natural energy patterns during this cycle phase']
    }
  }
}

interface CedarTaskSchedulerProps {
  currentCycle: any
  onTaskScheduled: (task: any) => void
  onTasksRefresh?: () => void
}

export default function CedarTaskScheduler({ currentCycle, onTaskScheduled, onTasksRefresh }: CedarTaskSchedulerProps) {
  const [showForm, setShowForm] = useState(false)
  const [constraints, setConstraints] = useState<TaskConstraints>({
    description: '',
    taskType: 'general',
    energyRequired: 'medium',
    focusRequired: 'medium',
    availableDays: [],
    flexibilityDays: 7
  })
  const [suggestion, setSuggestion] = useState<SchedulingSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [scheduler] = useState(new MastraGeminiScheduler())

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ]

  const analyzeTaskType = (description: string): 'creative' | 'presentation' | 'detail' | 'planning' | 'social' | 'general' => {
    const lowerDesc = description.toLowerCase()
    
    if (lowerDesc.includes('brainstorm') || lowerDesc.includes('design') || lowerDesc.includes('write') || 
        lowerDesc.includes('creative') || lowerDesc.includes('art') || lowerDesc.includes('idea')) {
      return 'creative'
    } else if (lowerDesc.includes('present') || lowerDesc.includes('demo') || lowerDesc.includes('meeting') || 
               lowerDesc.includes('speak') || lowerDesc.includes('pitch')) {
      return 'presentation'
    } else if (lowerDesc.includes('review') || lowerDesc.includes('edit') || lowerDesc.includes('organize') || 
               lowerDesc.includes('detail') || lowerDesc.includes('check') || lowerDesc.includes('proofread')) {
      return 'detail'
    } else if (lowerDesc.includes('plan') || lowerDesc.includes('strategy') || lowerDesc.includes('goal') || 
               lowerDesc.includes('analyze') || lowerDesc.includes('research')) {
      return 'planning'
    } else if (lowerDesc.includes('network') || lowerDesc.includes('team') || lowerDesc.includes('social') || 
               lowerDesc.includes('call') || lowerDesc.includes('collaborate')) {
      return 'social'
    }
    return 'general'
  }

  const extractTaskTitle = (description: string): string => {
    const words = description.trim().split(' ')
    if (words.length <= 4) return description
    
    const actionWords = ['review', 'write', 'plan', 'design', 'create', 'analyze', 'organize', 'present']
    const actionWord = words.find(word => actionWords.some(action => word.toLowerCase().includes(action)))
    
    if (actionWord) {
      const actionIndex = words.findIndex(word => word.toLowerCase().includes(actionWord.toLowerCase()))
      return words.slice(actionIndex, Math.min(actionIndex + 4, words.length)).join(' ')
    }
    
    return words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '')
  }

  const handleGenerateSuggestion = async () => {
    if (!constraints.description.trim()) return

    const detectedTaskType = analyzeTaskType(constraints.description)
    const updatedConstraints = { ...constraints, taskType: detectedTaskType }

    setLoading(true)
    try {
      const result = await scheduler.evaluateTaskScheduling(updatedConstraints, currentCycle)
      setSuggestion(result)
    } catch (error) {
      console.error('Scheduling error:', error)
      alert('Error generating suggestion: ' + (error as Error).message)
    }
    setLoading(false)
  }

  const handleAcceptSuggestion = async () => {
    if (!suggestion) return

    const taskTitle = extractTaskTitle(constraints.description)
    const detectedTaskType = analyzeTaskType(constraints.description)

    const taskData = {
      title: taskTitle,
      task_type: detectedTaskType,
      energy_required: constraints.energyRequired,
      focus_required: constraints.focusRequired,
      scheduled_date: suggestion.suggestedDate.toISOString().split('T')[0],
      cycle_day: suggestion.cycleDay,
      phase: suggestion.phase,
      confidence: suggestion.confidence,
      reasoning: suggestion.reasoning,
      optimization_tips: suggestion.optimizationTips || [],
      alternatives: suggestion.alternatives,
      constraints: { ...constraints, description: constraints.description },
      short_summary: suggestion.shortSummary || 'Optimized for your cycle phase'
    }

    try {
      const response = await fetch('/api/save-cedar-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        throw new Error('Failed to save task')
      }

      const result = await response.json()
      
      if (result.success) {
        const newTask = {
          id: result.task.id,
          text: taskTitle,
          completed: false,
          scheduledDate: suggestion.suggestedDate,
          cycleDay: suggestion.cycleDay,
          phase: suggestion.phase,
          confidence: suggestion.confidence,
          reasoning: suggestion.reasoning,
          constraints,
          source: 'cedar-scheduled' as const
        }

        onTaskScheduled(newTask)

        if (onTasksRefresh) {
          onTasksRefresh()
        }

        window.dispatchEvent(new CustomEvent('cedarTaskAdded', { 
          detail: { task: newTask } 
        }))

        setConstraints({
          description: '',
          taskType: 'general',
          energyRequired: 'medium',
          focusRequired: 'medium',
          availableDays: [],
          flexibilityDays: 7
        })
        setSuggestion(null)
        setShowForm(false)

        alert('Task scheduled successfully!')
      } else {
        throw new Error(result.error || 'Failed to save task')
      }
    } catch (error) {
      console.error('Error saving task:', error)
      alert('Error saving task: ' + (error as Error).message)
    }
  }

  const handleAcceptAlternative = async () => {
    if (!suggestion || !suggestion.alternatives || suggestion.alternatives.length === 0) return

    const alternative = suggestion.alternatives[0]
    const taskTitle = extractTaskTitle(constraints.description)
    const detectedTaskType = analyzeTaskType(constraints.description)

    const taskData = {
      title: taskTitle,
      task_type: detectedTaskType,
      energy_required: constraints.energyRequired,
      focus_required: constraints.focusRequired,
      scheduled_date: alternative.date.toISOString().split('T')[0],
      cycle_day: alternative.cycleDay,
      phase: alternative.phase,
      confidence: alternative.confidence,
      reasoning: [alternative.reason || 'Alternative timing recommendation'],
      optimization_tips: suggestion.optimizationTips || [],
      alternatives: suggestion.alternatives.slice(1),
      constraints: { ...constraints, description: constraints.description },
      short_summary: `Alternative: ${alternative.reason || 'Optimized for cycle phase'}`
    }

    try {
      const response = await fetch('/api/save-cedar-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        throw new Error('Failed to save task')
      }

      const result = await response.json()
      
      if (result.success) {
        const newTask = {
          id: result.task.id,
          text: taskTitle,
          completed: false,
          scheduledDate: alternative.date,
          cycleDay: alternative.cycleDay,
          phase: alternative.phase,
          confidence: alternative.confidence,
          reasoning: [alternative.reason || 'Alternative timing recommendation'],
          constraints,
          source: 'cedar-scheduled' as const
        }

        onTaskScheduled(newTask)

        if (onTasksRefresh) {
          onTasksRefresh()
        }

        window.dispatchEvent(new CustomEvent('cedarTaskAdded', { 
          detail: { task: newTask } 
        }))

        setConstraints({
          description: '',
          taskType: 'general',
          energyRequired: 'medium',
          focusRequired: 'medium',
          availableDays: [],
          flexibilityDays: 7
        })
        setSuggestion(null)
        setShowForm(false)

        alert('Task scheduled with alternative date!')
      } else {
        throw new Error(result.error || 'Failed to save task')
      }
    } catch (error) {
      console.error('Error saving alternative task:', error)
      alert('Error saving task: ' + (error as Error).message)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
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

  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
        <div className="text-center py-4">
          <div className="text-gray-500">Gemini API Key Required</div>
          <div className="text-sm text-gray-400 mt-1">Add NEXT_PUBLIC_GEMINI_API_KEY to use Gemini AI</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gemini AI Task Scheduler</h3>
          <p className="text-sm text-gray-600">AI-powered cycle-aware scheduling with Google Gemini</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm"
        >
          {showForm ? 'Cancel' : '+ Smart Schedule'}
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
            <textarea
              value={constraints.description}
              onChange={(e) => setConstraints(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you need to do... (e.g., 'Review quarterly metrics and prepare presentation for board meeting')"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              AI will automatically detect task type and optimize scheduling based on your description
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
              <input
                type="date"
                onChange={(e) => setConstraints(prev => ({ 
                  ...prev, 
                  dueDate: e.target.value ? new Date(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flexibility (days)</label>
              <input
                type="number"
                min="1"
                max="14"
                value={constraints.flexibilityDays}
                onChange={(e) => setConstraints(prev => ({ ...prev, flexibilityDays: parseInt(e.target.value) || 7 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Energy Required</label>
              <select
                value={constraints.energyRequired}
                onChange={(e) => setConstraints(prev => ({ ...prev, energyRequired: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Focus Required</label>
              <select
                value={constraints.focusRequired}
                onChange={(e) => setConstraints(prev => ({ ...prev, focusRequired: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Days (leave empty for any day)</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  onClick={() => {
                    setConstraints(prev => ({
                      ...prev,
                      availableDays: prev.availableDays.includes(day)
                        ? prev.availableDays.filter(d => d !== day)
                        : [...prev.availableDays, day]
                    }))
                  }}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    constraints.availableDays.includes(day)
                      ? 'border-rose-400 bg-rose-50 text-rose-800'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateSuggestion}
            disabled={!constraints.description.trim() || loading}
            className="w-full px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'AI Analyzing with Gemini...' : 'Generate Gemini AI Recommendation'}
          </button>
        </div>
      )}

      {suggestion && (
        <div className="mt-6 p-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Gemini AI Recommendation</h4>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white border border-rose-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{formatDate(suggestion.suggestedDate)}</div>
                <div className="text-sm text-gray-600">
                  Cycle Day {suggestion.cycleDay} - 
                  <span style={{ color: getPhaseColor(suggestion.phase) }} className="font-medium ml-1">
                    {suggestion.phase} phase
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleAcceptSuggestion}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm"
                >
                  Accept & Schedule
                </button>
                {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                  <button
                    onClick={handleAcceptAlternative}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Use Next Alternative
                  </button>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-700">
              <div className="font-medium mb-1">AI Analysis:</div>
              <ul className="list-disc list-inside space-y-1">
                {suggestion.reasoning.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>

            {suggestion.alternatives.length > 0 && (
              <div>
                <div className="font-medium text-gray-700 text-sm mb-2">Alternative Options:</div>
                <div className="space-y-1">
                  {suggestion.alternatives.map((alt, index) => (
                    <div key={index} className={`text-xs flex justify-between p-2 rounded ${
                      index === 0 ? 'bg-blue-50 border border-blue-200' : 'text-gray-600'
                    }`}>
                      <span>{formatDate(alt.date)} (Day {alt.cycleDay}, {alt.phase})</span>
                      <span>{Math.round(alt.confidence * 100)}% fit</span>
                      {index === 0 && (
                        <span className="text-blue-600 font-medium">← Next option</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}