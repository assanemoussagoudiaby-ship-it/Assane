const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

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
<title>AssaneDown</title>

<style>
body{
  margin:0;
  font-family:Arial;
  background:#0f172a;
  color:white;
  text-align:center;
}

header{
  background:#020617;
  padding:15px;
  border-bottom:3px solid #00b894;
}

textarea{
  width:80%;
  height:90px;
  margin-top:20px;
  padding:10px;
  border:none;
  border-radius:10px;
}

button{
  padding:12px 15px;
  margin:5px;
  border:none;
  border-radius:10px;
  cursor:pointer;
}

.download{background:#00b894;color:white}
.paste{background:#3b82f6;color:white}
.clear{background:#ef4444;color:white}
.save{background:#f59e0b;color:white}
.ai{background:#8b5cf6;color:white}

.card{
  background:#111827;
  margin:15px;
  padding:15px;
  border-radius:10px;
}

.history-item{
  background:#1e293b;
  margin:5px;
  padding:8px;
  border-radius:8px;
  word-break:break-all;
}
</style>

</head>

<body>

<header>
<h1>🚀 AssaneDown 🇸🇳</h1>
<p>Créé par Assane Moussa Goudiaby</p>
</header>

<h3>📥 Téléchargeur Vidéo</h3>

<textarea id="url" placeholder="Colle ton lien ici..."></textarea>

<br>

<!-- BOUTONS -->
<button class="paste" onclick="paste()">📋 Coller</button>
<button class="clear" onclick="clearText()">❌ Effacer</button>
<button class="download" onclick="download()">⬇ Télécharger</button>
<button class="save" onclick="save()">💾 Enregistrer</button>
<button class="ai" onclick="ai()">🤖 IA Assane</button>

<!-- INFOS VIDEO -->
<div class="card">
<h3>📊 Informations vidéo</h3>
<p id="info">Aucune vidéo sélectionnée</p>
</div>

<!-- HISTORIQUE -->
<div class="card">
<h3>📜 Historique téléchargements</h3>
<div id="history"></div>
</div>

<script>

// 📋 COLLER
async function paste(){
  const text = await navigator.clipboard.readText();
  document.getElementById("url").value = text;
}

// ❌ EFFACER
function clearText(){
  document.getElementById("url").value = "";
}

// 💾 ENREGISTRER
function save(){
  const url = document.getElementById("url").value;
  if(!url) return alert("Rien à enregistrer");

  localStorage.setItem("saved_url", url);
  alert("Lien enregistré");
}

// ⬇ DOWNLOAD
function download(){
  const url = document.getElementById("url").value;
  if(!url) return alert("Lien manquant");

  addHistory(url);
  window.location.href = "/download?url=" + encodeURIComponent(url);

  getInfo(url);
}

// 📊 INFO VIDEO
function getInfo(url){
  fetch("/info?url=" + encodeURIComponent(url))
  .then(r => r.json())
  .then(data => {
    document.getElementById("info").innerHTML =
    "Titre: " + (data.title || "inconnu") + "<br>" +
    "Durée: " + (data.duration || "inconnu") + "<br>" +
    "Taille: " + (data.size || "inconnue");
  });
}

// 📜 HISTORIQUE
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
    div.innerHTML += "<div class='history-item'>"+v+"</div>";
  });
}

// 🤖 IA ASSANE
function ai(){
  alert("🤖 IA Assane : colle un lien vidéo, puis clique Télécharger pour récupérer la vidéo.");
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

  const cmd =
    `yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -o "${outputPath}" "${url}"`;

  exec(cmd, (err) => {
    if (err) return res.status(500).send("Erreur téléchargement");

    res.download(outputPath, fileName, () => {
      fs.unlink(outputPath, () => {});
    });
  });
});

/* ===================== START ===================== */
app.listen(PORT, () => {
  console.log("🚀 AssaneDown running on port " + PORT);
});