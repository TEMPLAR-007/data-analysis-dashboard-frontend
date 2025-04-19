import { useState, useEffect } from 'react'
import './App.css'
import QueryForm from './components/QueryForm'
import AnalysisTab from './components/AnalysisTab'
import FileUpload from './components/FileUpload'
import api from './utils/api'

function App() {
  const [activeView, setActiveView] = useState('queries')
  const [apiHealth, setApiHealth] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const health = await api.checkHealth()
        setApiHealth(health)
      } catch (err) {
        console.error('API health check failed:', err)
        setApiHealth({ status: 'error', message: 'API service is unreachable' })
      }
    }

    checkApiHealth()
  }, [])

  const handleQuerySaved = (queryId) => {
    if (queryId) {
      setActiveView('analysis')
    }
  }

  const handleFileUploaded = (result) => {
    if (result.success) {
      setUploadSuccess(`File uploaded successfully as table: ${result.table}`);
      setTimeout(() => {
        setUploadSuccess(null);
      }, 5000);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Data Analysis Dashboard</h1>
        {apiHealth && apiHealth.status !== 'ok' && (
          <div className="api-status error">
            {apiHealth.message || 'API Service Unavailable'}
          </div>
        )}
        {uploadSuccess && (
          <div className="api-status success">
            {uploadSuccess}
          </div>
        )}
        <nav>
          <button
            className={activeView === 'queries' ? 'active' : ''}
            onClick={() => setActiveView('queries')}
          >
            Queries
          </button>
          <button
            className={activeView === 'upload' ? 'active' : ''}
            onClick={() => setActiveView('upload')}
          >
            Upload Data
          </button>
          <button
            className={activeView === 'analysis' ? 'active' : ''}
            onClick={() => setActiveView('analysis')}
          >
            Analysis
          </button>
        </nav>
      </header>

      <main className="app-content">
        {activeView === 'queries' && (
          <QueryForm onQuerySaved={handleQuerySaved} />
        )}

        {activeView === 'upload' && (
          <FileUpload onFileUploaded={handleFileUploaded} />
        )}

        {activeView === 'analysis' && (
          <AnalysisTab
            currentAnalysis={null}
            onClose={() => setActiveView('queries')}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Data Analysis System • MVP Version</p>
      </footer>
    </div>
  )
}

export default App
