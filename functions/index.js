const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ضع مفتاح الـ API هنا (سيكون مخفياً في سيرفرات جوجل)
const genAI = new GoogleGenerativeAI("ضـع_مـفـتـاح_GEMINI_هـنـا");

exports.askTheEgo = functions.https.onCall(async (data, context) => {
    // الأمان: التأكد من الطلب
    if (!data.text) return { answer: "الرجاء كتابة سؤال." };

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const systemInstruction = "أنت خبير ضرائب مغربي لعام 2026. أجب بدقة قانونية واختصار.";

    try {
        const result = await model.generateContent([systemInstruction, data.text]);
        return { answer: result.response.text() };
    } catch (error) {
        return { answer: "عذراً، الخادم الضريبي مشغول حالياً." };
    }
});
