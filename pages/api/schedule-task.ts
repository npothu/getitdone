import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API route called with method:', req.method)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body
    console.log('Received prompt:', prompt ? 'Present' : 'Missing')

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Import mastra config
    console.log('Attempting to import mastra config...')
    const { mastra } = await import('../../mastra_config')
    console.log('Mastra config imported successfully')

    // Get the agent
    console.log('Attempting to get agent...')
    const agent = mastra.getAgent('cycle-scheduler')
    console.log('Agent retrieved successfully')
    
    // Debug: Check what methods are available on the agent
    console.log('Available agent methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(agent)))
    
    // Try different generation methods
    let result
    try {
      console.log('Trying generateVNext with prompt...')
      result = await agent.generateVNext(prompt)
    } catch (vNextError) {
      console.log('generateVNext failed, trying generate...')
      try {
        result = await agent.generate(prompt)
      } catch (generateError) {
        console.log('Both methods failed, trying with different approaches...')
        // Try with options object
        //TODO
        //result = await agent.generateVNext({ messages: prompt })
      }
    }
    
    console.log('Generation successful, result type:', typeof result)
    console.log('Result preview:', JSON.stringify(result).substring(0, 200))
    
    res.status(200).json({ 
      success: true,
      result: result 
    })
    
  } catch (error) {
    console.error('Detailed API Error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate recommendation',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown error type'
    })
  }
}