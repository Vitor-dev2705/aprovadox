import api from './api'

export const questaoService = {
  getAll: (params) => api.get('/questoes', { params }),
  create: (data) => api.post('/questoes', data),
  markReviewed: (id) => api.patch(`/questoes/${id}/revisar`),
  delete: (id) => api.delete(`/questoes/${id}`),
}
