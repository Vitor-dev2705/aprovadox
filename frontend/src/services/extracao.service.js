import api from './api'

export const extracaoService = {
  extrairEdital: (data) => api.post('/extracao/edital', data),
}
