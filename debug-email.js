const { Resend } = require('resend');

// הגדרת משתני סביבה ידנית לבדיקה
const RESEND_API_KEY = 're_U5caGj5B_LppzWeseZbszPCrA36KWQaxg';

async function testEmailDirectly() {
    console.log('🚀 Starting email debug script...');
    console.log(`🔑 Using API Key: ${RESEND_API_KEY.substring(0, 5)}...`);

    const resend = new Resend(RESEND_API_KEY);

    const testData = {
        // נסה לשלוח גם מ-onboarding@resend.dev לבדיקה אם זו בעיית דומיין
        from: 'leads@wamagnet.com',
        to: 'libi41@gmail.com',
        subject: '🧪 בדיקת דיבוג מערכת - ' + new Date().toLocaleTimeString(),
        html: `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 2px solid red;">
        <h1>בדיקת מערכת</h1>
        <p>אם אתה רואה את ההודעה הזו - המערכת עובדת!</p>
        <hr>
        <p>זמן שליחה: ${new Date().toLocaleString()}</p>
        <p>נשלח דרך סקריפט דיבוג ישיר.</p>
      </div>
    `
    };

    console.log('📦 Preparing to send email with data:', JSON.stringify({ ...testData, html: '[HTML Content]' }, null, 2));

    try {
        console.log('⏳ Sending request to Resend API...');

        const data = await resend.emails.send(testData);

        console.log('✅ Response received from Resend:');
        console.log(JSON.stringify(data, null, 2));

        if (data.error) {
            console.error('❌ Resend returned an error object:', data.error);
        } else {
            console.log('🎉 Email sent successfully! ID:', data.data?.id);
        }

    } catch (error) {
        console.error('💥 FATAL ERROR during sending:');
        console.error(error);

        if (error.response) {
            console.error('Server responded with:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// נסה לשלוח
testEmailDirectly();
