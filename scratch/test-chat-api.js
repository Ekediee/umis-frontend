const http = require('http');

const postData = JSON.stringify({
  messages: [{ role: 'user', content: 'What should I do if my payment failed?' }]
});

console.log("Sending diagnostic POST to http://127.0.0.1:3000/api/chat...");

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log("Headers:", JSON.stringify(res.headers, null, 2));
  
  res.setEncoding('utf8');
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    console.log("Received chunk:", JSON.stringify(chunk));
  });
  res.on('end', () => {
    console.log("Stream finished. Total length:", data.length);
  });
});

req.on('error', (e) => {
  console.error("Problem with request:", e);
});

req.write(postData);
req.end();
