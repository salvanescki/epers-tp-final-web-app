import './App.css'
import { Routes, Route } from 'react-router-dom'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'
import { ProtectedRoute } from './auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Login />} />
    </Routes>
  )
}

export default App
