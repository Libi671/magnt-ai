const http = require('http');

function testPort(port) {
    console.log(`Checking port ${port}...`);
    const options = {
        hostname: 'localhost',
        port: port,
        path: '/api/test-email?email=LIBI41@gmail.com',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`✅ SUCCESS! Email sent successfully.`);
                console.log('Response:', data);
            } else {
                console.log(`❌ Error: Status ${res.statusCode}`);
                console.log('Body:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.log(`⚠️ Connection failed: ${e.message}`);
    });

    req.end();
}

testPort(3002);
