document.addEventListener('DOMContentLoaded', () => {
    // نربط الأزرار بناءً على الـ ID الذي وضعناه سابقاً
    const btnCompany = document.querySelector('button[onclick*="askAI"]'); 
    
    if (btnCompany) {
        // نغير الوظيفة لتعمل مع Gemini الحقيقي
        btnCompany.onclick = async function() {
            const userInput = document.getElementById('msg-company').value;
            const chatBox = document.getElementById('chat-company');

            if(!userInput) return;

            // 1. إضافة سؤال المستخدم للشاشة
            chatBox.innerHTML += `<div class="text-yellow-500 mt-2">أنت: ${userInput}</div>`;
            chatBox.innerHTML += `<div id="loading" class="text-white italic animate-pulse">جاري استشارة قانون مالية 2026...</div>`;

            try {
                // 2. استدعاء Gemini عبر Firebase Cloud Functions
                const result = await askGeminiAI({ text: userInput });
                
                // 3. عرض الرد
                document.getElementById('loading').remove();
                chatBox.innerHTML += `<div class="text-green-400 mt-2 font-bold">The EGO AI:</div>`;
                chatBox.innerHTML += `<div class="text-gray-200 bg-gray-800 p-3 rounded-lg">${result.data.answer}</div>`;
                
            } catch (error) {
                document.getElementById('loading').innerText = "خطأ: تأكد من تسجيل الدخول وتفعيل خدمة Gemini.";
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        };
    }
});
