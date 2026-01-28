# Facebook Pixel Events - תיעוד אירועים

## Pixel ID: `1791348921560259`

---

## סיכום האירועים

| # | אירוע | שם ב-Facebook | איפה מופעל | קהל יעד |
|---|-------|---------------|------------|---------|
| 1 | צפייה בדף הנחיתה | `ViewContent` | עמוד הבית (`/`) | מבקרים חדשים |
| 2 | כניסה לעמוד הראשי | `PageView` | אוטומטי בכל דף | כל המבקרים |
| 3 | התחלת שיחה בצ'אט | `InitiateChat` (Custom) | HeroSection צ'אט | מתעניינים |
| 4 | התחברות למערכת | `Lead` | אחרי login מוצלח | משתמשים רשומים |
| 5 | יצירת אתגר חדש | `CreateChallenge` (Custom) | יצירת task חדש | יוצרי תוכן |
| 6 | ביצוע אתגר | `CompleteRegistration` | השלמת אתגר | משתתפים |

---

## פירוט האירועים

### 1. צפייה בדף הנחיתה (לפני התחברות)
```javascript
fbq('track', 'ViewContent', {
  content_name: 'Landing Page',
  content_category: 'Homepage'
});
```
**מיקום בקוד:** `src/app/page.tsx`  
**מתי:** כשמשתמש לא מחובר נכנס לעמוד הראשי

---

### 2. כניסה לעמוד הראשי
```javascript
fbq('track', 'PageView');
```
**מיקום בקוד:** `src/components/FacebookPixel.tsx` (אוטומטי)  
**מתי:** בכל טעינת דף

---

### 3. התחלת שיחה בצ'אט
```javascript
fbq('trackCustom', 'InitiateChat', {
  content_name: 'Hero Chat',
  page: 'Landing Page'
});
```
**מיקום בקוד:** `src/components/HeroSection.tsx`  
**מתי:** כשמשתמש שולח הודעה ראשונה בצ'אט של עמוד הבית

---

### 4. התחברות למערכת
```javascript
fbq('track', 'Lead', {
  content_name: 'User Login',
  content_category: 'Authentication'
});
```
**מיקום בקוד:** `src/app/auth/callback/route.ts` או `src/app/login/page.tsx`  
**מתי:** אחרי התחברות מוצלחת (Google OAuth)

---

### 5. יצירת אתגר חדש
```javascript
fbq('trackCustom', 'CreateChallenge', {
  content_name: challenge_title,
  value: 1
});
```
**מיקום בקוד:** `src/app/dashboard/tasks/new/page.tsx`  
**מתי:** אחרי יצירת task חדש בהצלחה

---

### 6. ביצוע/השלמת אתגר
```javascript
fbq('track', 'CompleteRegistration', {
  content_name: challenge_title,
  status: 'completed'
});
```
**מיקום בקוד:** `src/app/t/[id]/TaskClient.tsx`  
**מתי:** כשמשתתף משלים את האתגר (שולח פרטים או מסיים את כל השלבים)

---

## יצירת קהלים ב-Facebook Ads Manager

### קהל 1: מבקרים בעמוד הנחיתה
- **Event:** `ViewContent` + `PageView`
- **שימוש:** Retargeting למי שביקר אבל לא התחבר

### קהל 2: מתעניינים (דיברו עם הצ'אט)
- **Event:** `InitiateChat`
- **שימוש:** קהל חם יותר - התחילו אינטראקציה

### קהל 3: משתמשים רשומים
- **Event:** `Lead`
- **שימוש:** Upselling, עדכונים על פיצ'רים חדשים

### קהל 4: יוצרי תוכן
- **Event:** `CreateChallenge`
- **שימוש:** Power users - הכי מעורבים

### קהל 5: משתתפים באתגרים
- **Event:** `CompleteRegistration`
- **שימוש:** קהל של לקוחות פוטנציאליים של היוצרים

---

## Lookalike Audiences מומלצים

1. **Lookalike מיוצרי אתגרים** - למצוא עוד אנשים שירצו ליצור תוכן
2. **Lookalike ממשתתפים** - למצוא עוד אנשים שמתעניינים באתגרים
3. **Lookalike ממי שהתחבר** - למצוא עוד משתמשים פוטנציאליים

---

## הערות טכניות

- כל האירועים מוגדרים ב: `src/components/FacebookPixel.tsx`
- ה-Pixel ID מוגדר ב: `.env.local` כ-`NEXT_PUBLIC_FACEBOOK_PIXEL_ID`
- האירועים נשלחים רק כשה-Pixel ID מוגדר (לא ישלחו בסביבת פיתוח ללא הגדרה)

---

## מיקומים בקוד (עודכן)

| אירוע | קובץ | הערות |
|-------|------|-------|
| ViewContent (Landing) | `src/components/LandingPageTracker.tsx` | נטען ב-`page.tsx` |
| PageView | `src/components/FacebookPixel.tsx` | אוטומטי בכל דף |
| InitiateChat | `src/components/HeroSection.tsx` | בפונקציית `sendMessage` |
| Lead (Login) | `src/components/LoginTracker.tsx` | נטען ב-`dashboard/layout.tsx` |
| CreateChallenge | `src/app/dashboard/tasks/new/page.tsx` | בפונקציית `handleSaveTask` |
| CompleteRegistration | `src/app/t/[id]/TaskClient.tsx` | לפני `setCompleted(true)` |

---

## מדריך השקה
מעוניין להשיק קמפיין? [קרא את מדריך ההקמה המלא](FACEBOOK_CAMPAIGN_GUIDE.md) שמסביר איך להשתמש באירוע `CreateChallenge` כמטרת המרה.
