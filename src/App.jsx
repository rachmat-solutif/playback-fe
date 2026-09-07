import { Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Layout } from './components/Layout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import Login from './routes/Login.jsx'

import ConversationSearch from './routes/ConversationSearch.jsx'
import ConversationDetail from './routes/ConversationDetail.jsx'

// Central route setup. Protected routes share the Layout shell and are gated by
// the dummy AuthProvider. ThemeProvider wraps everything so /login is themed too.
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<ConversationSearch />} />
            <Route path="/conversations" element={<ConversationSearch />} />
            <Route path="/conversations/:id" element={<ConversationDetail />} />
          </Route>

          {/* Unknown paths redirect to the dashboard (which bounces to /login if needed). */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
