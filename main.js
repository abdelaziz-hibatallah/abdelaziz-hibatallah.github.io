// استيراد مكتبة Google AI مباشرة
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = "ضـع_مفتاح_GEMINI_هنا"; // احصل عليه مجاناً من Google AI Studio
const genAI = new GoogleGenerativeAI(API_KEY);

async function handleChat() {
    const userText = document.getElementById('aiInput').value;
    const chatBox = document.getElementById('chatBox');

    if (!userText) return;

    // إظهار سؤالك
    chatBox.innerHTML += `<div style="color: #c19b6c; text-align: right;">أنت: ${userText}</div>`;
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(`أنت خبير ضرائب مغربي لعام 2026: ${userText}`);
        const response = await result.response;
        
        chatBox.innerHTML += `<div style="background: #004d29; color: white; padding: 10px; border-radius: 10px; margin-top: 10px;">
            <strong>The EGO AI:</strong><br>${response.text()}
        </div>`;
    } catch (error) {
        chatBox.innerHTML += `<div style="color: red;">حدث خطأ في الاتصال بالمحرك المجاني.</div>`;
    }
}
