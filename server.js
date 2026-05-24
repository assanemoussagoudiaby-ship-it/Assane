/* =========================================
   ASSANEDOWN SERVER — VERSION CORRIGÉE
========================================= */

const express = require("express");
const cors = require("cors");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

/* =========================================
   CONFIG
========================================= */

app.use(cors());
app.use(express.json());

/* =========================================
   DOSSIER DOWNLOADS
========================================= */

const downloadsPath = path.join(__dirname, "downloads");

if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath);
}

/* =========================================
   RENDRE DOWNLOADS PUBLIC
========================================= */

app.use(
    "/downloads",
    express.static(downloadsPath)
);

/* =========================================
   HISTORIQUE
========================================= */

let history = [];

/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {

    res.send(`
        <h1>🚀 AssaneDown actif</h1>
        <p>Serveur Node.js opérationnel ✔</p>
    `);

});

/* =========================================
   OUVRIR DOSSIER DOWNLOADS
========================================= */

app.get("/open-folder", (req, res) => {

    exec(`start "" "${downloadsPath}"`);

    res.json({
        success: true,
        message: "Dossier ouvert ✔"
    });

});

/* =========================================
   HISTORIQUE
========================================= */

app.get("/history", (req, res) => {

    res.json(history);

});

/* =========================================
   SUPPRIMER VIDEO
========================================= */

app.post("/delete", (req, res) => {

    const { name } = req.body;

    if (!name) {

        return res.json({
            success: false,
            message: "Nom fichier manquant ❌"
        });

    }

    const filePath = path.join(downloadsPath, name);

    try {

        if (fs.existsSync(filePath)) {

            fs.unlinkSync(filePath);

            history = history.filter(
                item => item.name !== name
            );

            return res.json({
                success: true,
                message: "Vidéo supprimée ✔"
            });

        }

        res.json({
            success: false,
            message: "Fichier introuvable ❌"
        });

    } catch (err) {

        console.log(err);

        res.json({
            success: false,
            message: "Erreur suppression ❌"
        });

    }

});

/* =========================================
   TELECHARGEMENT VIDEO
========================================= */

app.post("/download", (req, res) => {

    const url = req.body.url;

    console.log("📥 VIDEO :", url);

    /* =========================
       VERIFICATION
    ========================= */

    if (!url || !url.startsWith("http")) {

        return res.json({
            success: false,
            message: "Lien invalide ❌"
        });

    }

    /* =========================
       TEMPLATE FICHIER
    ========================= */

    const outputTemplate = path.join(
        downloadsPath,
        "%(title)s.%(ext)s"
    );

    /* =========================
       YT-DLP
    ========================= */

    const yt = spawn("python", [
        "-m",
        "yt_dlp",
        "-o",
        outputTemplate,
        url
    ]);

    let error = "";

    yt.stderr.on("data", (data) => {

        error += data.toString();

        console.log(data.toString());

    });

    /* =========================
       FIN TELECHARGEMENT
    ========================= */

    yt.on("close", () => {

        try {

            const files = fs
                .readdirSync(downloadsPath)
                .map(name => {

                    const fullPath = path.join(
                        downloadsPath,
                        name
                    );

                    const stats = fs.statSync(fullPath);

                    return {
                        name,
                        time: stats.mtime.getTime()
                    };

                })
                .sort((a, b) => b.time - a.time);

            if (files.length === 0) {

                return res.json({
                    success: false,
                    message: "Aucune vidéo trouvée ❌"
                });

            }

            const lastFile = files[0].name;

            const fullPath = path.join(
                downloadsPath,
                lastFile
            );

            const stats = fs.statSync(fullPath);

            const sizeMB = (
                stats.size / (1024 * 1024)
            ).toFixed(2);

            const item = {

                name: lastFile,

                size: sizeMB + " MB",

                date: new Date().toLocaleString(),

                url:
                    "http://127.0.0.1:3000/downloads/" +
                    encodeURIComponent(lastFile)

            };

            history.push(item);

            console.log("✅ TELECHARGE :", item.name);

            res.json({
                success: true,
                message: "Vidéo téléchargée ✔",
                file: item
            });

        } catch (err) {

            console.log(err);

            res.json({
                success: false,
                message: "Erreur lecture fichier ❌"
            });

        }

    });

});

/* =========================================
   START SERVER
========================================= */

app.listen(3000, () => {

    console.log(
        "🚀 AssaneDown actif sur http://127.0.0.1:3000"
    );

});