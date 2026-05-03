import api from './api'

export const concursoService = {
  getAll: () => api.get('/concursos'),
  getById: (id) => api.get(`/concursos/${id}`),
  create: (data) => api.post('/concursos', data),
  update: (id, data) => api.put(`/concursos/${id}`, data),
  delete: (id) => api.delete(`/concursos/${id}`),
}
