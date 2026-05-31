// Global State for Store
let selectedProduct = "";
let productPrice = "";

// Custom Cursor
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    ring.style.transform = `translate(${e.clientX - 14}px, ${e.clientY - 14}px)`;
});

// Reveal on Scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Store Functions
function openOrderModal(name, price) {
    selectedProduct = name;
    productPrice = price;
    document.getElementById('modalProductTitle').innerText = `${name} — ${price}`;
    document.getElementById('orderModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function sendOrder() {
    const name = document.getElementById('userName').value;
    const platform = document.getElementById('platform').value;
    
    if(!name) {
        alert("Veuillez entrer votre nom.");
        return;
    }

    const message = `Bonjour Abdelaziz, je souhaite commander : ${selectedProduct} (${productPrice}). Mon nom est ${name}.`;
    
    if(platform === 'email') {
        window.location.href = `mailto:azizehibatallah@gmail.com?subject=Commande: ${selectedProduct}&body=${encodeURIComponent(message)}`;
    } else {
        window.open('https://instagram.com/h_ika_b', '_blank');
        alert("Redirection vers Instagram. Veuillez m'envoyer ce message en DM :\n\n" + message);
    }
    closeModal();
}