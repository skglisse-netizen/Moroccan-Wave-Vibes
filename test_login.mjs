import http from 'http';

async function testLogin() {
    const postData = JSON.stringify({
        username: 'SuperAdmin',
        password: '@dminSurf2026'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log("LOGIN STATUS:", res.statusCode);
            console.log("LOGIN BODY:", data);
        });
    });

    req.on('error', (e) => {
        console.error("ERROR:", e.message);
    });

    req.write(postData);
    req.end();
}
testLogin();
