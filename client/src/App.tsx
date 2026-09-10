import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import { useTheme } from './hooks/useTheme'
import ToastHost from './components/Toast'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Skills from './pages/Skills'
import SkillDetail from './pages/SkillDetail'
import Checkin from './pages/Checkin'
import Records from './pages/Records'
import RecordDetail from './pages/RecordDetail'
import Tags from './pages/Tags'
import Stats from './pages/Stats'

function Protected({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  useTheme()
  return (
    <>
      <ToastHost />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="/skills" replace />} />
          <Route path="skills" element={<Skills />} />
          <Route path="skills/:id" element={<SkillDetail />} />
          <Route path="checkin" element={<Checkin />} />
          <Route path="records" element={<Records />} />
          <Route path="records/:id" element={<RecordDetail />} />
          <Route path="tags" element={<Tags />} />
          <Route path="stats" element={<Stats />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
