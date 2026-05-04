import api from './api'

export const conteudoService = {
  getByMateria: (materiaId) => api.get(`/conteudos/materia/${materiaId}`),
  create: (data) => api.post('/conteudos', data),
  update: (id, data) => api.put(`/conteudos/${id}`, data),
  toggle: (id) => api.patch(`/conteudos/${id}/toggle`),
  delete: (id) => api.delete(`/conteudos/${id}`),
}
