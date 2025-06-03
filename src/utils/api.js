import axios from 'axios'

const API_BASE_URL = '/api'

export const api = {
  // Chat with the Setup Agent
  chat: async (messages) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, { messages })
      return response.data
    } catch (error) {
      console.error('Chat API error:', error)
      throw error
    }
  },

  // Upload files
  uploadFile: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Upload API error:', error)
      throw error
    }
  },

  // Generate presentation
  generatePresentation: async (prompt, outline, files) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/generate`, {
        prompt,
        outline,
        files
      })
      return response.data
    } catch (error) {
      console.error('Generate API error:', error)
      throw error
    }
  },

  // Web search
  webSearch: async (query) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/search`, { query })
      return response.data
    } catch (error) {
      console.error('Search API error:', error)
      throw error
    }
  },

  // Export presentation
  exportPresentation: async (slides, format) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/export`, {
        slides,
        format
      }, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `presentation.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Export API error:', error)
      throw error
    }
  }
} 