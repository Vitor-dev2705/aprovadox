import api from './api'

export const sessaoService = {
  getAll: (params) => api.get('/sessoes', { params }),
  getStats: () => api.get('/sessoes/stats'),
  create: (data) => api.post('/sessoes', data),
  delete: (id) => api.delete(`/sessoes/${id}`),
}
