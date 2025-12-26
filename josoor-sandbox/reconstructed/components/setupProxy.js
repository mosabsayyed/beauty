const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 1. Graph Server Routes (Port 3001) [Source: 305, 294]
  // Must be defined BEFORE the generic /api catchall to take precedence
  app.use(
    [
      '/api/neo4j',
      '/api/dashboard', // Graph-specific dashboard data
      '/api/graph',
      '/api/business-chain',
      '/api/control-tower',
      '/api/dependency',
      '/api/domain-graph',
      '/api/summary-stream' // Added per conversation
    ],
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );

  // 2. Main Backend Routes (Port 8008) [Source: 295, 307]
  // Handles Supabase, Auth, Chat, and V1 Dashboard endpoints
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8008',
      changeOrigin: true,
      pathRewrite: {
        // Ensure no path rewriting occurs unless explicitly needed
      }
    })
  );
};
