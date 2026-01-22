const fetch = require('node-fetch');

async function testEmail() {
    const email = 'LIBI41@gmail.com';
    // נסה קודם פורט 3000, ואם לא מצליח אז 3001 (כי ראינו שהיה תפוס)
    const ports = [3000, 3001];

    for (const port of ports) {
        console.log(`Trying port ${port}...`);
        try {
            const response = await fetch(`http://localhost:${port}/api/test-email?email=${email}`, {
                method: 'GET',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ SUCCESS! Email sent successfully.');
                console.log('Response:', JSON.stringify(data, null, 2));
                return;
            } else {
                console.log(`❌ Server returned error on port ${port}:`, response.status);
                const text = await response.text();
                console.log('Error details:', text);
            }
        } catch (error) {
            console.log(`⚠️ Could not connect to port ${port}:`, error.message);
        }
    }

    console.log('❌ Failed to connect on all ports. Is the server running?');
}

testEmail();
