# מדריך הגדרת משתני סביבה

## איך למצוא את משתני הסביבה מ-Vercel

### דרך 1: Vercel Dashboard (הכי קל)

1. היכנס ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך (`magnt-ai` או השם שלו)
3. לחץ על **Settings** בתפריט העליון
4. לחץ על **Environment Variables** בתפריט הצד
5. תראה שם את כל משתני הסביבה:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
6. העתק את הערכים (לחיצה על העין כדי לראות אותם)

### דרך 2: Vercel CLI (אם מותקן)

```bash
vercel env pull .env.local
```

זה יוריד את כל משתני הסביבה ישירות לקובץ `.env.local`!

---

## איך למצוא את מפתחות Supabase

אם אין לך גישה ל-Vercel, אפשר למצוא את מפתחות Supabase ישירות:

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לחץ על **Settings** (⚙️) בתפריט הצד
4. לחץ על **API**
5. תמצא שם:
   - **Project URL** → זה ה-`NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → זה ה-`NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## איך למצוא את מפתח Gemini API

1. היכנס ל-[Google AI Studio](https://aistudio.google.com/apikey)
2. אם יש לך מפתח קיים, תראה אותו שם
3. אם לא, תוכל ליצור מפתח חדש

---

## אחרי שמצאת את כל הערכים

צור קובץ `.env.local` בתיקיית הפרויקט עם התוכן הבא:

```env
NEXT_PUBLIC_SUPABASE_URL=הערך_שלך_כאן
NEXT_PUBLIC_SUPABASE_ANON_KEY=הערך_שלך_כאן
GEMINI_API_KEY=הערך_שלך_כאן
```

**חשוב:** השרת יטען מחדש אוטומטית אחרי שתשמור את הקובץ!
