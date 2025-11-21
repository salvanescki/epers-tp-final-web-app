import './App.css'
import { Routes, Route } from 'react-router-dom'
import { Login } from './components/Login'
import { ClassSelector } from './components/ClassSelector'
import { ProtectedRoute } from './auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ClassSelector />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Login />} />
    </Routes>
  )
}

export default App
