// הגדרת משתני סביבה ידנית לבדיקה
const RESEND_API_KEY = 're_U5caGj5B_LppzWeseZbszPCrA36KWQaxg';

async function testEmailDirectly() {
    console.log('🚀 Starting email debug script (FETCH version)...');
    console.log(`🔑 Using API Key: ${RESEND_API_KEY.substring(0, 5)}...`);

    const testData = {
        from: 'leads@wamagnet.com',
        to: 'libi41@gmail.com',
        subject: '🧪 בדיקת דיבוג מערכת - ' + new Date().toLocaleTimeString(),
        html: `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 2px solid red;">
        <h1>בדיקת מערכת (Fetch)</h1>
        <p>אם אתה רואה את ההודעה הזו - המערכת עובדת!</p>
        <hr>
        <p>זמן שליחה: ${new Date().toLocaleString()}</p>
        <p>נשלח דרך סקריפט דיבוג ישיר.</p>
      </div>
    `
    };

    try {
        console.log('⏳ Sending request to Resend API...');

        // שליחה ישירה ל-API של Resend באמצעות fetch
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();

        console.log(`✅ Response Status: ${response.status}`);
        console.log('📄 Full Response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ Resend API Error:', data);
        } else {
            console.log('🎉 Email sent successfully! ID:', data.id);
        }

    } catch (error) {
        console.error('💥 FATAL ERROR during sending:');
        console.error(error);
    }
}

// נסה לשלוח
testEmailDirectly();
