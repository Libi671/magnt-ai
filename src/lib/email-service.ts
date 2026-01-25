import { Resend } from 'resend';
import { LeadAnalysis } from './gemini';

// Lazy initialization to avoid build-time errors
let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export interface LeadEmailData {
  // Task info
  taskTitle: string;
  taskCreatorEmail: string;
  // Lead info
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  // Analysis (optional - only if enough messages)
  analysis?: LeadAnalysis;
  hasEnoughMessages: boolean;
  messageCount: number;
}

export async function sendLeadNotificationEmail(data: LeadEmailData) {
  const whatsappLink = `https://wa.me/972${data.leadPhone.replace(/^0/, '').replace(/[^0-9]/g, '')}`;

  const emailHtml = generateEmailHtml(data, whatsappLink);

  try {
    const result = await getResend().emails.send({
      from: 'Magnt.AI <leads@wamagnet.com>',
      to: data.taskCreatorEmail,
      subject: `🧲 ליד חדש מהמגנט: ${data.taskTitle} - ${data.leadName}`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

function generateEmailHtml(data: LeadEmailData, whatsappLink: string): string {
  const analysisSection = data.hasEnoughMessages && data.analysis ? `
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #667eea; margin: 0 0 16px 0; font-size: 18px;">📋 דוח ניתוח השיחה</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #a78bfa; margin: 0 0 8px 0; font-size: 14px;">סיכום השיחה:</h3>
        <p style="color: #e0e0e0; margin: 0; line-height: 1.6;">${data.analysis.summary}</p>
      </div>
      
      ${data.analysis.pains.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f87171; margin: 0 0 8px 0; font-size: 14px;">🎯 כאבים שזוהו:</h3>
        <ul style="color: #e0e0e0; margin: 0; padding-right: 20px; line-height: 1.8;">
          ${data.analysis.pains.map(pain => `<li>${pain}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${data.analysis.benefits.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #4ade80; margin: 0 0 8px 0; font-size: 14px;">✨ תועלות פוטנציאליות:</h3>
        <ul style="color: #e0e0e0; margin: 0; padding-right: 20px; line-height: 1.8;">
          ${data.analysis.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div>
        <h3 style="color: #fbbf24; margin: 0 0 8px 0; font-size: 14px;">📞 תסריט שיחה מוצע:</h3>
        <p style="color: #e0e0e0; margin: 0; line-height: 1.6; white-space: pre-wrap;">${data.analysis.salesScript}</p>
      </div>
    </div>
  ` : `
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #fbbf24;">
      <p style="color: #fbbf24; margin: 0; font-size: 14px;">
        ⚠️ <strong>שים לב:</strong> ליד זה ענה רק ${data.messageCount} הודעות (פחות מ-4), לכן לא שלחנו לך סיכום ודוח מפורט.
        <br><br>
        מומלץ ליצור קשר ולברר אם יש עניין בשירות שלך.
      </p>
    </div>
  `;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 32px 0; border-bottom: 1px solid #333;">
      <img src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HpsRFj9upJPibhNfMR0q.png" alt="Magnt.AI" style="height: 40px;">
      <h1 style="color: white; margin: 16px 0 0 0; font-size: 24px;">🧲 ליד חדש הגיע!</h1>
      <p style="color: #a0a0a0; margin: 8px 0 0 0;">מהמגנט: ${data.taskTitle}</p>
    </div>
    
    <!-- Lead Details -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h2 style="color: white; margin: 0 0 16px 0; font-size: 18px;">פרטי הליד</h2>
      
      <table style="width: 100%; color: white;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">👤 שם:</td>
          <td style="padding: 8px 0;">${data.leadName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">📱 טלפון:</td>
          <td style="padding: 8px 0;"><a href="tel:${data.leadPhone}" style="color: white;">${data.leadPhone}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">📧 אימייל:</td>
          <td style="padding: 8px 0;"><a href="mailto:${data.leadEmail}" style="color: white;">${data.leadEmail}</a></td>
        </tr>
      </table>
      
      <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
        💬 שלח הודעה בווטסאפ
      </a>
    </div>
    
    <!-- Analysis Section -->
    ${analysisSection}
    
    <!-- Advertisement 1 -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 12px; padding: 24px; margin-bottom: 16px; text-align: center;">
      <h2 style="color: white; margin: 0 0 12px 0; font-size: 20px;">🔥 יצרת מגנט וקיבלת לידים?</h2>
      <p style="color: white; margin: 0 0 16px 0; line-height: 1.6;">
        אם הלידים ששלחתי לך עדיין קרים ואתה לא מצליח לגרום להם לרכוש, כנראה שאתה צריך ליצור במערכת <strong>מרתיח לידים</strong>.
      </p>
      <a href="https://magnt-ai.vercel.app/dashboard/series" style="display: inline-block; background: white; color: #ef4444; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-left: 8px;">
        למידע נוסף על מרתיח לידים
      </a>
      <a href="https://calendar.app.google/CRFCj1XM5NKBSEGB8" style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; border: 2px solid white;">
        📅 קבע פגישה
      </a>
      <p style="color: white; margin: 16px 0 0 0; font-size: 14px;">
        או שלח ווטסאפ: <a href="https://wa.me/972525666536" style="color: white;">0525666536</a>
      </p>
    </div>
    
    <!-- Advertisement 2 -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; text-align: center; border: 2px solid #667eea;">
      <h2 style="color: #667eea; margin: 0 0 12px 0; font-size: 18px;">🎓 רוצה להבין איך עובד מרתיח לידים?</h2>
      <p style="color: #e0e0e0; margin: 0 0 16px 0; line-height: 1.6;">
        אנו מזמינים אותך לקבל סדנא וירטואלית שתגרום לך להיות מגנט ומרתיח לידים מקצועי.
      </p>
      <a href="https://wa.me/972583654698?text=ברור" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        🎯 רוצה לקבל סדנת לחימום לידים?
      </a>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 24px 0; margin-top: 24px; border-top: 1px solid #333;">
      <p style="color: #666; margin: 0; font-size: 12px;">
        נשלח על ידי Magnt.AI - מערכת מגנטים ומחממי לידים
      </p>
    </div>
    
  </div>
</body>
</html>
  `;
}
