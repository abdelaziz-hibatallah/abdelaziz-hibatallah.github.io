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
        errorPass: "Le mot de passe doit être de 4 à 10 chiffres !",
        errorRoom: "La salle doit être '0' ou 4-8 chiffres !",
        errorFill: "Remplissez tous les champs !",
        errorAuth: "Mot de passe incorrect !",
        roomPrefix: "Secteur :",
        micError: "Accès micro refusé !"
    },
    ar: {
        subtitle: "التحقق من الهوية",
        phUser: "اسم المستخدم",
        phPass: "كلمة المرور (4-10 أرقام)",
        phRoom: "رقم الغرفة (0 أو 4-8 أرقام)",
        btnEnter: "دخول للنظام 🔒",
        btnSend: "إرسال",
        errorPass: "كلمة المرور يجب أن تكون 4-10 أرقام!",
        errorRoom: "الغرفة يجب أن تكون 0 أو تتكون من 4-8 أرقام!",
        errorFill: "المرجو ملء جميع البيانات!",
        errorAuth: "كلمة المرور غير صحيحة!",
        roomPrefix: "القطاع:",
        micError: "تم رفض الوصول للميكروفون!"
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
// 2. إعدادات Firebase
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAbMO24cK1An0REveNzlVrUreW-ahAbU0k",
    authDomain: "the-ego-chat.firebaseapp.com",
    databaseURL: "https://the-ego-chat-default-rtdb.firebaseio.com",
    projectId: "the-ego-chat",
    storageBucket: "the-ego-chat.firebasestorage.app",
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
// 3. المنطق (Auth + Geo)
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
    
    // 1. تحقق كلمة السر (4-10)
    if (!/^\d{4,10}$/.test(pass)) {
        errorMsg.innerText = t.errorPass;
        return;
    }

    // 2. تحقق الغرفة (0 أو 4-8 أرقام)
    // الشرط: إذا لم تكن "0" ... وإذا كان الطول أقل من 4 أو أكثر من 8 -> خطأ
    if (room !== "0" && (room.length < 4 || room.length > 8)) {
        errorMsg.innerText = t.errorRoom;
        return;
    }

    myLocation = await getPreciseLocation();

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
// 4. الصوت (Voice Recording Logic)
// ==========================================
async function toggleRecording() {
    const btn = document.getElementById('btn-mic');
    const status = document.getElementById('recording-status');

    if (!isRecording) {
        // بدء التسجيل
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    sendAudioMessage(base64Audio);
                };
            };

            mediaRecorder.start();
            isRecording = true;
            btn.classList.add("recording");
            status.classList.remove("hidden");
            
            // إيقاف تلقائي بعد 15 ثانية (حماية)
            setTimeout(() => {
                if (isRecording) toggleRecording();
            }, 15000);

        } catch (err) {
            alert(translations[currentLang].micError);
        }
    } else {
        // إيقاف التسجيل والإرسال
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
// 5. الشات (Text + Audio Display)
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

        const div = document.createElement("div");
        div.classList.add("message");
        
        let contentHtml = "";
        
        // التحقق: هل الرسالة نص أم صوت؟
        if (data.type === 'audio') {
            contentHtml = `<audio controls src="${data.content}"></audio>`;
        } else {
            // دعم الرسائل القديمة التي كانت تسمى 'text' فقط
            contentHtml = `<span class="message-text">${data.content || data.text}</span>`;
        }

        div.innerHTML = `
            <span class="message-username" style="color: ${color}">${data.user}</span>
            ${contentHtml}
            <span class="message-time">${timeString}</span>
        `;
        list.appendChild(div);
        list.scrollTop = list.scrollHeight;
    });
}

function logout() { location.reload(); }

document.getElementById("message-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage();
});
