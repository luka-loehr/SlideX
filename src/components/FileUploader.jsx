import React, { useState, useRef } from 'react'
import { api } from '../utils/api'

const FileUploader = ({ onFilesUploaded }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    const uploadedFileData = []

    try {
      for (const file of files) {
        const result = await api.uploadFile(file)
        uploadedFileData.push({
          ...result,
          file: file,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file)
        })
      }

      setUploadedFiles(prev => [...prev, ...uploadedFileData])
      onFilesUploaded(uploadedFileData)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload some files. Please try again.')
    } finally {
      setUploading(false)
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return 'fa-image'
    if (type.includes('pdf')) return 'fa-file-pdf'
    if (type.includes('word') || type.includes('document')) return 'fa-file-word'
    if (type.includes('excel') || type.includes('spreadsheet')) return 'fa-file-excel'
    if (type.includes('powerpoint') || type.includes('presentation')) return 'fa-file-powerpoint'
    if (type.includes('text')) return 'fa-file-alt'
    return 'fa-file'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        <i className="fas fa-cloud-upload-alt mr-2"></i>
        Upload Files & Images
      </h3>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        />
        
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <i className="fas fa-plus mr-2"></i>
              Choose Files
            </>
          )}
        </button>
        
        <p className="text-sm text-gray-600 mt-2">
          or drag and drop files here
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports images, PDFs, Word, Excel, PowerPoint, and text files
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center flex-1">
                <i className={`fas ${getFileIcon(file.type)} text-gray-600 mr-3`}></i>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.original}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              
              {file.type.startsWith('image/') && (
                <img
                  src={file.url}
                  alt={file.original}
                  className="w-12 h-12 object-cover rounded ml-3"
                />
              )}
              
              <button
                onClick={() => removeFile(index)}
                className="ml-3 text-red-600 hover:text-red-800 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUploader 