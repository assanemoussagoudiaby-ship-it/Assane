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
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Downloader</title>

<style>
body{
  margin:0;
  font-family:Arial;
  background:#0b1220;
  color:white;
  text-align:center;
}
header{
  background:#111827;
  padding:15px;
  border-bottom:2px solid #22c55e;
}
textarea{
  width:90%;
  height:80px;
  margin-top:15px;
  padding:10px;
  border-radius:10px;
  border:none;
}
button{
  padding:12px;
  margin:5px;
  border:none;
  border-radius:10px;
}
.download{background:#22c55e;color:white}
.paste{background:#3b82f6;color:white}
.clear{background:#ef4444;color:white}
.save{background:#f59e0b;color:white}
.card{
  background:#111827;
  margin:10px;
  padding:10px;
  border-radius:10px;
}
.history-item{
  background:#1f2937;
  padding:8px;
  margin:5px 0;
  border-radius:8px;
  word-break:break-all;
}
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

<div class="card">
<h3>📊 Infos</h3>
<p id="info">Aucune vidéo</p>
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

async function paste(){
  const text = await navigator.clipboard.readText();
  document.getElementById("url").value = text;
}

function clearText(){
  document.getElementById("url").value = "";
}

function save(){
  const url = document.getElementById("url").value;
  if(!url) return alert("Vide");
  localStorage.setItem("saved", url);
  alert("Sauvé");
}

function download(){
  const url = document.getElementById("url").value;
  if(!url) return alert("Lien vide");

  addHistory(url);
  getInfo(url);

  window.location.href = "/download?url=" + encodeURIComponent(url);
}

function getInfo(url){
  fetch("/info?url=" + encodeURIComponent(url))
  .then(r=>r.json())
  .then(data=>{
    document.getElementById("info").innerHTML =
      "Titre: " + (data.title || "-") + "<br>" +
      "Durée: " + (data.duration || "-") + "<br>" +
      "Taille: " + (data.size || "-");
  });
}

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

function toggleHistory(){
  historyVisible = !historyVisible;
  document.getElementById("history").style.display =
    historyVisible ? "block" : "none";
}

renderHistory();

</script>

</body>
</html>
  `);
});

/* ===================== SHORT LINK ===================== */
app.get("/assanedown", (req, res) => {
  res.redirect("/");
});

/* ===================== INFO ===================== */
app.get("/info", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "no url" });

  exec(`yt-dlp -j "${url}"`, (err, stdout, stderr) => {
    if (err) return res.json({ error: stderr || "yt-dlp error" });

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

/* ===================== DOWNLOAD FIX (ALL SITES) ===================== */
app.get("/download", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Lien manquant");

  const fileName = `video_${Date.now()}.mp4`;
  const outputPath = path.join(downloadsPath, fileName);

  // 🔥 FIX IMPORTANT: format universel yt-dlp
  const cmd = `yt-dlp -f "bestvideo+bestaudio/best" --merge-output-format mp4 -o "${outputPath}" "${url}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.log(stderr);
      return res.status(500).send("Erreur téléchargement");
    }

    res.download(outputPath, fileName, () => {
      fs.unlink(outputPath, () => {});
    });
  });
});

/* ===================== START ===================== */
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});