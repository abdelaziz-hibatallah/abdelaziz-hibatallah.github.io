// server.js - المحرك الآمن للمنصة
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // لحماية الرؤوس (Headers) من الاختراق
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config(); // لتخزين المفاتيح في ملف سري .env

const app = express();

// إعدادات الأمان
app.use(helmet()); 
app.use(cors({ origin: 'https://your-city-domain.ma' })); // السماح فقط لموقع المدينة بالوصول
app.use(express.json());

// ربط Gemini API (المفتاح مخفي في ملف .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// نقطة النهاية (Endpoint) لمعالجة الطلبات الضريبية
app.post('/api/tax-consultant', async (req, res) => {
    try {
        const { prompt, userProfile } = req.body;

        // التحقق من صحة البيانات (Validation)
        if (!prompt) return res.status(400).json({ error: "الطلب فارغ" });

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // سياق صارم (System Instructions) لضمان الدقة القانونية
        const systemContext = `
            أنت المساعد الذكي الرسمي لمدينة [اسم المدينة]. 
            تخصصك هو قانون المالية المغربي 2026. 
            يجب أن تستند إجاباتك فقط على نصوص القانون الضريبي المغربي.
            إذا كانت بيانات المستخدم المالية متوفرة (${JSON.stringify(userProfile)}), استخدمها لتحليل وضعيته بدقة.
            كن محترفاً، واضحاً، واختم دائماً بتنبيه أن هذه استشارة استرشادية.
        `;

        const result = await model.generateContent([systemContext, prompt]);
        const response = await result.response;
        
        res.json({ answer: response.text() });

    } catch (error) {
        console.error("Security Error:", error);
        res.status(500).json({ error: "حدث خطأ في معالجة البيانات المؤمنة" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));
