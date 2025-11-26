const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://ihi-project.onrender.com',
      changeOrigin: true,
      secure: false,
    })
  );
};



