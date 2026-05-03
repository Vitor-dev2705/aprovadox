import api from './api'

export const dashboardService = {
  get: () => api.get('/dashboard'),
  getEstatisticas: () => api.get('/dashboard/estatisticas'),
}
