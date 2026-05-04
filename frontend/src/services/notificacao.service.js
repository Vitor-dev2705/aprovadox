import api from './api'

export const notificacaoService = {
  getAll: () => api.get('/notificacoes'),
}
