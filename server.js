const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");

const app = express();

app.use(cors());
app.use(express.json());

let history = [];

/*
========================
📥 DOWNLOAD UNIVERSAL
========================
*/
app.get("/download", async (req, res) => {

    const url = req.query.url;

    if (!url) {
        return res.send("Lien manquant");
    }

    // 🔥 CASE 1: YouTube
    if (ytdl.validateURL(url)) {

        try {
            history.unshift({
                type: "youtube",
                url,
                date: new Date().toLocaleString()
            });

            res.header(
                "Content-Disposition",
                'attachment; filename="youtube_video.mp4"'
            );

            ytdl(url, {
                quality: "highest"
            }).pipe(res);

        } catch (e) {
            res.send("Erreur YouTube download");
        }

        return;
    }

    // 🔥 CASE 2: MP4 direct
    if (url.endsWith(".mp4")) {

        history.unshift({
            type: "mp4",
            url,
            date: new Date().toLocaleString()
        });

        return res.redirect(url);
    }

    return res.send("Lien non supporté");
});

/*
========================
📜 HISTORIQUE
========================
*/
app.get("/history", (req, res) => {
    res.json(history);
});

/*
========================
🚀 PORT CORRIGÉ (IMPORTANT)
========================
*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Assane Down ULTRA PRO OK sur port " + PORT);
});