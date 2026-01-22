const http = require('http');

function testPort(port) {
    return new Promise((resolve) => {
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
                    console.log(`✅ Success on port ${port}!`);
                    console.log('Response:', data);
                    resolve(true);
                } else {
                    console.log(`❌ Error on port ${port}: Status ${res.statusCode}`);
                    console.log('Body:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log(`⚠️ Failed connectivity on port ${port}: ${e.message}`);
            resolve(false);
        });

        req.end();
    });
}

async function run() {
    // Try port 3000, 3001, then 3002
    let success = await testPort(3000);
    if (!success) success = await testPort(3001);
    if (!success) success = await testPort(3002);
}

run();
