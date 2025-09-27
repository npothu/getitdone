// src/lib/utils.ts

export interface CycleData {
    lastPeriodDate: Date;
    averageCycleLength: number;
  }
  
  export interface CycleInfo {
    cycleDay: number;
    phase: string;
    phaseName: string;
    phaseColor: string;
    description: string;
    optimalTasks: string[];
  }
  
  export function calculateCycleDay(lastPeriodDate: Date, cycleLength: number = 28): number {
    const today = new Date();
    const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate current cycle day (1-based)
    let cycleDay = (daysSinceLastPeriod % cycleLength) + 1;
    if (cycleDay <= 0) cycleDay += cycleLength;
    
    return cycleDay;
  }
  
  export function getCyclePhase(cycleDay: number, cycleLength: number = 28): CycleInfo {
    if (cycleDay >= 1 && cycleDay <= 5) {
      return {
        cycleDay,
        phase: 'menstrual',
        phaseName: 'Menstruation',
        phaseColor: '#ef4444',
        description: 'Time for rest, reflection, and intuitive thinking',
        optimalTasks: ['Planning', 'Reflection', 'Research']
      };
    } else if (cycleDay >= 6 && cycleDay <= 13) {
      return {
        cycleDay,
        phase: 'follicular',
        phaseName: 'Follicular Phase',
        phaseColor: '#10b981',
        description: 'Rising energy perfect for new projects and learning',
        optimalTasks: ['Creative work', 'Learning', 'New projects']
      };
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      return {
        cycleDay,
        phase: 'ovulatory',
        phaseName: 'Ovulation',
        phaseColor: '#f59e0b',
        description: 'Peak energy and communication skills',
        optimalTasks: ['Presentations', 'Networking', 'Important meetings']
      };
    } else {
      return {
        cycleDay,
        phase: 'luteal',
        phaseName: 'Luteal Phase',
        phaseColor: '#8b5cf6',
        description: 'Focus and attention to detail for completing projects',
        optimalTasks: ['Editing', 'Organizing', 'Detail work']
      };
    }
  }
  
  export function getCurrentCycleInfo(lastPeriodDate: Date, cycleLength: number = 28): CycleInfo {
    const cycleDay = calculateCycleDay(lastPeriodDate, cycleLength);
    return getCyclePhase(cycleDay, cycleLength);
  }

  // Add this to the end of your utils.ts file

export function getTaskOptimalPhase(taskText: string): string {
    const text = taskText.toLowerCase();
    
    // Creative and brainstorming tasks
    if (text.includes('brainstorm') || text.includes('creative') || text.includes('idea') || text.includes('design')) {
      return 'follicular';
    }
    
    // Presentation and social tasks
    if (text.includes('presentation') || text.includes('meeting') || text.includes('demo') || text.includes('pitch')) {
      return 'ovulatory';
    }
    
    // Detail and completion tasks
    if (text.includes('review') || text.includes('edit') || text.includes('organize') || text.includes('complete') || text.includes('finish')) {
      return 'luteal';
    }
    
    // Planning and reflection tasks
    if (text.includes('plan') || text.includes('strategy') || text.includes('research')) {
      return 'menstrual';
    }
    
    // Default to current phase if unclear
    return 'any';
  }
  
  export function getOptimalPhaseInfo(phase: string) {
    const phases: Record<string, { name: string; color: string; emoji: string }> = {
      'menstrual': { name: 'Menstruation', color: '#ef4444', emoji: '🌙' },
      'follicular': { name: 'Follicular', color: '#10b981', emoji: '🌱' },
      'ovulatory': { name: 'Ovulation', color: '#f59e0b', emoji: '⚡' },
      'luteal': { name: 'Luteal', color: '#8b5cf6', emoji: '🎯' }
    };
    return phases[phase] || { name: 'Any time', color: '#6b7280', emoji: '📋' };
  }
  
  export function isOptimalTiming(taskText: string, currentPhase: string): boolean {
    const optimalPhase = getTaskOptimalPhase(taskText);
    return optimalPhase === 'any' || optimalPhase === currentPhase;
  }