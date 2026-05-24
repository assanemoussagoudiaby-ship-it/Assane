const videoUrl = document.getElementById("videoUrl");
const downloadBtn = document.getElementById("downloadBtn");
const pasteBtn = document.getElementById("pasteBtn");
const status = document.getElementById("status");
const aiMessage = document.getElementById("aiMessage");

const historyBox = document.createElement("div");
document.body.appendChild(historyBox);

let historyVisible = true;

/* =========================
   UI
========================= */
function show(msg, color) {
    status.textContent = msg;
    status.style.color = color;
}

function ai(msg) {
    aiMessage.textContent = msg;
}

/* =========================
   TOGGLE HISTORY
========================= */
function toggleHistory() {
    historyVisible = !historyVisible;
    historyBox.style.display = historyVisible ? "block" : "none";
}

/* =========================
   DELETE FILE
========================= */
async function deleteFile(name) {

    await fetch("http://127.0.0.1:3000/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });

    loadHistory();
}

/* =========================
   PLAY VIDEO
========================= */
function playVideo(name) {
    window.open("downloads/" + name);
}

/* =========================
   LOAD HISTORY
========================= */
async function loadHistory() {

    const res = await fetch("http://127.0.0.1:3000/history");
    const data = await res.json();

    historyBox.innerHTML = `
        <h3>📁 Historique</h3>
        <button onclick="toggleHistory()">👁 Masquer / Afficher</button>
        <hr>
    `;

    data.reverse().forEach(file => {

        const div = document.createElement("div");

        div.innerHTML = `
            <p>🎥 ${file.name}</p>
            <p>📦 ${file.size}</p>
            <p>🕒 ${file.date}</p>

            <button onclick="playVideo('${file.name}')">▶ Lire</button>
            <button onclick="deleteFile('${file.name}')">🗑 Supprimer</button>

            <hr>
        `;

        historyBox.appendChild(div);
    });
}

/* =========================
   DOWNLOAD
========================= */
downloadBtn.addEventListener("click", async () => {

    const url = videoUrl.value.trim();

    if (!url) {
        show("Ajoute un lien ❌", "red");
        return;
    }

    ai("⏳ Téléchargement...");

    const res = await fetch("http://127.0.0.1:3000/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
    });

    const data = await res.json();

    if (data.success) {
        show("Téléchargé ✔", "green");
        ai("🎉 Vidéo enregistrée");
        loadHistory();
    } else {
        show(data.message, "red");
        ai("❌ Erreur");
    }
});

/* =========================
   PASTE
========================= */
pasteBtn.addEventListener("click", async () => {
    const text = await navigator.clipboard.readText();
    videoUrl.value = text;
});

/* =========================
   INIT
========================= */
loadHistory();