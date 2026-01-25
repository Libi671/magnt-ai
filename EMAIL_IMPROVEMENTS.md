# שיפורים לאימייל - מדריך

## 1. כתובות URL תואמות לדומיין השולח ✅

**מה עשינו:**
- כל הקישורים עכשיו משתמשים ב-`NEXT_PUBLIC_SITE_URL` מהדומיין שלך
- יצרנו API routes שמעבירים לקישורים חיצוניים:
  - `/wa/[phone]` → WhatsApp
  - `/calendar` → Google Calendar
  - `/series-info` → Dashboard Series
  - `/workshop` → Workshop WhatsApp

**איך זה עובד:**
כל הקישורים באימייל נראים כמו:
- `https://yourdomain.com/wa/972525666536`
- `https://yourdomain.com/calendar`
- `https://yourdomain.com/series-info`
- `https://yourdomain.com/workshop`

זה משפר את המוניטין של האימייל כי כל הקישורים מאותו דומיין.

---

## 2. רשומת DMARC

**מה זה DMARC?**
DMARC (Domain-based Message Authentication, Reporting & Conformance) היא רשומת DNS שמגנה על הדומיין שלך מפני phishing ו-spoofing.

**איך ליצור רשומת DMARC:**

1. **היכנס ל-DNS של הדומיין שלך** (למשל ב-Cloudflare, GoDaddy, וכו')

2. **צור רשומת TXT חדשה:**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:your-email@wamagnet.com; ruf=mailto:your-email@wamagnet.com; pct=100
   ```

3. **הסבר על הפרמטרים:**
   - `v=DMARC1` - גרסת DMARC
   - `p=quarantine` - מה לעשות עם אימיילים שלא עוברים אימות:
     - `none` - לא לעשות כלום (רק לבדוק)
     - `quarantine` - לשלוח ל-spam
     - `reject` - לדחות לגמרי
   - `rua` - אימייל לדוחות מצטברים
   - `ruf` - אימייל לדוחות כשלים
   - `pct=100` - אחוז האימיילים להחיל את המדיניות (100% = כולם)

4. **לפני שתגדיר `p=reject`**, התחל עם `p=none` למשך שבוע-שבועיים כדי לראות שהכל עובד.

**דוגמה לרשומה:**
```
_dmarc.wamagnet.com TXT "v=DMARC1; p=none; rua=mailto:leads@wamagnet.com; ruf=mailto:leads@wamagnet.com"
```

**חשוב:** לפני DMARC, צריך להגדיר גם:
- **SPF record** - מזהה את השרתים שמותר להם לשלוח אימייל מהדומיין
- **DKIM record** - חתימה דיגיטלית על האימיילים

**SPF Record לדוגמה:**
```
Type: TXT
Name: @ (או wamagnet.com)
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM:** Resend מספקים לך את ה-DKIM record כשאתה מאמת domain אצלם.

---

## 3. תמונות מאותו דומיין

**הבעיה:**
תמונות מ-`storage.googleapis.com` עלולות להיראות חשודות ל-Gmail.

**הפתרון:**

1. **הורד את הלוגו:**
   - פתח: https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HpsRFj9upJPibhNfMR0q.png
   - שמור את התמונה

2. **העלה את התמונה ל-`public` folder:**
   ```
   public/
     logo.png
   ```

3. **הקוד כבר מוכן:**
   האימייל משתמש ב-`${baseUrl}/logo.png` שזה `https://yourdomain.com/logo.png`

**אלטרנטיבה - CDN:**
אם אתה משתמש ב-Vercel/Netlify, אפשר גם:
- להעלות ל-`public/` folder (הכי פשוט)
- להשתמש ב-Vercel Blob Storage
- להשתמש ב-Cloudflare Images

**לאחר העלאת התמונה:**
האימייל ישתמש בתמונה מהדומיין שלך, מה שמשפר את המוניטין.

---

## סיכום - מה לעשות עכשיו:

1. ✅ **URLs** - כבר תוקן בקוד
2. ⚠️ **DMARC** - צריך להגדיר ב-DNS (ראה הוראות למעלה)
3. ⚠️ **תמונה** - צריך להוריד ולהעלות ל-`public/logo.png`

**לאחר שתעשה את זה, האימייל יהיה הרבה יותר בטוח ויעבור מסנני ספאם טוב יותר!**
