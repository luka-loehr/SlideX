import React, { useState, useEffect, useRef } from 'react'
import { useAgents } from '../agents/AgentContext'

const ChatInterface = ({ onSlidesUpdate, onGeneratingChange, presentationData, setPresentationData }) => {
  const { setupAgent, codingAgent } = useAgents()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const slides = codingAgent.getSlides()
    if (slides.length > 0) {
      onSlidesUpdate(slides)
    }
  }, [codingAgent, onSlidesUpdate])

  useEffect(() => {
    onGeneratingChange(codingAgent.isGenerating())
  }, [codingAgent, onGeneratingChange])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || setupAgent.isProcessing()) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message to display
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await setupAgent.sendMessage(userMessage)
      
      // Add AI response to display
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.content || 'Starting slide generation...'
      }])

      // Check if outline was generated
      if (response.function_call && response.function_call.name === 'generate_presentation') {
        const args = JSON.parse(response.function_call.arguments)
        setPresentationData(prev => ({
          ...prev,
          outline: args.outline,
          title: args.title || prev.title
        }))
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: 'Sorry, there was an error processing your request.' 
      }])
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[600px]">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <h2 className="text-xl font-semibold flex items-center">
          <i className="fas fa-comments mr-2"></i>
          Chat with SlideX AI
        </h2>
        <p className="text-sm opacity-90 mt-1">
          Describe your presentation idea and I'll help you create it
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <i className="fas fa-robot text-6xl mb-4 text-gray-300"></i>
            <h3 className="text-xl font-semibold mb-2">Welcome to SlideX!</h3>
            <p className="mb-4">I'm your AI presentation assistant. Here's how to get started:</p>
            <div className="text-left max-w-md mx-auto space-y-2">
              <p className="text-sm">• "Create a presentation about [topic]"</p>
              <p className="text-sm">• "Make a 5-slide presentation on AI"</p>
              <p className="text-sm">• "Generate a business pitch deck"</p>
            </div>
            <p className="mt-4 text-sm">Upload files to include them in your presentation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === 'user' ? 'chat-message user-message' : 'chat-message agent-message'
                }`}
              >
                <div className="font-semibold mb-1">
                  {msg.role === 'user' ? 'You' : 'SlideX AI'}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.function_call && (
                  <div className="mt-2 p-2 bg-black bg-opacity-20 rounded text-sm">
                    <i className="fas fa-cog mr-2"></i>
                    {msg.function_call.name === 'generate_presentation' 
                      ? 'Starting slide generation...' 
                      : `Calling: ${msg.function_call.name}`}
                  </div>
                )}
              </div>
            ))}
            {setupAgent.isProcessing() && (
              <div className="chat-message agent-message opacity-70">
                <div className="flex items-center">
                  <div className="animate-pulse">Thinking...</div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your presentation idea..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={setupAgent.isProcessing()}
          />
          <button
            type="submit"
            disabled={!input.trim() || setupAgent.isProcessing()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
        
        {presentationData.outline && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <i className="fas fa-check-circle mr-2"></i>
              Outline ready! Type "generate" to create slides.
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

export default ChatInterface 