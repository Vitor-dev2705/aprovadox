import api from './api'

export const revisaoService = {
  getAll: (params) => api.get('/revisoes', { params }),
  getToday: () => api.get('/revisoes/hoje'),
  getCalendar: (mes, ano) => api.get('/revisoes/calendario', { params: { mes, ano } }),
  complete: (id) => api.patch(`/revisoes/${id}/concluir`),
}
