const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

/* ===================== DOWNLOADS FOLDER ===================== */
const downloadsPath = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsPath)) {
  fs.mkdirSync(downloadsPath);
}

/* ===================== HOME ===================== */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Downloader App</title>

<style>
body{
  margin:0;
  font-family:Arial;
  background:#0b1220;
  color:white;
  text-align:center;
}

/* HEADER */
header{
  background:#111827;
  padding:15px;
  border-bottom:2px solid #22c55e;
}

/* INPUT */
textarea{
  width:90%;
  height:80px;
  margin-top:15px;
  padding:10px;
  border-radius:10px;
  border:none;
  outline:none;
  font-size:14px;
}

/* BUTTONS */
button{
  padding:12px;
  margin:5px;
  border:none;
  border-radius:10px;
  font-size:14px;
  cursor:pointer;
}

.download{background:#22c55e;color:white}
.paste{background:#3b82f6;color:white}
.clear{background:#ef4444;color:white}
.save{background:#f59e0b;color:white}
.ai{background:#8b5cf6;color:white}
.about{background:#06b6d4;color:white}

/* CARD */
.card{
  background:#111827;
  margin:10px;
  padding:10px;
  border-radius:10px;
  text-align:left;
}

/* HISTORY */
.history-item{
  background:#1f2937;
  padding:8px;
  margin:5px 0;
  border-radius:8px;
  word-break:break-all;
}

/* TOGGLE */
.toggle{
  background:#8b5cf6;
  color:white;
}
</style>

</head>

<body>

<header>
<h2>📥 Video Downloader</h2>
</header>

<textarea id="url" placeholder="Colle ton lien ici..."></textarea>

<br>

<button class="paste" onclick="paste()">📋 Coller</button>
<button class="clear" onclick="clearText()">❌ Effacer</button>
<button class="download" onclick="download()">⬇ Télécharger</button>
<button class="save" onclick="save()">💾 Sauver</button>
<button class="ai" onclick="askAI()">🤖 IA Assane</button>
<button class="about" onclick="about()">ℹ À propos</button>

<div class="card">
<h3>📊 Infos vidéo</h3>
<p id="info">Aucune vidéo sélectionnée</p>
</div>

<div class="card">
<h3>
📜 Historique
<button class="toggle" onclick="toggleHistory()">Masquer/Afficher</button>
</h3>
<div id="history"></div>
</div>

<script>

let historyVisible = true;

/* COLLER */
async function paste(){
  const text = await navigator.clipboard.readText();
  document.getElementById("url").value = text;
}

/* EFFACER */
function clearText(){
  document.getElementById("url").value = "";
}

/* SAUVER */
function save(){
  const url = document.getElementById("url").value;
  if(!url) return alert("Lien vide");
  localStorage.setItem("saved", url);
  alert("Lien sauvegardé");
}

/* DOWNLOAD */
function download(){
  const url = document.getElementById("url").value;
  if(!url) return alert("Lien manquant");

  addHistory(url);
  getInfo(url);

  window.location.href = "/download?url=" + encodeURIComponent(url);
}

/* INFO VIDEO */
function getInfo(url){
  fetch("/info?url=" + encodeURIComponent(url))
  .then(r=>r.json())
  .then(data=>{
    document.getElementById("info").innerHTML =
      "Titre: " + (data.title || "-") + "<br>" +
      "Durée: " + (data.duration || "-") + " sec<br>" +
      "Taille: " + (data.size || "-");
  });
}

/* HISTORY */
function addHistory(url){
  let h = JSON.parse(localStorage.getItem("history") || "[]");
  h.unshift(url);
  localStorage.setItem("history", JSON.stringify(h));
  renderHistory();
}

function renderHistory(){
  let h = JSON.parse(localStorage.getItem("history") || "[]");
  let div = document.getElementById("history");
  div.innerHTML = "";

  h.forEach(v=>{
    div.innerHTML += "<div class='history-item'>" + v + "</div>";
  });
}

/* TOGGLE HISTORY */
function toggleHistory(){
  historyVisible = !historyVisible;
  document.getElementById("history").style.display =
    historyVisible ? "block" : "none";
}

/* 🤖 IA ASSANE */
function askAI(){
  const q = prompt("Pose ta question à IA Assane 🤖");
  if(!q) return;

  fetch("/ai?q=" + encodeURIComponent(q))
  .then(r=>r.json())
  .then(data=>{
    alert("🤖 Assane AI : " + data.reply);
  });
}

/* ℹ ABOUT */
function about(){
  fetch("/about")
  .then(r=>r.json())
  .then(data=>{
    alert(
      "📱 " + data.app +
      "\\n\\nℹ " + data.description +
      "\\n\\n👤 Créateur : " + data.creator +
      "\\n\\n⚙ Fonctionnalités : " + data.features.join(", ")
    );
  });
}

renderHistory();

</script>

</body>
</html>
  `);
});

/* ===================== INFO VIDEO ===================== */
app.get("/info", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "no url" });

  exec(`yt-dlp -j "${url}"`, (err, stdout) => {
    if (err) return res.json({ error: "yt-dlp error" });

    try {
      const data = JSON.parse(stdout);

      res.json({
        title: data.title,
        duration: data.duration,
        size: data.filesize || "inconnue"
      });

    } catch {
      res.json({ error: "parse error" });
    }
  });
});

/* ===================== DOWNLOAD ===================== */
app.get("/download", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Lien manquant");

  const fileName = `video_${Date.now()}.mp4`;
  const outputPath = path.join(downloadsPath, fileName);

  const cmd = `yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -o "${outputPath}" "${url}"`;

  exec(cmd, (err) => {
    if (err) return res.status(500).send("Erreur téléchargement");

    res.download(outputPath, fileName, () => {
      fs.unlink(outputPath, () => {});
    });
  });
});

/* ===================== IA ASSANE ===================== */
app.get("/ai", (req, res) => {
  const q = (req.query.q || "").toLowerCase();

  let reply = "Je suis IA Assane 🤖. Colle un lien et télécharge.";

  if (q.includes("comment")) {
    reply = "Colle un lien vidéo puis clique Télécharger.";
  } else if (q.includes("erreur")) {
    reply = "Vérifie ton lien ou réessaie.";
  } else if (q.includes("historique")) {
    reply = "L'historique affiche tes anciens téléchargements.";
  } else if (q.includes("serveur")) {
    reply = "Le serveur permet de télécharger des vidéos via yt-dlp.";
  }

  res.json({ reply });
});

/* ===================== ABOUT ===================== */
app.get("/about", (req, res) => {
  res.json({
    app: "Video Downloader App",
    description: "Application web pour télécharger des vidéos (YouTube, etc.) avec yt-dlp.",
    creator: "Projet indépendant développé pour apprentissage et usage personnel",
    features: [
      "Téléchargement vidéo",
      "Infos vidéo",
      "Historique local",
      "IA d'assistance",
      "Interface mobile"
    ]
  });
});

/* ===================== START SERVER ===================== */
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});