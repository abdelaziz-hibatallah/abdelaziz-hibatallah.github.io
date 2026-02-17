// معادلات الضريبة على الدخل IR 2026 (تقديرية بناءً على الإصلاحات)
function calculateIR() {
    const income = parseFloat(document.getElementById('income').value);
    const familyDeduction = parseFloat(document.getElementById('familyStatus').value);
    let tax = 0;

    if (isNaN(income) || income <= 0) return;

    // مثال لأشطر الضريبة المغربية (يتم تحديثها وفق قانون المالية 2026)
    if (income <= 40000) tax = 0;
    else if (income <= 60000) tax = (income * 0.10) - 4000;
    else if (income <= 80000) tax = (income * 0.20) - 10000;
    else if (income <= 180000) tax = (income * 0.30) - 18000;
    else tax = (income * 0.38) - 32400;

    // خصم الأعباء العائلية
    tax = Math.max(0, tax - familyDeduction);

    const resultBox = document.getElementById('resultDisplay');
    document.getElementById('taxValue').innerText = tax.toLocaleString('fr-FR');
    resultBox.classList.remove('hidden');
}

// الربط الآمن مع Gemini API
async function sendToGemini() {
    const userInput = document.getElementById('userQuery').value;
    const chatContainer = document.getElementById('chatContainer');

    if (!userInput) return;

    // عرض رسالة المستخدم فوراً (سرعة الاستجابة)
    appendMessage(userInput, 'user');
    document.getElementById('userQuery').value = '';

    // إظهار مؤشر الكتابة
    const typingId = showTypingIndicator();

    try {
        // ملاحظة أمنية: في مشروع "مدينة"، يجب أن يكون استدعاء الـ API من خلال Server (Node.js/Python)
        // وليس من المتصفح مباشرة لحماية مفتاح الـ API.
        const response = await fetch('https://YOUR_BACKEND_SERVER.com/ask-tax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: userInput,
                context: "Moroccan Finance Law 2026"
            })
        });

        const data = await response.json();
        removeTypingIndicator(typingId);
        appendMessage(data.answer, 'ai');

    } catch (error) {
        removeTypingIndicator(typingId);
        appendMessage("عذراً، حدث خطأ في الاتصال بالخادم الآمن. حاول لاحقاً.", 'ai');
    }
}

function appendMessage(text, sender) {
    const chatContainer = document.getElementById('chatContainer');
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'flex justify-end' : 'flex justify-start';
    
    const innerDiv = document.createElement('div');
    innerDiv.className = sender === 'user' 
        ? 'max-w-[80%] p-4 bg-slate-100 text-slate-700 rounded-2xl rounded-tl-none text-sm' 
        : 'max-w-[80%] p-4 bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-md text-sm';
    
    innerDiv.innerText = text;
    msgDiv.appendChild(innerDiv);
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
