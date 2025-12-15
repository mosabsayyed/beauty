const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy graph server requests to port 3001
  app.use(
    ['/api/neo4j', '/api/dashboard', '/api/graph', '/api/business-chain'],
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );

  // Proxy main backend requests to port 8008 (includes /api/v1/debug)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8008',
      changeOrigin: true,
    })
  );
};
