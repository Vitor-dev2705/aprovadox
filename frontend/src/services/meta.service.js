import api from './api'

export const metaService = {
  getAll: () => api.get('/metas'),
  create: (data) => api.post('/metas', data),
  update: (id, data) => api.put(`/metas/${id}`, data),
  delete: (id) => api.delete(`/metas/${id}`),
}
