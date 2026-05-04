import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import EsqueciSenha from './pages/EsqueciSenha'
import Dashboard from './pages/Dashboard'
import Cronometro from './pages/Cronometro'
import Concursos from './pages/Concursos'
import Materias from './pages/Materias'
import Revisoes from './pages/Revisoes'
import Estatisticas from './pages/Estatisticas'
import Questoes from './pages/Questoes'
import Tecnicas from './pages/Tecnicas'
import Planejamento from './pages/Planejamento'
import Gamificacao from './pages/Gamificacao'
import Perfil from './pages/Perfil'
import Motivacional from './pages/Motivacional'

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/cadastro" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/esqueci-senha" element={<PublicRoute><EsqueciSenha /></PublicRoute>} />

      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cronometro" element={<Cronometro />} />
        <Route path="/concursos" element={<Concursos />} />
        <Route path="/materias" element={<Materias />} />
        <Route path="/revisoes" element={<Revisoes />} />
        <Route path="/estatisticas" element={<Estatisticas />} />
        <Route path="/questoes" element={<Questoes />} />
        <Route path="/tecnicas" element={<Tecnicas />} />
        <Route path="/planejamento" element={<Planejamento />} />
        <Route path="/gamificacao" element={<Gamificacao />} />
        <Route path="/motivacional" element={<Motivacional />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
