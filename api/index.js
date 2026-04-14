const app = require('../task-api/src/app');

module.exports = (req, res) => {
  const host = req.headers.host || 'localhost';
  const requestUrl = new URL(req.url, `http://${host}`);
  const rewrittenPath = requestUrl.searchParams.get('path');

  if (rewrittenPath) {
    const params = new URLSearchParams(requestUrl.searchParams);
    params.delete('path');
    req.url = `/${rewrittenPath}${params.toString() ? `?${params.toString()}` : ''}`;
  } else if (requestUrl.pathname === '/api') {
    req.url = '/';
  }

  return app(req, res);
};
