// 1. استيراد دوال Firebase الحديثة جداً بالروابط المباشرة (Modular CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getDatabase, ref, push, get, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// إعدادات مشروع ك الحقيقية لتعاونية Katre Anada مع توفير رابط السيرفر المباشر
const firebaseConfig = {
  apiKey: "AIzaSyB7EBOTdj42WTx9eRWmCM6ZylIOCFdfvvs",
  authDomain: "katreanada01.firebaseapp.com",
  databaseURL: "https://katreanada01-default-rtdb.firebaseio.com", 
  projectId: "katreanada01",
  storageBucket: "katreanada01.firebasestorage.app",
  messagingSenderId: "402139545073",
  appId: "1:402139545073:web:e896d286b10a2171cad850",
  measurementId: "G-VWRJQFJWH3"
};

// تهيئة الأدوات
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth(app);

// 2. حل مشكلة الأزرار برمجياً لمنع تعارض موديولات الـ Import (Event Listeners للتبديل الذكي)
const pages = {
    'nav-auth': document.getElementById('auth-page'),
    'nav-app': document.getElementById('app-page'),
    'nav-info': document.getElementById('info-page')
};

const navLinks = document.querySelectorAll('.nav-link');

Object.keys(pages).forEach(linkId => {
    const button = document.getElementById(linkId);
    if (button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            Object.values(pages).forEach(page => page.classList.remove('active'));
            navLinks.forEach(link => link.classList.remove('active'));
            
            pages[linkId].classList.add('active');
            this.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

// التبديل بين نماذج الدخول وإنشاء حساب داخلياً
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');

if(tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginContainer.classList.add('active');
        registerContainer.classList.remove('active');
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerContainer.classList.add('active');
        loginContainer.classList.remove('active');
    });
}

// 3. نظام تشغيل المصادقة (الحسابات) بربط الـ Firebase Auth
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');

// إنشاء حساب جديد
if(registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showAuthMessage('تم إنشاء حسابك كمستشار تسويق بنجاح! يمكنك الآن الانتقال لنظام الإحالة.', 'success');
            registerForm.reset();
        })
        .catch((error) => {
            console.error(error);
            showAuthMessage('خطأ: ' + error.message, 'error');
        });
    });
}

// تسجيل الدخول لحساب قائم
if(loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showAuthMessage('تم تسجيل الدخول بنجاح! جاري توجيهك لنظام الإحالة...', 'success');
            loginForm.reset();
            setTimeout(() => { document.getElementById('nav-app').click(); }, 1500);
        })
        .catch((error) => {
            console.error(error);
            showAuthMessage('فشل تسجيل الدخول: تأكد من البريد وكلمة المرور.', 'error');
        });
    });
}

function showAuthMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = 'message ' + type;
    authMessage.style.display = 'block';
    setTimeout(() => { authMessage.style.display = 'none'; }, 5000);
}


// 4. نظام تسجيل وحفظ المبيعات بـ Realtime Database
const saleForm = document.getElementById('saleForm');
const statusMessage = document.getElementById('statusMessage');

if(saleForm) {
    saleForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const affiliateId = document.getElementById('affiliateId').value.trim().toUpperCase();
        const productName = document.getElementById('productName').value;
        const saleAmount = parseFloat(document.getElementById('saleAmount').value);

        if(!affiliateId || !saleAmount) return;

        const saleData = {
            productName: productName,
            amount: saleAmount,
            timestamp: serverTimestamp()
        };

        const dbRef = ref(database, 'affiliates/' + affiliateId + '/sales');
        push(dbRef, saleData)
        .then(() => {
            showSaleMessage('تم تدوين المبيعة بنجاح وربطها بكود الإحالة الخاص بك!', 'success');
            saleForm.reset();
        })
        .catch((error) => {
            console.error(error);
            showSaleMessage('خطأ في إرسال البيانات لسيرفر Firebase. راجع إعدادات الـ Rules.', 'error');
        });
    });
}

function showSaleMessage(text, type) {
    statusMessage.textContent = text;
    statusMessage.className = 'message ' + type;
    statusMessage.style.display = 'block';
    setTimeout(() => { statusMessage.style.display = 'none'; }, 4000);
}


// 5. جلب وحساب الأرباح والعمولات للمسوق (10%)
const searchIdInput = document.getElementById('searchId');
const searchBtn = document.getElementById('searchBtn');
const statsResult = document.getElementById('statsResult');
const totalSalesPop = document.getElementById('totalSales');
const totalCommissionPop = document.getElementById('totalCommission');

if(searchBtn) {
    searchBtn.addEventListener('click', function() {
        const searchId = searchIdInput.value.trim().toUpperCase();
        if(!searchId) {
            alert('الرجاء إدخال كود المسوق أولاً لمراقبة الأرباح');
            return;
        }

        const userSalesRef = ref(database, 'affiliates/' + searchId + '/sales');
        get(userSalesRef).then((snapshot) => {
            let totalSales = 0;
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const sale = childSnapshot.val();
                    totalSales += parseFloat(sale.amount || 0);
                });
                const commission = totalSales * 0.05;
                totalSalesPop.textContent = totalSales.toFixed(2);
                totalCommissionPop.textContent = commission.toFixed(2);
                statsResult.style.display = 'flex';
            } else {
                totalSalesPop.textContent = '0.00';
                totalCommissionPop.textContent = '0.00';
                statsResult.style.display = 'flex';
            }
        })
        .catch((error) => {
            console.error(error);
            alert('خطأ أثناء الاتصال بقاعدة البيانات.');
        });
    });
}