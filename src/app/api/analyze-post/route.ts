import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Extract URLs from text
function extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s<>"]+)/g
    return text.match(urlRegex) || []
}

// Extract Facebook URL from embed code
function extractFacebookUrl(embedCode: string): string | null {
    const hrefMatch = embedCode.match(/href=([^&\s"]+)/i)
    if (hrefMatch) {
        return decodeURIComponent(hrefMatch[1])
    }
    const srcMatch = embedCode.match(/src="([^"]+)"/i)
    if (srcMatch) {
        const srcUrl = new URL(srcMatch[1])
        const hrefParam = srcUrl.searchParams.get('href')
        if (hrefParam) return hrefParam
    }
    return null
}

// Fetch content from URL
async function fetchPostContent(url: string): Promise<{ title: string; description: string } | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MagntBot/1.0)'
            }
        })
        const html = await response.text()

        // Extract og:title
        const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ||
            html.match(/<title>([^<]*)<\/title>/)
        const title = titleMatch ? titleMatch[1] : ''

        // Extract og:description
        const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ||
            html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)
        const description = descMatch ? descMatch[1] : ''

        return { title, description }
    } catch (error) {
        console.error('Error fetching URL:', error)
        return null
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, content, topic, description } = body

        // Action: analyze - Analyze post content and suggest a lead magnet
        if (action === 'analyze') {
            let postContent = content
            let extractedUrl = null

            // Check if content contains embed code
            if (content.includes('<iframe')) {
                extractedUrl = extractFacebookUrl(content)
            } else {
                // Check for direct URLs
                const urls = extractUrls(content)
                if (urls.length > 0) {
                    extractedUrl = urls[0]
                }
            }

            // If we found a URL, try to fetch its content
            let fetchedContent = null
            if (extractedUrl) {
                fetchedContent = await fetchPostContent(extractedUrl)
                if (fetchedContent?.description) {
                    postContent = fetchedContent.description
                }
            }

            // If no content could be extracted, use what user provided
            if (!postContent || postContent.includes('<iframe')) {
                return NextResponse.json({
                    error: 'לא הצלחתי לחלץ תוכן מהקישור. אנא תאר את הפוסט במילים שלך.',
                    needsManualInput: true
                })
            }

            // Use Gemini to analyze and suggest a lead magnet
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
            const prompt = `בהתבסס על התוכן הבא של פוסט ברשת חברתית:
"${postContent}"

הצע נושא קצר וממוקד למגנט לידים שיתאים לפוסט הזה.
מגנט לידים הוא משימה אינטראקטיבית שנותנת ערך למשתמש בתמורה לפרטי התקשרות.

חשוב: החזר רק את הנושא עצמו, בלי הקדמה או הסבר. משפט אחד בלבד.`

            const result = await model.generateContent(prompt)
            const suggestedTopic = result.response.text().trim()

            return NextResponse.json({
                success: true,
                suggestedTopic,
                extractedContent: fetchedContent?.description || postContent,
                extractedUrl
            })
        }

        // Action: generate_description - Generate description of what users will get
        if (action === 'generate_description') {
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
            const prompt = `בהתבסס על נושא המגנט הבא: "${topic}"

צור תיאור קצר (משפט אחד או שניים) שמתאר מה המשתמש יקבל מהמגנט הזה.
התיאור צריך להיות ברור, מושך ומדגיש את הערך שהמשתמש יקבל.

לדוגמה:
- "תקבל מדריך מעשי עם 5 צעדים לכתיבת פוסט ויראלי"
- "תגלה את הסוד לבניית תוכן שמושך לקוחות איכותיים"

חשוב: החזר רק את התיאור עצמו, בלי הקדמה או הסבר. משפט או שניים בלבד.`

            const result = await model.generateContent(prompt)
            const suggestedDescription = result.response.text().trim()

            return NextResponse.json({
                success: true,
                suggestedDescription
            })
        }

        // Action: generate_prompt - Generate AI prompt for the bot
        if (action === 'generate_prompt') {
            const { postUrl } = body
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

            const closingInstruction = postUrl
                ? `

**בסיום:**
1. לאחר השלמת אבני הדרך, כתוב סיכום קצר של מה שהמשתמש למד/חווה במגנט ושאל אותו איך היה לו ומה הוא לוקח מהחוויה.
2. לאחר שהמשתמש מגיב ומשתף את החוויה, בקש ממנו להגיב על הפוסט שדרכו הגיע כדי לעזור לאחרים לגלות את המגנט.
   שלח לו את הקישור לפוסט: ${postUrl}
   הסבר לו שזה עוזר להגיע ליותר אנשים.`
                : `

**בסיום:**
1. לאחר השלמת אבני הדרך, כתוב סיכום קצר של מה שהמשתמש למד/חווה במגנט ושאל אותו איך היה לו ומה הוא לוקח מהחוויה.
2. לאחר שהמשתמש מגיב, בקש ממנו לשתף את החוויה עם אחרים ולהמליץ.`

            const prompt = `צור הנחיות לבוט AI עבור מגנט לידים בנושא: "${topic}"
${description ? `תיאור: "${description}"` : ''}

כתוב בפורמט הבא בדיוק (בלי שום הקדמה או סיום):

**תפקיד וזהות:**
[תפקיד הבוט]

**סגנון דיבור:**
[סגנון]

**אבני דרך:**
1. [אבן דרך ראשונה]
2. [אבן דרך שנייה]
3. [אבן דרך שלישית]
${closingInstruction}

חשוב: אל תכתוב תסריט מדויק, רק אבני דרך כלליות. החזר רק את התוכן, בלי "הנה ההנחיות" או טקסט נוסף.`

            const result = await model.generateContent(prompt)
            const generatedPrompt = result.response.text().trim()

            return NextResponse.json({
                success: true,
                generatedPrompt
            })
        }

        // Action: generate_first_question - Generate opening question
        if (action === 'generate_first_question') {
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
            const prompt = `כתוב שאלת פתיחה מזמינה לאתגר בנושא: "${topic}"
${description ? `תיאור: "${description}"` : ''}

דרישות חשובות:
- השאלה חייבת להיות קלה למענה - כזו שהתשובה עליה היא "כן", "רוצה", או "בטח"
- הבן מה המטרה של האתגר ושאל את המשתמש אם הוא רוצה להשיג אותה
- השתמש במבנה כמו: "רוצה ל[מטרת האתגר]?" או "מוכן ל[מטרת האתגר]?"
- דוגמאות לשאלות טובות: "רוצה ללמוד איך לכתוב פוסט שמושך לקוחות? 🎯", "מוכן לגלות את הסוד לתוכן ויראלי? ✨"
- שאלה אחת בלבד
- עד 15 מילים
- כוללת אימוג'י אחד בסוף
- פונה ישירות למשתמש

חשוב מאוד: החזר רק את השאלה עצמה.
אסור לכתוב הקדמה כמו "נשמע מעניין" או "הנה שאלה".
אסור לכתוב סיום כמו "מה דעתך?" אחרי השאלה.
רק השאלה הנקייה, כלום לפני וכלום אחרי.`

            const result = await model.generateContent(prompt)
            const firstQuestion = result.response.text().trim()

            return NextResponse.json({
                success: true,
                firstQuestion
            })
        }

        // Action: generate_facebook_post - Generate a Facebook post for the lead magnet
        if (action === 'generate_facebook_post') {
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
            const prompt = `כתוב פוסט קצר לפייסבוק שמזמין אנשים להשתתף במגנט לידים.

נושא המגנט: "${topic}"
${description ? `תיאור: "${description}"` : ''}

דרישות:
- עד 100 מילים
- כולל 2-3 אימוג'ים
- קריאה לפעולה בסוף (לדוגמה: "רוצים? כתבו לי בתגובות!")
- סגנון ידידותי ומזמין

חשוב: החזר רק את הפוסט עצמו, בלי הקדמה או הסבר.`

            const result = await model.generateContent(prompt)
            const facebookPost = result.response.text().trim()

            return NextResponse.json({
                success: true,
                facebookPost
            })
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

    } catch (error) {
        console.error('Analyze post error:', error)
        return NextResponse.json({
            error: 'שגיאה בעיבוד הבקשה',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
