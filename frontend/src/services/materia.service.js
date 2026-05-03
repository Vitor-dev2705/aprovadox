import api from './api'

export const materiaService = {
  getAll: (params) => api.get('/materias', { params }),
  getById: (id) => api.get(`/materias/${id}`),
  create: (data) => api.post('/materias', data),
  update: (id, data) => api.put(`/materias/${id}`, data),
  delete: (id) => api.delete(`/materias/${id}`),
  addAssunto: (id, nome) => api.post(`/materias/${id}/assuntos`, { nome }),
  toggleAssunto: (id, assuntoId) => api.patch(`/materias/${id}/assuntos/${assuntoId}/toggle`),
}
