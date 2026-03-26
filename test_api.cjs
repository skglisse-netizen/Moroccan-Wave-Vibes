const http = require('http');

function testEndpoint(path, data) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`PATH: ${path}`);
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`BODY: ${body}`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`ERROR for ${path}: ${e.message}`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('Testing Contact endpoint...');
  await testEndpoint('/api/public/contact', {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Subject',
    message: 'Test message content'
  });

  console.log('\nTesting Reservation endpoint (with all fields)...');
  await testEndpoint('/api/public/reservations', {
    name: 'Test User',
    email: 'test@example.com',
    phone: '0612345678',
    service_id: 1,
    date: '2026-03-20',
    time: '10:00',
    guests: 2
  });

  console.log('\nTesting Reservation endpoint (missing date)...');
  await testEndpoint('/api/public/reservations', {
    name: 'Test User',
    email: 'test@example.com',
    phone: '0612345678',
    service_id: 1,
    time: '10:00',
    guests: 2
  });
}

runTests();
