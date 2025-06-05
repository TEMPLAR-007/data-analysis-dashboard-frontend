import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import QueryForm from './components/QueryForm'
import AnalysisTab from './components/AnalysisTab'
import FileUpload from './components/FileUpload'
import Login from './components/Login'
import Register from './components/Register'
import { api } from './utils/api'
import { auth } from './utils/auth'

// Protected route wrapper component
const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

function Dashboard() {
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
    // Only switch to analysis view if it's explicitly an analysis result
    if (queryId && queryId.type === 'analysis') {
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

  const handleLogout = async () => {
    await api.logout();
    window.location.href = '/login';
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Data Analysis Dashboard</h1>
        <div className="header-right">
          <div className="user-info">
            <span>{auth.getUser()?.name || auth.getUser()?.email}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
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
        </div>
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
