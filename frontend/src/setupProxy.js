const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Graph Server routes (port 3001) - must be defined BEFORE generic /api
  app.use('/api/neo4j', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/dashboard', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/graph', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/business-chain', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/control-tower', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/dependency', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/debug', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
  app.use('/api/domain-graph', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));

  // Backend routes (port 8008) - catches all remaining /api/* including /api/v1/chat, /api/v1/auth, etc.
  app.use('/api', createProxyMiddleware({ target: 'http://localhost:8008', changeOrigin: true }));
};
