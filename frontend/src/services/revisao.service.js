import api from './api'

export const revisaoService = {
  getAll: (params) => api.get('/revisoes', { params }),
  getToday: () => api.get('/revisoes/hoje'),
  getCalendar: (mes) => api.get('/revisoes/calendario', { params: { mes } }),
  complete: (id) => api.patch(`/revisoes/${id}/concluir`),
}
