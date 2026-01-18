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

  const result = await model.generateContent(
    `סכם את השיחה הבאה בקצרה (2-3 משפטים בעברית):\n\n${conversationText}`
  );

  return result.response.text();
}
