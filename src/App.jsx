import React from 'react'
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
    <div className="flex flex-col min-h-screen bg-[#f5f5f5] text-[#333333]">
      {/* Header with Tailwind CSS */}
      <header className="bg-[#3f51b5] text-white px-8 py-4 shadow-md">
        <h1 className="text-2xl font-bold m-0">Data Analysis Dashboard</h1>
        <div className="flex justify-end items-center mt-2">
          <div className="flex items-center mr-4">
            <span className="mr-3">{auth.getUser()?.name || auth.getUser()?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-transparent border-none text-white px-4 py-2 rounded cursor-pointer transition-colors hover:bg-white/10"
            >
              Logout
            </button>
          </div>
          {apiHealth && apiHealth.status !== 'ok' && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded">
              {apiHealth.message || 'API Service Unavailable'}
            </div>
          )}
          {uploadSuccess && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded">
              {uploadSuccess}
            </div>
          )}
        </div>
        <nav className="flex gap-4 mt-4">
          <button
            className={`bg-transparent border-none text-white px-4 py-2 rounded cursor-pointer transition-colors hover:bg-white/10 ${activeView === 'queries' ? 'bg-white/20 font-bold' : ''}`}
            onClick={() => setActiveView('queries')}
          >
            Queries
          </button>
          <button
            className={`bg-transparent border-none text-white px-4 py-2 rounded cursor-pointer transition-colors hover:bg-white/10 ${activeView === 'upload' ? 'bg-white/20 font-bold' : ''}`}
            onClick={() => setActiveView('upload')}
          >
            Upload Data
          </button>
          <button
            className={`bg-transparent border-none text-white px-4 py-2 rounded cursor-pointer transition-colors hover:bg-white/10 ${activeView === 'analysis' ? 'bg-white/20 font-bold' : ''}`}
            onClick={() => setActiveView('analysis')}
          >
            Analysis
          </button>
        </nav>
      </header>

      {/* Main content with Tailwind CSS */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full box-border">
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

      {/* Footer with Tailwind CSS */}
      <footer className="bg-[#3f51b5] text-white py-4 text-center mt-auto">
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
