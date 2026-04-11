const https = require('https');
const http = require('http');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const handler = (req, res) => {
  Object.entries(CORS).forEach(([k,v]) => res.setHeader(k, v));
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.method === 'GET') { res.writeHead(200, {'Content-Type':'text/plain'}); res.end('GGA Proxy OK - ' + new Date().toISOString()); return; }
  if (req.method !== 'POST') { res.writeHead(405); res.end('Method not allowed'); return; }

  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    const payload = Buffer.from(body);
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'Authorization': 'Bearer ' + process.env.OR_KEY,
        'HTTP-Referer': 'https://emiranda028.github.io',
        'X-Title': 'GGA SOFSA'
      }
    };
    const r = https.request(options, or => {
      let data = '';
      or.on('data', d => data += d);
      or.on('end', () => {
        res.writeHead(or.statusCode, {'Content-Type': 'application/json'});
        res.end(data);
      });
    });
    r.on('error', e => {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: {message: e.message}}));
    });
    r.write(payload);
    r.end();
  });
};

http.createServer(handler).listen(process.env.PORT || 3000, () => {
  console.log('GGA Proxy running on port ' + (process.env.PORT || 3000));
});
