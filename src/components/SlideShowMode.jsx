import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const SlideShowMode = ({ slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          handleNext()
          break
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'Escape':
          exitPresentation()
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentSlide])

  useEffect(() => {
    // Try to enter fullscreen on mount
    enterFullscreen()
  }, [])

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await enterFullscreen()
    } else {
      await exitFullscreen()
    }
  }

  const enterFullscreen = async () => {
    try {
      if (containerRef.current && containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
    }
  }

  const exitPresentation = () => {
    exitFullscreen()
    navigate('/')
  }

  if (!slides || slides.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-6xl mb-4"></i>
          <p className="text-xl">No slides to present</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black relative overflow-hidden"
      onDoubleClick={toggleFullscreen}
    >
      <div className="w-full h-screen flex items-center justify-center">
        <div 
          className="slide-presentation-container"
          dangerouslySetInnerHTML={{ __html: slides[currentSlide] }}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-chevron-left mr-2"></i>
            Previous
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-white text-sm">
              {currentSlide + 1} / {slides.length}
            </span>
            
            <div className="flex space-x-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide 
                      ? 'bg-white' 
                      : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
            className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <i className="fas fa-chevron-right ml-2"></i>
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
          title="Toggle Fullscreen (F)"
        >
          <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
        </button>
        
        <button
          onClick={exitPresentation}
          className="p-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
          title="Exit Presentation (ESC)"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="absolute bottom-4 left-4 text-white text-xs opacity-0 hover:opacity-100 transition-opacity">
        <p>← → Navigate slides</p>
        <p>F Toggle fullscreen</p>
        <p>ESC Exit presentation</p>
      </div>
    </div>
  )
}

export default SlideShowMode 