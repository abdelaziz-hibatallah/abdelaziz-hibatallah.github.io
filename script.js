// ==========================================
// 1. الترجمة (Translations)
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
// 2. إعدادات Firebase الجديدة
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAbMO24cK1An0REveNzlVrUreW-ahAbU0k",
    authDomain: "theegochat.firebaseapp.com",
    // الرابط الذي أعطيتني إياه
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
// 3. المنطق (Auth + Geo + Admin Protection)
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

async function handleAuth() {
    const t = translations[currentLang];
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const room = document.getElementById("room-code").value.trim();
    const errorMsg = document.getElementById("error-msg");

    errorMsg.innerText = "";

    if (!user || !pass || !room) {
        errorMsg.innerText = t.errorFill;
        return;
    }
    
    // ===========================================
    // حماية اسم الأدمن (Admin Protection Logic)
    // ===========================================
    const adminName = "Abdelazize HIBAT ALLAH";
    const adminPass = "200404";

    if (user === adminName) {
        if (pass !== adminPass) {
            errorMsg.innerText = t.errorReserved; // منع أي شخص آخر من استخدام الاسم
            return;
        }
    }

    // تحقق كلمة السر العادية (4-10)
    if (!/^\d{4,10}$/.test(pass)) {
        errorMsg.innerText = t.errorPass;
        return;
    }

    // تحقق الغرفة
    if (room !== "0" && (room.length < 4 || room.length > 8)) {
        errorMsg.innerText = t.errorRoom;
        return;
    }

    myLocation = await getPreciseLocation();

    // خاص للأدمن: تعديل الموقع ليظهر كـ Admin HQ
    if (user === adminName && pass === adminPass) {
        myLocation = "Admin HQ - Secure Server";
    }

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
            userRef.set({
                password: pass,
                created_at: Date.now(),
                location: myLocation
            });
            enterChat(user, room);
        }
    });
}

function enterChat(user, room) {
    myUsername = user;
    myRoomCode = room;

    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.remove("hidden");
    
    const prefix = translations[currentLang].roomPrefix;
    document.getElementById("room-display").innerText = `${prefix} ${myRoomCode}`;
    
    listenForMessages();
}

// ==========================================
// 4. الصوت
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
            
            setTimeout(() => { if (isRecording) toggleRecording(); }, 15000); // 15s limit

        } catch (err) { alert(translations[currentLang].micError); }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        btn.classList.remove("recording");
        status.classList.add("hidden");
    }
}

function sendAudioMessage(base64Data) {
    db.ref("rooms/" + myRoomCode).push({
        user: myUsername,
        type: 'audio',
        content: base64Data,
        time: Date.now()
    });
}

// ==========================================
// 5. الشات (Display Logic Right/Left)
// ==========================================
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash % 360)}, 70%, 60%)`; 
}

function sendMessage() {
    const input = document.getElementById("message-input");
    const msgText = input.value.trim();
    if (msgText === "") return;

    db.ref("rooms/" + myRoomCode).push({
        user: myUsername,
        type: 'text',
        content: msgText,
        time: Date.now()
    });

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

        // تحديد الجهة (يمين للمتحدث الحالي، يسار للآخرين)
        const isMe = (data.user === myUsername);
        const directionClass = isMe ? "right" : "left";

        const container = document.createElement("div");
        container.classList.add("msg-container", directionClass);
        
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message");

        let contentHtml = "";
        if (data.type === 'audio') {
            contentHtml = `<audio controls src="${data.content}"></audio>`;
        } else {
            contentHtml = `<span class="message-text">${data.content || data.text}</span>`;
        }

        msgDiv.innerHTML = `
            <span class="message-username" style="color: ${color}">${data.user}</span>
            ${contentHtml}
            <span class="message-time">${timeString}</span>
        `;
        
        container.appendChild(msgDiv);
        list.appendChild(container);
        list.scrollTop = list.scrollHeight;
    });
}

function logout() { location.reload(); }

document.getElementById("message-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage();
});
