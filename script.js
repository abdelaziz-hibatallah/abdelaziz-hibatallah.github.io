// =======================================================
// 1. إعدادات Firebase Configuration
// (تم دمج الكود الخاص بك هنا)
// =======================================================
const firebaseConfig = {
    apiKey: "AIzaSyAbMO24cK1An0REveNzlVrUreW-ahAbU0k",
    authDomain: "the-ego-chat.firebaseapp.com",
    // لقد أضفت هذا الرابط يدوياً لأنه ضروري لعمل الشات
    databaseURL: "https://the-ego-chat-default-rtdb.firebaseio.com",
    projectId: "the-ego-chat",
    storageBucket: "the-ego-chat.firebasestorage.app",
    messagingSenderId: "651588994714",
    appId: "1:651588994714:web:e3b6ab50e97a510c838123",
    measurementId: "G-K3RNEXMEKB"
};

// تهيئة الاتصال بقاعدة البيانات
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// متغيرات عامة
let myUsername = "";
let myRoomCode = "";
let myLocation = "Unknown Location"; // القيمة الافتراضية

// =======================================================
// 2. دالة توليد الألوان (لتمييز المستخدمين)
// =======================================================
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // HSL يوفر ألواناً زاهية ومناسبة للخلفية السوداء
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 65%)`; 
}

// =======================================================
// 3. تسجيل الدخول + جلب الموقع (Admin Only)
// =======================================================
async function login() {
    const userIn = document.getElementById("username").value.trim();
    const roomIn = document.getElementById("room-code").value.trim();

    if (!userIn || !roomIn) {
        alert("⚠ المرجو كتابة اسم وكود للغرفة!");
        return;
    }

    // محاولة جلب الموقع (IP) وحفظه للمدير فقط
    // نستخدم خدمة ipapi المجانية
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        // نسجل المدينة والدولة والـ IP
        myLocation = `${data.city}, ${data.country_name} (${data.ip})`;
        console.log("Secure Connection Established.");
    } catch (e) {
        console.log("Mode: Anonymous (No IP Detected or AdBlock active).");
    }

    myUsername = userIn;
    myRoomCode = roomIn;

    // إخفاء شاشة الدخول وإظهار الشات
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.remove("hidden");
    document.getElementById("room-display").innerText = `الغرفة: ${myRoomCode}`;

    // تشغيل الاستماع للرسائل
    listenForMessages();
}

// =======================================================
// 4. إرسال الرسالة
// =======================================================
function sendMessage() {
    const input = document.getElementById("message-input");
    const msgText = input.value.trim();

    if (msgText === "") return;

    // إرسال البيانات لقاعدة البيانات
    db.ref("rooms/" + myRoomCode).push({
        user: myUsername,
        text: msgText,
        time: Date.now(),
        // هذا الحقل (admin_location) يُحفظ في القاعدة لكن لا يُعرض في الشات
        admin_location: myLocation 
    });

    input.value = ""; // إفراغ الخانة
    input.focus();
}

// =======================================================
// 5. استقبال الرسائل وعرضها
// =======================================================
function listenForMessages() {
    const list = document.getElementById("messages-list");

    // الاستماع لأي رسالة جديدة تضاف في هذه الغرفة
    db.ref("rooms/" + myRoomCode).on("child_added", (snapshot) => {
        const data = snapshot.val();
        
        // تنسيق الوقت
        const date = new Date(data.time);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // تحديد لون الاسم بناءً على النص
        const color = stringToColor(data.user);

        // إنشاء عنصر الرسالة
        const div = document.createElement("div");
        div.classList.add("message");
        
        // بناء المحتوى (لاحظ أننا لم نعرض admin_location هنا للعامة)
        div.innerHTML = `
            <span class="message-username" style="color: ${color}">${data.user}</span>
            <div class="message-text">${data.text}</div>
            <div class="message-time">${timeString}</div>
        `;

        list.appendChild(div);
        
        // النزول لآخر رسالة تلقائياً
        list.scrollTop = list.scrollHeight;
    });
}

// دالة الخروج
function logout() {
    window.location.reload();
}

// إرسال الرسالة عند ضغط زر Enter
document.getElementById("message-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage();
});
