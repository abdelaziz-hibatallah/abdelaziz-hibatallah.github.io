// ==========================================
// 1. Translations (الترجمة)
// ==========================================
const translations = {
    en: {
        subtitle: "IDENTITY VERIFICATION",
        phUser: "Username",
        phPass: "Password (4-10 digits)",
        phRoom: "Room ID (4-8 digits or 0)",
        btnEnter: "ACCESS SYSTEM 🔒",
        btnSend: "SEND",
        errorPass: "Password must be 4-10 digits!",
        errorRoom: "Room must be '0' or 4-8 digits!",
        errorFill: "Fill all fields!",
        errorAuth: "Incorrect Password!",
        errorReserved: "IDENTITY RESERVED FOR ADMIN ⛔",
        roomPrefix: "Sector:",
        micError: "Microphone access denied!"
    },
    fr: {
        subtitle: "VÉRIFICATION D'IDENTITÉ",
        phUser: "Nom d'utilisateur",
        phPass: "Mot de passe (4-10 chiffres)",
        phRoom: "ID Salle (4-8 chiffres ou 0)",
        btnEnter: "ACCÉDER AU SYSTÈME 🔒",
        btnSend: "ENVOYER",
        errorPass: "Mot de passe invalide !",
        errorRoom: "ID Salle invalide !",
        errorFill: "Champs vides !",
        errorAuth: "Mot de passe incorrect !",
        errorReserved: "IDENTITÉ RÉSERVÉE À L'ADMIN ⛔",
        roomPrefix: "Secteur :",
        micError: "Micro refusé !"
    },
    ar: {
        subtitle: "التحقق من الهوية",
        phUser: "اسم المستخدم",
        phPass: "كلمة المرور (4-10 أرقام)",
        phRoom: "رقم الغرفة (0 أو 4-8 أرقام)",
        btnEnter: "دخول للنظام 🔒",
        btnSend: "إرسال",
        errorPass: "كلمة المرور غير صالحة!",
        errorRoom: "رقم الغرفة غير صالح!",
        errorFill: "المرجو ملء الخانات!",
        errorAuth: "كلمة المرور خاطئة!",
        errorReserved: "هوية محفوظة للأدمن فقط ⛔",
        roomPrefix: "القطاع:",
        micError: "الميكروفون مغلق!"
    }
};

let currentLang = 'en';

function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    if (lang === 'ar') document.documentElement.setAttribute('dir', 'rtl');
    else document.documentElement.setAttribute('dir', 'ltr');

    document.getElementById('lbl-subtitle').innerText = t.subtitle;
    document.getElementById('username').placeholder = t.phUser;
    document.getElementById('password').placeholder = t.phPass;
    document.getElementById('room-code').placeholder = t.phRoom;
    document.getElementById('btn-enter').innerText = t.btnEnter;
    document.getElementById('btn-send').innerText = t.btnSend;

    document.getElementById('lang-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

// ==========================================
// 2. Firebase Config
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAbMO24cK1An0REveNzlVrUreW-ahAbU0k",
    authDomain: "theegochat.firebaseapp.com",
    databaseURL: "https://theegochat-default-rtdb.firebaseio.com",
    projectId: "theegochat",
    storageBucket: "theegochat.firebasestorage.app",
    messagingSenderId: "651588994714",
    appId: "1:651588994714:web:e3b6ab50e97a510c838123"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let myUsername = "";
let myRoomCode = "";
let myLocation = "Unknown";
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// ==========================================
// 3. Logic (Auth + Admin Dashboard)
// ==========================================
function getPreciseLocation() {
    return new Promise((resolve) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve(`GPS: ${position.coords.latitude}, ${position.coords.longitude}`);
                },
                async () => {
                    try {
                        const res = await fetch('https://ipapi.co/json/');
                        const data = await res.json();
                        resolve(`IP: ${data.city}, ${data.country_name}`);
                    } catch(e) { resolve("Hidden Location"); }
                }
            );
        } else { resolve("No GPS Support"); }
    });
}

// ⚠️ هذه هي الدالة المعدلة لإصلاح مشكلة الأدمن
async function handleAuth() {
    const t = translations[currentLang];
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const room = document.getElementById("room-code").value.trim(); // تأكدنا من إزالة الفراغات
    const errorMsg = document.getElementById("error-msg");

    errorMsg.innerText = "";

    if (!user || !pass || !room) { errorMsg.innerText = t.errorFill; return; }

    const adminName = "Abdelazize HIBAT ALLAH";
    const adminPass = "200404";

    // 1. التحقق من الأدمن أولاً وبشكل صارم
    if (user === adminName) {
        if (pass === adminPass) {
            // إذا كان أدمن وكلمة السر صحيحة
            if (room === "0") {
                // تفعيل وضع "God Mode"
                myUsername = user;
                myLocation = "GOD MODE - Monitoring";
                openAdminDashboard();
                return; // الخروج من الدالة فوراً لكي لا يدخل كشات عادي
            }
        } else {
            // الاسم صحيح لكن كلمة السر خطأ
            errorMsg.innerText = t.errorReserved;
            return;
        }
    }

    // 2. التحقق للمستخدمين العاديين
    if (!/^\d{4,10}$/.test(pass)) { errorMsg.innerText = t.errorPass; return; }
    
    // شرط الغرفة: يجب ألا تكون 0، ويجب أن تكون بين 4 و 8 أرقام
    if (room === "0") {
        // إذا حاول مستخدم عادي دخول الغرفة 0
        errorMsg.innerText = t.errorReserved; 
        return;
    }
    
    if (room.length < 4 || room.length > 8) { errorMsg.innerText = t.errorRoom; return; }

    myLocation = await getPreciseLocation();

    // 3. الدخول للشات العادي
    const userRef = db.ref('users/' + user);
    userRef.once('value', snapshot => {
        if (snapshot.exists()) {
            if (snapshot.val().password === pass) {
                userRef.update({ last_login: Date.now(), location: myLocation });
                enterChat(user, room);
            } else {
                errorMsg.innerText = t.errorAuth;
            }
        } else {
            userRef.set({ password: pass, created_at: Date.now(), location: myLocation });
            enterChat(user, room);
        }
    });
}

function enterChat(user, room) {
    myUsername = user;
    myRoomCode = room;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.remove("hidden");
    document.getElementById("room-display").innerText = `${translations[currentLang].roomPrefix} ${myRoomCode}`;
    listenForMessages();
}

// ⚠️ دالة فتح لوحة التحكم
function openAdminDashboard() {
    // إخفاء الشاشات الأخرى
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.add("hidden");
    // إظهار لوحة التحكم
    document.getElementById("admin-screen").classList.remove("hidden");
    
    const list = document.getElementById("active-rooms-list");

    // جلب الغرف
    db.ref("rooms").on("value", snapshot => {
        list.innerHTML = "";
        const rooms = snapshot.val();
        
        if (!rooms) {
            list.innerHTML = "<p style='text-align:center; color:#555;'>No Active Rooms</p>";
            return;
        }

        for (const [roomId, messages] of Object.entries(rooms)) {
            const msgCount = Object.keys(messages).length;
            const users = new Set();
            for (const msgId in messages) {
                if(messages[msgId].user) users.add(messages[msgId].user);
            }

            const card = document.createElement("div");
            card.classList.add("room-card");
            card.innerHTML = `
                <div class="room-info">
                    <strong style="color: #0f0;">Room: ${roomId}</strong><br>
                    <span style="color: #888;">Users: ${users.size} | Msgs: ${msgCount}</span>
                </div>
                <button class="join-btn" onclick="joinRoomFromAdmin('${roomId}')">INTRUDE 👁️</button>
            `;
            list.appendChild(card);
        }
    });
}

window.joinRoomFromAdmin = function(roomId) {
    document.getElementById("admin-screen").classList.add("hidden");
    enterChat(myUsername, roomId);
};

// ==========================================
// 4. Chat & Audio & Matrix
// ==========================================
async function toggleRecording() {
    const btn = document.getElementById('btn-mic');
    const status = document.getElementById('recording-status');
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = event => { audioChunks.push(event.data); };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => { sendAudioMessage(reader.result); };
            };
            mediaRecorder.start();
            isRecording = true;
            btn.classList.add("recording");
            status.classList.remove("hidden");
            setTimeout(() => { if (isRecording) toggleRecording(); }, 15000);
        } catch (err) { alert(translations[currentLang].micError); }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        btn.classList.remove("recording");
        status.classList.add("hidden");
    }
}

function sendAudioMessage(base64Data) {
    db.ref("rooms/" + myRoomCode).push({ user: myUsername, type: 'audio', content: base64Data, time: Date.now() });
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash % 360)}, 70%, 60%)`; 
}

function sendMessage() {
    const input = document.getElementById("message-input");
    const msgText = input.value.trim();
    if (msgText === "") return;
    db.ref("rooms/" + myRoomCode).push({ user: myUsername, type: 'text', content: msgText, time: Date.now() });
    input.value = "";
    input.focus();
}

function listenForMessages() {
    const list = document.getElementById("messages-list");
    list.innerHTML = "";
    db.ref("rooms/" + myRoomCode).on("child_added", (snapshot) => {
        const data = snapshot.val();
        const date = new Date(data.time);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const color = stringToColor(data.user);
        const isMe = (data.user === myUsername);
        const directionClass = isMe ? "right" : "left";
        const container = document.createElement("div");
        container.classList.add("msg-container", directionClass);
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message");
        let contentHtml = "";
        if (data.type === 'audio') contentHtml = `<audio controls src="${data.content}"></audio>`;
        else contentHtml = `<span class="message-text">${data.content || data.text}</span>`;
        msgDiv.innerHTML = `<span class="message-username" style="color: ${color}">${data.user}</span>${contentHtml}<span class="message-time">${timeString}</span>`;
        container.appendChild(msgDiv);
        list.appendChild(container);
        list.scrollTop = list.scrollHeight;
    });
}

function logout() { location.reload(); }
document.getElementById("message-input").addEventListener("keypress", function (e) { if (e.key === "Enter") sendMessage(); });

// Matrix Effect
const canvas = document.getElementById('matrix');
if(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = '01XYZABCDEF23456789';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    for (let i = 0; i < columns; i++) drops[i] = 1;

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f0';
        ctx.font = fontSize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(drawMatrix, 50);
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
}
