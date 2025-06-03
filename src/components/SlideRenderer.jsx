import React, { useEffect, useRef } from 'react'
import { useWebSocket } from '../utils/websocket'

const SlideRenderer = ({ slides, currentSlide, onSlideChange, isGenerating }) => {
  const slideRef = useRef(null)
  const { addMessageHandler, removeMessageHandler } = useWebSocket()

  useEffect(() => {
    const handleSlideUpdate = (message) => {
      if (message.type === 'slide_update' && slideRef.current) {
        // Live update of the current slide if it's being edited
        if (message.slideIndex === currentSlide) {
          slideRef.current.innerHTML = message.html
        }
      }
    }

    addMessageHandler('slide-renderer', handleSlideUpdate)
    return () => removeMessageHandler('slide-renderer')
  }, [currentSlide, addMessageHandler, removeMessageHandler])

  const renderSlideContent = () => {
    if (slides.length === 0) return null
    
    const slideHtml = slides[currentSlide]
    return (
      <div 
        ref={slideRef}
        dangerouslySetInnerHTML={{ __html: slideHtml }}
        className="slide-render-container"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
    )
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      onSlideChange(currentSlide - 1)
    }
  }

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      onSlideChange(currentSlide + 1)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          <i className="fas fa-desktop mr-2"></i>
          Slide Preview
        </h3>
        {slides.length > 0 && (
          <span className="text-sm">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        )}
      </div>

      <div className="relative" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 p-4 bg-gray-100">
          <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
            {renderSlideContent()}
          </div>
        </div>
        
        {isGenerating && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Generating slides...</p>
            </div>
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <div className="p-4 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-chevron-left mr-2"></i>
            Previous
          </button>

          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => onSlideChange(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <i className="fas fa-chevron-right ml-2"></i>
          </button>
        </div>
      )}
    </div>
  )
}

export default SlideRenderer 