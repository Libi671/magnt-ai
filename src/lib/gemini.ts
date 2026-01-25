import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface Message {
  role: "user" | "model";
  content: string;
}

export async function chat(
  systemPrompt: string,
  history: Message[],
  userMessage: string
): Promise<string> {
  // Add meta instructions to every system prompt
  const metaInstructions = `
## הנחיות חובה (META):
1. ענה בקצרה מאוד - עד 120 מילים לכל היותר, אלא אם המשתמש ביקש במפורש תשובה ארוכה או שזה סיכום סופי של תהליך.
2. בין כל אבן דרך לאבן דרך - חכה לתגובת המשתמש לפני שתמשיך הלאה.
3. שאל שאלה אחת בכל פעם ואל תציף את המשתמש במידע.
4. היה ממוקד, ברור וידידותי.
5. השתמש באימוג'י במידה אבל אל תגזים.
6. עשה ירידת שורות לקריאות - אל תכתוב הכל בשורה אחת. הפרד בין נקודות עם שורה ריקה.

---
## ההנחיות של המשימה:
`;

  const fullPrompt = metaInstructions + systemPrompt;

  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: fullPrompt,
  });

  // Gemini requires history to start with 'user' role
  // Filter out any leading 'model' messages (like first_question)
  let filteredHistory = [...history];
  while (filteredHistory.length > 0 && filteredHistory[0].role === 'model') {
    filteredHistory.shift();
  }

  const chatHistory = filteredHistory.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: chatHistory,
  });

  const result = await chat.sendMessage(userMessage);
  const response = result.response;
  return response.text();
}

export async function summarizeConversation(
  history: Message[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const conversationText = history
    .map((msg) => `${msg.role === "user" ? "משתמש" : "בוט"}: ${msg.content}`)
    .join("\n");

  const prompt = `סכם את השיחה הבאה בעברית בפורמט הבא:

**סיכום השיחה:**
[סכם בקצרה את השיחה ב-2-3 משפטים]

**כאבים אפשריים:**
[זהה 2-3 כאבים או בעיות שהליד עלול להתמודד איתם, בהתבסס על השיחה]

**חלומות אפשריים:**
[זהה 2-3 חלומות או מטרות שהליד עלול לרצות להשיג, בהתבסס על השיחה]

**טיפ לתסריט שיחה:**
[תן טיפ אחד ספציפי איך להתחיל שיחה עם הליד הזה, בהתבסס על מה שנאמר בשיחה]

השיחה:
${conversationText}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export interface LeadAnalysis {
  summary: string;
  pains: string[];
  benefits: string[];
  salesScript: string;
}

export async function analyzeLeadConversation(
  history: Message[]
): Promise<LeadAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const conversationText = history
    .map((msg) => `${msg.role === "user" ? "משתמש" : "בוט"}: ${msg.content}`)
    .join("\n");

  const prompt = `נתח את השיחה הבאה בין בוט מכירות ללקוח פוטנציאלי.

השיחה:
${conversationText}

החזר תשובה בפורמט JSON בלבד (בלי markdown, בלי \`\`\`):
{
  "summary": "סיכום קצר של מה הלקוח סיפר וענה באתגר (2-3 משפטים)",
  "pains": ["כאב 1", "כאב 2", "כאב 3"],
  "benefits": ["תועלת פוטנציאלית 1", "תועלת 2"],
  "salesScript": "סילבוס קצר לתסריט שיחה: נקודות מפתח לדבר עליהן בשיחת מכירה (3-5 נקודות)"
}

הכאבים והתועלות צריכים להיות ספציפיים לפי מה שהלקוח אמר בשיחה.
התסריט צריך להתבסס על הכאבים והתועלות שזיהית.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    // Try to parse JSON, handle potential markdown code blocks
    let jsonText = responseText;
    if (responseText.includes('```')) {
      jsonText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    return JSON.parse(jsonText) as LeadAnalysis;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    // Return default values if parsing fails
    return {
      summary: "לא ניתן לסכם את השיחה",
      pains: [],
      benefits: [],
      salesScript: "לא ניתן ליצור תסריט"
    };
  }
}
