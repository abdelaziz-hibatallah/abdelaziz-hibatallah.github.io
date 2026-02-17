// معادلات الضريبة المغربية 2026
function calculateTax(income, kids) {
    let tax = 0;
    // أشطر الضريبة (مثال تقريبي لقانون 2026)
    if (income <= 40000) tax = 0;
    else if (income <= 60000) tax = (income * 0.10) - 4000;
    else if (income <= 80000) tax = (income * 0.20) - 10000;
    else tax = (income * 0.38) - 32400;

    // خصم الأعباء العائلية (360 درهم لكل طفل في السنة)
    let deductions = kids * 360;
    return Math.max(0, tax - deductions);
}

// دالة التشغيل الرئيسية
async function runApp() {
    const inc = document.getElementById('incomeInput').value;
    const kids = document.getElementById('kidsInput').value;
    
    if(!inc) return alert("الرجاء إدخال الدخل السنوي");

    const finalTax = calculateTax(inc, kids);
    document.getElementById('taxRes').innerText = finalTax.toLocaleString();
    document.getElementById('resultBox').classList.remove('hidden');
    
    // إرسال البيانات تلقائياً للمستشار لتحليلها
    askAI(`دخل السنوي هو ${inc} درهم وعندي ${kids} أطفال، حلل وضعي ضريبياً.`);
}

// الربط مع Gemini عبر Backend آمن (سنتطرق له في Firebase)
async function askAI(directPrompt = null) {
    const userMsg = directPrompt || document.getElementById('userMsg').value;
    const chatWindow = document.getElementById('chatWindow');

    if(!userMsg) return;

    chatWindow.innerHTML += `<div class="bg-blue-600 self-end p-3 rounded-2xl ml-10 text-right">${userMsg}</div>`;
    
    // هنا سيتم الربط مع Firebase Functions لاحقاً
    chatWindow.innerHTML += `<div class="bg-slate-800 p-3 rounded-2xl mr-10 animate-pulse">جاري تحليل بيانات قانون مالية 2026...</div>`;
    
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
