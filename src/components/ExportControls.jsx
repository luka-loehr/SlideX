import React, { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { api } from '../utils/api'

const ExportControls = ({ slides, presentationData }) => {
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState(null)

  const exportToPDF = async () => {
    setExporting(true)
    setExportFormat('pdf')

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720]
      })

      for (let i = 0; i < slides.length; i++) {
        // Create a temporary container for the slide
        const tempDiv = document.createElement('div')
        tempDiv.style.width = '1280px'
        tempDiv.style.height = '720px'
        tempDiv.style.position = 'absolute'
        tempDiv.style.left = '-9999px'
        tempDiv.innerHTML = slides[i]
        document.body.appendChild(tempDiv)

        try {
          // Convert slide to canvas
          const canvas = await html2canvas(tempDiv, {
            width: 1280,
            height: 720,
            scale: 2,
            logging: false,
            backgroundColor: '#ffffff'
          })

          // Add to PDF
          if (i > 0) {
            pdf.addPage()
          }
          
          const imgData = canvas.toDataURL('image/png')
          pdf.addImage(imgData, 'PNG', 0, 0, 1280, 720)
        } finally {
          document.body.removeChild(tempDiv)
        }
      }

      // Save the PDF
      const filename = presentationData.title ? 
        `${presentationData.title.replace(/[^a-z0-9]/gi, '_')}.pdf` : 
        'presentation.pdf'
      
      pdf.save(filename)
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
      setExportFormat(null)
    }
  }

  const exportToPowerPoint = async () => {
    setExporting(true)
    setExportFormat('pptx')

    try {
      await api.exportPresentation(slides, 'pptx')
    } catch (error) {
      console.error('PowerPoint export error:', error)
      alert('Failed to export PowerPoint. Please try again.')
    } finally {
      setExporting(false)
      setExportFormat(null)
    }
  }

  const exportToHTML = () => {
    setExportFormat('html')
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${presentationData.title || 'Presentation'}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    .slide-page {
      width: 1280px;
      height: 720px;
      margin: 0 auto 50px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      page-break-after: always;
    }
    @media print {
      .slide-page {
        margin: 0;
        box-shadow: none;
      }
    }
    body {
      background: #f3f4f6;
      padding: 50px 0;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  ${slides.map((slide, index) => `
    <div class="slide-page" id="slide-${index + 1}">
      ${slide}
    </div>
  `).join('\n')}
  
  <script>
    // Re-initialize any Chart.js charts after page load
    window.addEventListener('load', () => {
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent.includes('new Chart')) {
          try {
            eval(script.textContent);
          } catch (e) {
            console.error('Failed to initialize chart:', e);
          }
        }
      });
    });
  </script>
</body>
</html>
    `

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = presentationData.title ? 
      `${presentationData.title.replace(/[^a-z0-9]/gi, '_')}.html` : 
      'presentation.html'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    setExportFormat(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        <i className="fas fa-download mr-2"></i>
        Export Presentation
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={exportToPDF}
          disabled={exporting}
          className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-file-pdf text-3xl text-red-600 mb-2"></i>
          <span className="text-sm font-medium">Export as PDF</span>
          {exporting && exportFormat === 'pdf' && (
            <div className="mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            </div>
          )}
        </button>

        <button
          onClick={exportToPowerPoint}
          disabled={exporting}
          className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-file-powerpoint text-3xl text-orange-600 mb-2"></i>
          <span className="text-sm font-medium">Export as PPTX</span>
          {exporting && exportFormat === 'pptx' && (
            <div className="mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            </div>
          )}
        </button>

        <button
          onClick={exportToHTML}
          disabled={exporting}
          className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-file-code text-3xl text-blue-600 mb-2"></i>
          <span className="text-sm font-medium">Export as HTML</span>
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        PDF and HTML exports are generated locally. PowerPoint export requires server processing.
      </p>
    </div>
  )
}

export default ExportControls 