const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

exports.askTaxConsultant = functions.https.onCall(async (data, context) => {
    // التأكد من أن المستخدم مسجل دخول (أمان إضافي)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول أولاً');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `بصفتك خبير ضرائب مغربي، حلل الآتي بناءً على قانون 2026: ${data.text}`;

    const result = await model.generateContent(prompt);
    return { answer: result.response.text() };
});
