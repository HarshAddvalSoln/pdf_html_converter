import { PDFEditor } from './components/PDFEditor'
import { ExportResult } from './types'
import './App.css'

function App() {
  /**
   * Handle file load completion
   */
  const handleFileLoad = (file: File) => {
    console.log('File loaded:', file.name)
  }

  /**
   * Handle export completion
   */
  const handleExportComplete = (result: ExportResult) => {
    if (result.success) {
      console.log('Export completed successfully:', result.filename)
    } else {
      console.error('Export failed:', result.error)
    }
  }

  return (
    <div className="app">
      <PDFEditor
        onFileLoad={handleFileLoad}
        onExportComplete={handleExportComplete}
        initialScale={1.0}
        enableAnnotations={true}
      />
    </div>
  )
}

export default App