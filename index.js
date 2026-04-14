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
  if (req.method === 'GET') {
    const keyOk = process.env.ANTHROPIC_KEY ? 'KEY_PRESENT('+process.env.ANTHROPIC_KEY.substring(0,12)+'...)' : 'KEY_MISSING';
    const orOk  = process.env.OR_KEY ? 'OR_PRESENT' : 'OR_MISSING';
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end('GGA Proxy OK - ' + new Date().toISOString() + ' | ' + keyOk + ' | ' + orOk);
    return;
  }
  if (req.method !== 'POST') { res.writeHead(405); res.end('Method not allowed'); return; }

  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    let parsed;
    try { parsed = JSON.parse(body); } catch(e) {
      res.writeHead(400, {'Content-Type':'application/json'});
      res.end(JSON.stringify({error:{message:'Invalid JSON'}}));
      return;
    }

    if (parsed.provider === 'anthropic') {
      console.log('[ANTHROPIC] Request - model:', parsed.model, '| key:', process.env.ANTHROPIC_KEY ? process.env.ANTHROPIC_KEY.substring(0,15)+'...' : 'MISSING');
      delete parsed.provider;
      const payload = Buffer.from(JSON.stringify(parsed));
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length,
          'x-api-key': process.env.ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01'
        }
      };
      const r = https.request(options, ar => {
        let data = '';
        ar.on('data', d => data += d);
        ar.on('end', () => {
          console.log('[ANTHROPIC] Response status:', ar.statusCode);
          if (ar.statusCode !== 200) console.log('[ANTHROPIC] Error body:', data.substring(0, 300));
          res.writeHead(ar.statusCode, {'Content-Type':'application/json'});
          res.end(data);
        });
      });
      r.on('error', e => {
        console.log('[ANTHROPIC] Network error:', e.message);
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error:{message:e.message}}));
      });
      r.write(payload);
      r.end();

    } else {
      console.log('[OPENROUTER] Request - model:', parsed.model);
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
          console.log('[OPENROUTER] Response status:', or.statusCode);
          if (or.statusCode !== 200) console.log('[OPENROUTER] Error body:', data.substring(0, 300));
          res.writeHead(or.statusCode, {'Content-Type':'application/json'});
          res.end(data);
        });
      });
      r.on('error', e => {
        console.log('[OPENROUTER] Network error:', e.message);
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({error:{message:e.message}}));
      });
      r.write(payload);
      r.end();
    }
  });
};

http.createServer(handler).listen(process.env.PORT || 3000, () => {
  console.log('GGA Proxy running on port ' + (process.env.PORT || 3000));
  console.log('ANTHROPIC_KEY:', process.env.ANTHROPIC_KEY ? process.env.ANTHROPIC_KEY.substring(0,15)+'...' : 'NOT SET');
  console.log('OR_KEY:', process.env.OR_KEY ? 'SET' : 'NOT SET');
});
