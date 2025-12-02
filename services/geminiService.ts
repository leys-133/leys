import { GoogleGenAI, Content } from "@google/genai";
import { DailyProgress, PRAYER_NAMES, PrayerKey, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_ID = "gemini-2.5-flash";

// Helper to format the system instruction based on daily stats
export const generateSystemInstruction = (progress: DailyProgress): string => {
  const prayerSummary = Object.entries(progress.prayers)
    .map(([key, val]) => {
      const name = PRAYER_NAMES[key as PrayerKey];
      return `${name}: ${val.fard ? 'أدى الفرض' : 'لم يؤد الفرض'}، ${val.sunnah ? 'أدى السنة' : 'لم يؤد السنة'}`;
    })
    .join(' | ');

  const adhkarSummary = `أذكار الصباح: ${progress.adhkar.morning ? 'تم' : 'لم يتم'} | أذكار المساء: ${progress.adhkar.evening ? 'تم' : 'لم يتم'}`;
  const studySummary = `مراجعة الدروس: ${progress.study.review ? 'تم' : 'لم يتم'} | المطالعة: ${progress.study.reading ? 'تم' : 'لم يتم'}`;

  return `
    أنت "المرشد الأمين" (Al-Murshid Al-Amin)، صديق وموجه ذكي لطالب مسلم.
    
    شخصيتك:
    - تتحدث باللغة العربية بطلاقة، بأسلوب ودود، مشجع، وبسيط (غير متكلف).
    - تتصرف كأخ أكبر ناصح، يمزح أحياناً، وجاد في وقت الجد.
    - هدفك هو تحفيز الطالب على الصلاة، الدراسة، وذكر الله دون تانيب قاسي.
    
    حالة الطالب لهذا اليوم (${progress.date}):
    الصلوات: ${prayerSummary}
    الأذكار: ${adhkarSummary}
    الدراسة: ${studySummary}
    ملاحظات الطالب الخاصة: ${progress.study.notes || 'لا توجد ملاحظات'}

    توجيهات المحادثة:
    - ردودك يجب أن تكون قصيرة ومباشرة (شات).
    - استخدم الإيموجي بشكل مناسب 🕌📚✨.
    - إذا سألك الطالب عن شيء خارج الدين أو الدراسة، جاوبه باختصار ثم اربط الموضوع بهدفه.
    - تذكر تفاصيل يومه المذكورة أعلاه في ردودك (مثلاً: "كيف كانت صلاة الفجر اليوم؟ أرى أنك صليتها، بارك الله فيك!").
  `;
};

// Create a chat session with history
export const createChatSession = (history: ChatMessage[], progress: DailyProgress) => {
  // Convert local ChatMessage format to Gemini Content format
  const formattedHistory: Content[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  return ai.chats.create({
    model: MODEL_ID,
    history: formattedHistory,
    config: {
      systemInstruction: generateSystemInstruction(progress),
      temperature: 0.8, // Slightly higher for more "natural/comfortable" chat
    }
  });
};
