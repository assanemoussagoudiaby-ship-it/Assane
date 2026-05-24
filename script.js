/* =========================================
   ASSANEDOWN - SCRIPT FINAL
   By Assane le malin garçon 😎
========================================= */

/* =========================================
   ELEMENTS
========================================= */

const videoUrl =
    document.getElementById("videoUrl");

const pasteBtn =
    document.getElementById("pasteBtn");

const downloadBtn =
    document.getElementById("downloadBtn");

const clearBtn =
    document.getElementById("clearBtn");

const historyBtn =
    document.getElementById("historyBtn");

const historyBox =
    document.getElementById("historyBox");

const status =
    document.getElementById("status");

const aiMessage =
    document.getElementById("aiMessage");

/* =========================================
   BACKEND RENDER
========================================= */

const API =
    "https://assanedown-oefv.onrender.com";

/* =========================================
   IA ASSANE
========================================= */

function ai(text) {

    aiMessage.innerHTML = text;

}

/* =========================================
   STATUS
========================================= */

function show(text, color = "white") {

    status.innerHTML = text;

    status.style.color = color;

}

/* =========================================
   VOIX IA
========================================= */

function speak(text) {

    try {

        const speech =
            new SpeechSynthesisUtterance(text);

        speech.lang = "fr-FR";

        speech.rate = 1;

        speech.pitch = 1;

        speech.volume = 1;

        speechSynthesis.speak(speech);

    } catch {}

}

/* =========================================
   BIENVENUE
========================================= */

window.addEventListener("load", () => {

    ai(`
        👋 Bienvenue sur <b>AssaneDown</b><br>
        📥 Télécharge vidéos TikTok,
        Facebook et YouTube.
    `);

    speak(
        "Bienvenue sur AssaneDown créé par Assane Moussa Goudiaby"
    );

    loadHistory();

});

/* =========================================
   INTERNET
========================================= */

function checkInternet() {

    if (!navigator.onLine) {

        ai("❌ Pas de connexion internet.");

        show(
            "Connexion internet requise ❌",
            "red"
        );

        return false;

    }

    return true;

}

/* =========================================
   CLEAR INPUT
========================================= */

clearBtn.addEventListener("click", () => {

    videoUrl.value = "";

    show(
        "Lien supprimé ✔",
        "orange"
    );

    ai(
        "🧹 Champ nettoyé."
    );

});

/* =========================================
   PASTE LINK
========================================= */

pasteBtn.addEventListener(
    "click",
    async () => {

        if (!checkInternet()) return;

        try {

            const text =
                await navigator.clipboard.readText();

            videoUrl.value = text;

            show(
                "Lien collé ✔",
                "lightgreen"
            );

            ai(
                "📋 Lien vidéo collé avec succès."
            );

        } catch {

            show(
                "Impossible de coller ❌",
                "red"
            );

        }

    }
);

/* =========================================
   DOWNLOAD
========================================= */

downloadBtn.addEventListener(
    "click",
    async () => {

        if (!checkInternet()) return;

        const url =
            videoUrl.value.trim();

        if (!url) {

            show(
                "Ajoute un lien vidéo ❌",
                "red"
            );

            ai(
                "⚠ Veuillez ajouter un lien."
            );

            return;

        }

        try {

            ai(
                "⏳ Extraction vidéo en cours..."
            );

            show(
                "Téléchargement...",
                "orange"
            );

            /* =========================
               FETCH SERVER
            ========================= */

            const response =
                await fetch(
                    API + "/download",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            url
                        })
                    }
                );

            const data =
                await response.json();

            /* =========================
               SUCCESS
            ========================= */

            if (data.success) {

                show(
                    "Vidéo prête ✔",
                    "lightgreen"
                );

                ai(`
                    🎉 Vidéo prête.<br>
                    📁 Taille :
                    ${data.file.size}
                `);

                /* =========================
                   DOWNLOAD DIRECT
                ========================= */

                const a =
                    document.createElement("a");

                a.href = data.file.url;

                a.download =
                    data.file.name;

                document.body.appendChild(a);

                a.click();

                a.remove();

                /* =========================
                   SAVE HISTORY LOCAL
                ========================= */

                saveHistory(data.file);

                loadHistory();

            } else {

                show(
                    data.message,
                    "red"
                );

                ai(
                    "❌ Impossible de télécharger."
                );

            }

        } catch (err) {

            console.log(err);

            show(
                "Serveur inaccessible ❌",
                "red"
            );

            ai(
                "❌ Impossible de joindre Render."
            );

        }

    }
);

/* =========================================
   LOCAL HISTORY
========================================= */

function saveHistory(video) {

    let history =
        JSON.parse(
            localStorage.getItem(
                "assane_history"
            )
        ) || [];

    history.unshift(video);

    localStorage.setItem(
        "assane_history",
        JSON.stringify(history)
    );

}

/* =========================================
   LOAD HISTORY
========================================= */

function loadHistory() {

    let history =
        JSON.parse(
            localStorage.getItem(
                "assane_history"
            )
        ) || [];

    historyBox.innerHTML = "";

    if (history.length === 0) {

        historyBox.innerHTML = `
            <p style="
                color:gray;
                text-align:center;
            ">
                Aucun téléchargement
            </p>
        `;

        return;

    }

    history.forEach(video => {

        historyBox.innerHTML += `

        <div class="history-item">

            <p>
                🎥 ${video.name}
            </p>

            <p>
                📦 ${video.size}
            </p>

            <div class="buttons">

                <a
                    href="${video.url}"
                    target="_blank"
                    class="read-btn"
                >
                    ▶ Lire
                </a>

                <a
                    href="${video.url}"
                    download="${video.name}"
                    class="save-btn"
                >
                    📥 Enregistrer
                </a>

            </div>

        </div>

        `;

    });

}

/* =========================================
   SHOW / HIDE HISTORY
========================================= */

let historyVisible = true;

historyBtn.addEventListener(
    "click",
    () => {

        historyVisible =
            !historyVisible;

        if (historyVisible) {

            historyBox.style.display =
                "block";

            historyBtn.innerHTML =
                "🙈 Masquer historique";

        } else {

            historyBox.style.display =
                "none";

            historyBtn.innerHTML =
                "📜 Afficher historique";

        }

    }
);