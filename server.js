const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// 📁 Dossier downloads
const downloadsPath = path.join(__dirname, "downloads");

if (!fs.existsSync(downloadsPath)) {
  fs.mkdirSync(downloadsPath);
}

// 🏠 PAGE PRINCIPALE
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>AssaneDown</title>
        <style>
          body{
            background:#0f172a;
            color:white;
            font-family:Arial;
            text-align:center;
            padding-top:100px;
          }

          input{
            width:80%;
            max-width:500px;
            padding:15px;
            border:none;
            border-radius:10px;
            margin-top:20px;
          }

          button{
            padding:15px 30px;
            border:none;
            border-radius:10px;
            background:#00b894;
            color:white;
            font-size:18px;
            cursor:pointer;
            margin-top:20px;
          }

          button:hover{
            background:#00a383;
          }
        </style>
      </head>

      <body>
        <h1>🚀 AssaneDown</h1>
        <p>Téléchargeur Vidéo YouTube • TikTok • Facebook</p>

        <input type="text" id="url" placeholder="Colle le lien vidéo ici">

        <br>

        <button onclick="downloadVideo()">
          Télécharger
        </button>

        <script>
          function downloadVideo() {
            const url = document.getElementById("url").value;

            if(!url){
              alert("Entre un lien vidéo");
              return;
            }

            window.location.href =
              "/download?url=" + encodeURIComponent(url);
          }
        </script>
      </body>
    </html>
  `);
});

// 🚀 ROUTE DE TÉLÉCHARGEMENT
app.get("/download", (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).send("Lien vidéo manquant");
  }

  const fileName = `video_${Date.now()}.mp4`;

  const outputPath = path.join(downloadsPath, fileName);

  // 🔥 Commande yt-dlp
  const command = `yt-dlp -f mp4 -o "${outputPath}" "${videoUrl}"`;

  console.log("Téléchargement en cours...");

  exec(command, (error) => {

    if (error) {
      console.log(error);

      return res.status(500).send("Erreur téléchargement vidéo");
    }

    console.log("Téléchargement terminé");

    // 📥 Envoie au navigateur
    res.download(outputPath, fileName, (err) => {

      // 🧹 Supprime le fichier après téléchargement
      fs.unlink(outputPath, () => {});

      if (err) {
        console.log(err);
      }
    });
  });
});

// 🚀 SERVEUR
app.listen(PORT, () => {
  console.log("🚀 ASSANEDOWN RUNNING ON PORT " + PORT);
});