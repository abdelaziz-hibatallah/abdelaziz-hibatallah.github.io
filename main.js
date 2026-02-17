// 1. استيراد المكتبات اللازمة من Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

// 2. إعدادات Firebase الخاصة بمشروعك (TaxTech)
const firebaseConfig = {
  apiKey: "AIzaSyA0E4YmwONbnFdVUGErQjjqO2onIUkfGI8",
  authDomain: "the-ego-taxtech.firebaseapp.com",
  projectId: "the-ego-taxtech",
  storageBucket: "the-ego-taxtech.firebasestorage.app",
  messagingSenderId: "42792102209",
  appId: "1:42792102209:web:e27de237be4c9eca5399c0",
  measurementId: "G-K3B75Z3CNX"
};

// 3. تهيئة التطبيق والوظائف السحابية
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// 4. الربط مع الدالة السحابية التي ستتحدث مع Gemini
// ملاحظة: يجب أن تكون قد رفعت الدالة باسم 'askTheEgo' في Firebase Functions
const askTheEgoAI = httpsCallable(functions, 'askTheEgo');

// 5. وظيفة معالجة الدردشة وإظهار ردود الذكاء الاصطناعي
async function handleChat() {
    const inputField = document.getElementById('aiInput');
    const chatBox = document.getElementById('chatBox');
    const userText = inputField.value;

    if (!userText) return;

    // إظهار سؤالك في الشاشة
    chatBox.innerHTML += `<div style="color: #c19b6c; text-align: right; margin-bottom: 10px; font-weight: bold;">أنت: ${userText}</div>`;
    
    // إظهار مؤشر الانتظار (جمالية مغربية)
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `<div id="${loadingId}" style="color: #666; font-style: italic; margin-bottom: 10px;">جاري استشارة خبير Gemini للضرائب...</div>`;
    
    inputField.value = ""; 
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // الاتصال بالسيرفر (Cloud Function)
        const result = await askTheEgoAI({ text: userText });
        
        // مسح مؤشر الانتظار وعرض النتيجة
        document.getElementById(loadingId).remove();
        chatBox.innerHTML += `
            <div style="background: #004d29; color: white; padding: 12px; border-radius: 12px; margin-bottom: 20px; border-right: 5px solid #c19b6c; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong style="color: #ffd700; display: block; margin-bottom: 5px;">The EGO AI:</strong>
                <span style="line-height: 1.6;">${result.data.answer}</span>
            </div>
        `;
    } catch (error) {
        if (document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        chatBox.innerHTML += `<div style="color: #e53e3e; font-size: 12px; margin-bottom: 10px;">⚠️ خطأ: تأكد من تفعيل خطة Blaze في Firebase للوصول إلى Gemini.</div>`;
        console.error("Firebase Function Error:", error);
    }
    
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 6. تشغيل الكود عند تحميل الصفحة وربطه بالأزرار
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendAI');
    if (sendBtn) {
        sendBtn.onclick = handleChat;
    }
    
    const inputField = document.getElementById('aiInput');
    if (inputField) {
        inputField.onkeypress = (e) => { if (e.key === 'Enter') handleChat(); };
    }
});
