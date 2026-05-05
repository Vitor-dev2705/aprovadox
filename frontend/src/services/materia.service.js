import api from './api'

export const materiaService = {
  getAll: (params) => api.get('/materias', { params }),
  getById: (id) => api.get(`/materias/${id}`),
  create: (data) => api.post('/materias', data),
  update: (id, data) => api.put(`/materias/${id}`, data),
  delete: (id) => api.delete(`/materias/${id}`),
  // Aceita string OU objeto { nome, conteudo_id }
  addAssunto: (id, data) => {
    const payload = typeof data === 'string' ? { nome: data } : data
    return api.post(`/materias/${id}/assuntos`, payload)
  },
  toggleAssunto: (id, assuntoId) => api.patch(`/materias/${id}/assuntos/${assuntoId}/toggle`),
}
