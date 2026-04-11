const https = require('https');

const handler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.end(); return; }
  if (req.method !== 'POST') { res.end('GGA Proxy OK'); return; }

  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OR_KEY,
        'HTTP-Referer': 'https://emiranda028.github.io',
        'X-Title': 'GGA SOFSA'
      }
    };
    const r = https.request(options, or => {
      let data = '';
      or.on('data', d => data += d);
      or.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
      });
    });
    r.write(body);
    r.end();
  });
};

const http = require('http');
http.createServer(handler).listen(process.env.PORT || 3000);
