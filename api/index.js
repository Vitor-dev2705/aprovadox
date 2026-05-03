// Vercel Serverless Function — wrapper do Express
// Recebe TODAS as rotas /api/* e delega para o app Express
const app = require('../backend/src/server');

module.exports = (req, res) => {
  return app(req, res);
};
