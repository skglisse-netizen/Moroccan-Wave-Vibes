import http from 'http';

async function testSettings() {
    http.get('http://localhost:3000/api/settings', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log("STATUS:", res.statusCode);
            console.log("BODY:", data);
        });
    }).on('error', (err) => {
        console.error("ERROR:", err.message);
    });
}
testSettings();
