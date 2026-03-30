const express = require("express");
const fetch = require("node-fetch");

const app = express();

// Servir fichiers statiques
app.use(express.static(__dirname));

// Endpoint pour télécharger la vidéo
app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.send("Lien manquant");

  try {
    const response = await fetch(url);
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=video.mp4"
    );
    response.body.pipe(res);
  } catch (err) {
    res.send("Erreur lors du téléchargement : " + err.message);
  }
});

app.listen(3000, () => console.log("Serveur lancé sur http://localhost:3000"));