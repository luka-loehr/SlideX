import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import ChatInterface from './components/ChatInterface'
import SlideRenderer from './components/SlideRenderer'
import SlideShowMode from './components/SlideShowMode'
import FileUploader from './components/FileUploader'
import ExportControls from './components/ExportControls'
import Header from './components/Header'
import Footer from './components/Footer'
import { WebSocketProvider } from './utils/websocket'
import { AgentProvider } from './agents/AgentContext'

function App() {
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [presentationData, setPresentationData] = useState({
    title: '',
    outline: null,
    files: [],
    todoItems: []
  })

  return (
    <WebSocketProvider>
      <AgentProvider>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Routes>
            <Route path="/" element={
              <div className="container mx-auto px-4 py-8">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Panel - Chat and Controls */}
                  <div className="space-y-6">
                    <ChatInterface 
                      onSlidesUpdate={setSlides}
                      onGeneratingChange={setIsGenerating}
                      presentationData={presentationData}
                      setPresentationData={setPresentationData}
                    />
                    
                    <FileUploader 
                      onFilesUploaded={(files) => setPresentationData(prev => ({
                        ...prev,
                        files: [...prev.files, ...files]
                      }))}
                    />
                    
                    {slides.length > 0 && (
                      <ExportControls slides={slides} presentationData={presentationData} />
                    )}
                  </div>

                  {/* Right Panel - Slide Preview */}
                  <div className="space-y-4">
                    {slides.length > 0 ? (
                      <>
                        <SlideRenderer 
                          slides={slides}
                          currentSlide={currentSlide}
                          onSlideChange={setCurrentSlide}
                          isGenerating={isGenerating}
                        />
                        
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => window.open('/slideshow', '_blank')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <i className="fas fa-play mr-2"></i>
                            Present
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <i className="fas fa-presentation text-6xl text-gray-300 mb-4"></i>
                        <p className="text-gray-500 text-lg">
                          Start a conversation to generate your presentation
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* TODO List Panel */}
                {presentationData.todoItems.length > 0 && (
                  <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">
                      <i className="fas fa-tasks mr-2"></i>
                      TODO.md - Live Roadmap
                    </h3>
                    <ul className="space-y-2">
                      {presentationData.todoItems.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <input 
                            type="checkbox" 
                            checked={item.completed}
                            className="mt-1 mr-3"
                            readOnly
                          />
                          <span className={item.completed ? 'line-through text-gray-500' : ''}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            } />
            
            <Route path="/slideshow" element={
              <SlideShowMode slides={slides} />
            } />
          </Routes>
        </div>
        <Footer />
      </AgentProvider>
    </WebSocketProvider>
  )
}

export default App 