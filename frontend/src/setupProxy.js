const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 1. Specific Graph Sidecar Routes (Port 3001)
  // Ensure these are captured first and exclusively.
  app.use(
    ['/api/neo4j', '/api/dashboard', '/api/graph', '/api/business-chain', '/api/control-tower', '/api/domain-graph'],
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug' // Enable logging to verify routing
    })
  );

  // 2. Main Backend Routes (Port 8008)
  // Proxy all other /api calls to the main backend, 
  // explicitly excluding the graph sidecar routes to prevent fall-through confusion.
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8008',
      changeOrigin: true,
      filter: (pathname, req) => {
        const graphRoutes = ['/api/neo4j', '/api/dashboard', '/api/graph', '/api/business-chain', '/api/control-tower'];
        return !graphRoutes.some(route => pathname.startsWith(route));
      }
    })
  );
};
