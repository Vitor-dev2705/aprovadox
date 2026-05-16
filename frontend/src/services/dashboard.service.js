import api from './api'

export const dashboardService = {
  get: () => api.get('/dashboard'),
  getEstatisticas: () => api.get('/dashboard/estatisticas'),
  getCalendario: (mes) => api.get(`/dashboard/calendario${mes ? `?mes=${mes}` : ''}`),
  getAtividades: (data) => api.get(`/dashboard/atividades${data ? `?data=${data}` : ''}`),
}
