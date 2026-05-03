import api from './api'

export const gamificacaoService = {
  getStatus: () => api.get('/gamificacao/status'),
  getMissoes: () => api.get('/gamificacao/missoes'),
  checkMedalhas: () => api.post('/gamificacao/check-medalhas'),
}
