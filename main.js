import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSy...", 
    authDomain: "the-ego-tax.firebaseapp.com",
    projectId: "the-ego-tax",
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const askGemini = httpsCallable(functions, 'askTheEgo');

// دالة إرسال السؤال لـ AI
document.getElementById('sendAI').addEventListener('click', async () => {
    const text = document.getElementById('aiInput').value;
    const chat = document.getElementById('chatBox');
    
    chat.innerHTML += `<div class="text-right text-yellow-500">أنت: ${text}</div>`;
    chat.innerHTML += `<div id="loading" class="italic text-gray-400 animate-pulse">جاري الاستشارة...</div>`;

    try {
        const result = await askGemini({ text: text });
        document.getElementById('loading').remove();
        chat.innerHTML += `<div class="bg-gray-800 p-3 rounded-lg mt-2 text-green-300">الرد: ${result.data.answer}</div>`;
    } catch (e) {
        document.getElementById('loading').innerText = "خطأ في الاتصال بالسيرفر";
    }
    chat.scrollTop = chat.scrollHeight;
});
