import http from 'http';

const req = http.get('http://2.24.99.187:8000/api/v1/applications/p10i63vuzaejlphawq5hgs42', {
  headers: {
    'Authorization': 'Bearer 10|NP4yiFPOr4ncPklzdNwyWaCMpyrh6YBsYU6huFLu6a418791',
    'Accept': 'application/json'
  },
  timeout: 5000
}, (res) => {
  console.log('Status:', res.statusCode);
  let d = '';
  res.on('data', chunk => d += chunk);
  res.on('end', () => console.log('Data:', d.slice(0, 200)));
});

req.on('error', (e) => console.log('Req error:', e.code, e.message));
req.on('timeout', () => {
  console.log('Timeout on port 8000');
  req.destroy();
});
