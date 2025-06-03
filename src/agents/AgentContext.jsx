import React, { createContext, useContext, useState, useEffect } from 'react'
import { useWebSocket } from '../utils/websocket'
import { api } from '../utils/api'

const AgentContext = createContext(null)

export const useAgents = () => {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgents must be used within AgentProvider')
  }
  return context
}

export const AgentProvider = ({ children }) => {
  const { addMessageHandler, removeMessageHandler, sendMessage } = useWebSocket()
  const [activeAgent, setActiveAgent] = useState('setup')
  const [agentState, setAgentState] = useState({
    setup: {
      messages: [],
      outline: null,
      isProcessing: false
    },
    coding: {
      slides: [],
      currentSlide: 0,
      isGenerating: false
    },
    renderer: {
      renderedSlides: [],
      isRendering: false
    }
  })

  // Handle WebSocket messages from agents
  useEffect(() => {
    const handleAgentMessage = (message) => {
      switch (message.type) {
        case 'agent_response':
          handleAgentResponse(message)
          break
        case 'slide':
          handleSlideGenerated(message)
          break
        case 'outline':
          handleOutlineGenerated(message)
          break
        case 'todo_update':
          handleTodoUpdate(message)
          break
        case 'progress':
          handleProgress(message)
          break
        case 'generation_complete':
          handleGenerationComplete(message)
          break
        case 'error':
          handleError(message)
          break
        default:
          break
      }
    }

    addMessageHandler('agent-handler', handleAgentMessage)
    return () => removeMessageHandler('agent-handler')
  }, [addMessageHandler, removeMessageHandler])

  const handleAgentResponse = (message) => {
    setAgentState(prev => ({
      ...prev,
      [message.agent]: {
        ...prev[message.agent],
        messages: [...prev[message.agent].messages, message.content],
        isProcessing: false
      }
    }))
  }

  const handleSlideGenerated = (message) => {
    console.log('Slide generated:', message.slideIndex, message.title)
    
    setAgentState(prev => {
      const newSlides = [...prev.coding.slides]
      // Ensure array is large enough
      while (newSlides.length <= message.slideIndex) {
        newSlides.push(null)
      }
      // Set the slide at the correct index
      newSlides[message.slideIndex] = message.html
      
      return {
        ...prev,
        coding: {
          ...prev.coding,
          slides: newSlides,
          currentSlide: message.slideIndex
        },
        renderer: {
          ...prev.renderer,
          renderedSlides: newSlides
        }
      }
    })
  }

  const handleOutlineGenerated = (message) => {
    setAgentState(prev => ({
      ...prev,
      setup: {
        ...prev.setup,
        outline: message.outline
      }
    }))
  }

  const handleTodoUpdate = (message) => {
    // Handle TODO.md updates
    console.log('TODO updated:', message)
  }

  const handleProgress = (message) => {
    console.log('Progress:', message.message)
  }

  const handleGenerationComplete = (message) => {
    console.log('Generation complete:', message.message)
    setAgentState(prev => ({
      ...prev,
      coding: {
        ...prev.coding,
        isGenerating: false
      }
    }))
  }

  const handleError = (message) => {
    console.error('Agent error:', message.error || message.message)
    setAgentState(prev => ({
      ...prev,
      setup: {
        ...prev.setup,
        isProcessing: false
      },
      coding: {
        ...prev.coding,
        isGenerating: false
      },
      renderer: {
        ...prev.renderer,
        isRendering: false
      }
    }))
  }

  // Agent interaction methods
  const setupAgent = {
    sendMessage: async (message) => {
      setAgentState(prev => ({
        ...prev,
        setup: {
          ...prev.setup,
          messages: [...prev.setup.messages, { role: 'user', content: message }],
          isProcessing: true
        }
      }))

      try {
        const response = await api.chat([
          { 
            role: 'system', 
            content: `You are the SlideX Setup Agent. Help users create presentation outlines and manage the generation process.
When the user approves an outline, use the generate_presentation function to start slide generation.
Create structured outlines with clear titles and content descriptions for each slide.` 
          },
          ...agentState.setup.messages,
          { role: 'user', content: message }
        ])

        const aiMessage = response.choices[0].message
        
        setAgentState(prev => ({
          ...prev,
          setup: {
            ...prev.setup,
            messages: [...prev.setup.messages, aiMessage],
            isProcessing: false
          }
        }))

        // Check if we need to generate slides
        if (aiMessage.function_call && aiMessage.function_call.name === 'generate_presentation') {
          const args = JSON.parse(aiMessage.function_call.arguments)
          setAgentState(prev => ({
            ...prev,
            setup: {
              ...prev.setup,
              outline: args.outline
            }
          }))
          await startGeneration(args.title, args.outline, args.files || [])
        }

        return aiMessage
      } catch (error) {
        console.error('Setup agent error:', error)
        setAgentState(prev => ({
          ...prev,
          setup: { ...prev.setup, isProcessing: false }
        }))
        throw error
      }
    },

    getMessages: () => agentState.setup.messages,
    getOutline: () => agentState.setup.outline,
    isProcessing: () => agentState.setup.isProcessing
  }

  const codingAgent = {
    generateSlides: async (title, outline, files) => {
      setAgentState(prev => ({
        ...prev,
        coding: { 
          ...prev.coding, 
          isGenerating: true, 
          slides: [],
          currentSlide: 0
        }
      }))

      try {
        await api.generatePresentation(title, outline, files)
      } catch (error) {
        console.error('Coding agent error:', error)
        setAgentState(prev => ({
          ...prev,
          coding: { ...prev.coding, isGenerating: false }
        }))
        throw error
      }
    },

    getSlides: () => agentState.coding.slides.filter(slide => slide !== null),
    isGenerating: () => agentState.coding.isGenerating
  }

  const rendererAgent = {
    renderSlide: (slideHtml) => {
      sendMessage({
        type: 'render_slide',
        html: slideHtml
      })
    },

    getRenderedSlides: () => agentState.renderer.renderedSlides.filter(slide => slide !== null),
    isRendering: () => agentState.renderer.isRendering
  }

  const startGeneration = async (title, outline, files) => {
    setActiveAgent('coding')
    await codingAgent.generateSlides(title, outline, files)
  }

  const value = {
    activeAgent,
    setActiveAgent,
    setupAgent,
    codingAgent,
    rendererAgent,
    agentState
  }

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  )
} 