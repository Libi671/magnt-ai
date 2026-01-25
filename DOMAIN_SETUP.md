# מדריך הגדרת דומיין מותאם אישית (WAMAGNT.COM)

## הבעיה
אחרי התחברות, המשתמשים מועברים ל-`magnt-ai.vercel.app` במקום ל-`wamagnt.com`.

## הפתרון - צריך לעדכן ב-2 מקומות:

---

## 1. הגדרת Supabase (חשוב ביותר!)

### שלב 1: היכנס ל-Supabase Dashboard
1. לך ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לחץ על **Authentication** בתפריט הצד
4. לחץ על **URL Configuration**

### שלב 2: עדכן את Site URL
בשדה **Site URL**, הזן:
```
https://wamagnt.com
```

**⚠️ חשוב:** אם ה-Site URL מוגדר ל-`https://magnt-ai.vercel.app`, זה יכול לגרום לבעיות! שנה אותו ל-`https://wamagnt.com`.

### שלב 3: הוסף Redirect URLs
בשדה **Redirect URLs**, הוסף את כל ה-URLs הבאים (כל אחד בשורה נפרדת):

**⚠️ חשוב:** אם יש לך כבר `http://localhost:3000` בלי `/auth/callback`, תמחק אותו ותוסיף את הגרסה המלאה!

```
http://localhost:3000/auth/callback
http://localhost:3000/**
https://wamagnt.com/auth/callback
https://wamagnt.com/**
https://magnt-ai.vercel.app/auth/callback
https://magnt-ai.vercel.app/**
```

**הסבר:**
- `http://localhost:3000/auth/callback` - **חובה!** לפיתוח מקומי (לא רק `localhost:3000`)
- `http://localhost:3000/**` - מאפשר כל path תחת localhost
- `https://wamagnt.com/auth/callback` - הדומיין החדש שלך
- `https://magnt-ai.vercel.app/auth/callback` - הדומיין הישן (לשמירה על תאימות)

**💡 טיפ:** אם אתה רואה `http://localhost:3000` בלי `/auth/callback` - מחק אותו! זה לא יעבוד.

### שלב 4: שמור
לחץ על **Save** בתחתית הדף.

---

## 2. הגדרת Vercel (חיבור הדומיין)

### שלב 1: היכנס ל-Vercel Dashboard
1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך (`magnt-ai`)

### שלב 2: הוסף דומיין מותאם אישית
1. לחץ על **Settings** בתפריט העליון
2. לחץ על **Domains** בתפריט הצד
3. לחץ על **Add Domain**
4. הזן: `wamagnt.com`
5. לחץ על **Add**

### שלב 3: הגדר DNS
Vercel ייתן לך הוראות להגדרת DNS. בדרך כלל צריך:
- **A Record** או **CNAME Record** שמצביע ל-Vercel
- Vercel יראה לך בדיוק מה להגדיר

### שלב 4: המתן לאימות
- זה יכול לקחת כמה דקות עד כמה שעות
- Vercel יבדוק שהדומיין מוגדר נכון
- כשיהיה מוכן, תראה ✅ ליד הדומיין

---

## 3. אימות שהכל עובד

### בדיקה מקומית:
1. פתח את `http://localhost:3000/login`
2. התחבר עם Google
3. בדוק שאתה מועבר ל-`http://localhost:3000/dashboard` (לא ל-vercel.app)

### בדיקה בייצור:
1. פתח את `https://wamagnt.com/login`
2. התחבר עם Google
3. בדוק שאתה מועבר ל-`https://wamagnt.com/dashboard` (לא ל-vercel.app)

---

## פתרון בעיות

### אם עדיין מועבר ל-vercel.app:
1. **נקה את ה-Cache** - לחץ Ctrl+Shift+Delete וצור cookies/cache
2. **בדוק ב-Supabase** - ודא שה-Redirect URLs נשמרו נכון
3. **בדוק את ה-Console** - פתח Developer Tools (F12) וראה אם יש שגיאות

### אם הדומיין לא עובד:
1. **בדוק DNS** - ודא שה-DNS Records מוגדרים נכון
2. **המתן** - לפעמים לוקח זמן עד שהדומיין מתעדכן
3. **בדוק ב-Vercel** - ודא שהדומיין מאומת (✅)

---

## הערות חשובות

⚠️ **חשוב:** אחרי שתעדכן את Supabase, ייתכן שיהיה צורך להתחבר מחדש.

✅ **טיפ:** תמיד שמור גם את הדומיין הישן (vercel.app) ב-Redirect URLs כדי לא לשבור משתמשים קיימים.

🔒 **אבטחה:** ודא ש-`wamagnt.com` מוגדר כ-**Site URL** הראשי ב-Supabase.
