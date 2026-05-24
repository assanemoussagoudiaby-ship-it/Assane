/* =========================================
   ASSANEDOWN SERVER FINAL FIXED
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
   FRONTEND
========================================= */

app.use(express.static(__dirname));

/* =========================================
   DOWNLOADS
========================================= */

const downloadsPath = path.join(__dirname, "downloads");

if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath);
}

/* =========================================
   STATIC DOWNLOADS
========================================= */

app.use("/downloads", express.static(downloadsPath));

/* =========================================
   HISTORY
========================================= */

let history = [];

/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================================
   DOWNLOAD VIDEO (FIXED VERSION)
========================================= */

app.post("/download", (req, res) => {

    const url = req.body.url;

    console.log("📥 VIDEO :", url);

    if (!url || !url.startsWith("http")) {
        return res.json({
            success: false,
            message: "Lien invalide ❌"
        });
    }

    const outputTemplate = path.join(
        downloadsPath,
        "%(title)s.%(ext)s"
    );

    /* =====================================
       RUN YT-DLP (STABLE VERSION)
    ===================================== */

    const yt = spawn("yt-dlp", [
        "-f",
        "best",
        "-o",
        outputTemplate,
        url
    ]);

    let errorLog = "";

    yt.stderr.on("data", (data) => {
        errorLog += data.toString();
        console.log("YT-DLP:", data.toString());
    });

    yt.on("error", (err) => {
        console.log("❌ PROCESS ERROR:", err);

        return res.json({
            success: false,
            message: "yt-dlp introuvable sur le serveur ❌"
        });
    });

    yt.on("close", () => {

        // 🔥 IMPORTANT: attendre écriture disque Render
        setTimeout(() => {

            try {

                const files = fs.readdirSync(downloadsPath);

                if (!files.length) {
                    return res.json({
                        success: false,
                        message: "Aucune vidéo trouvée ❌"
                    });
                }

                const sorted = files
                    .map(name => {
                        const fullPath = path.join(downloadsPath, name);
                        const stats = fs.statSync(fullPath);

                        return {
                            name,
                            time: stats.mtime.getTime()
                        };
                    })
                    .sort((a, b) => b.time - a.time);

                const lastFile = sorted[0].name;

                const filePath = path.join(downloadsPath, lastFile);
                const stats = fs.statSync(filePath);

                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                const item = {
                    name: lastFile,
                    size: sizeMB + " MB",
                    date: new Date().toLocaleString(),
                    url:
                        req.protocol +
                        "://" +
                        req.get("host") +
                        "/downloads/" +
                        encodeURIComponent(lastFile)
                };

                history.push(item);

                console.log("✅ DOWNLOAD OK :", item.name);

                return res.json({
                    success: true,
                    message: "Vidéo téléchargée ✔",
                    file: item
                });

            } catch (err) {
                console.log("READ ERROR:", err);

                return res.json({
                    success: false,
                    message: "Erreur lecture fichier ❌"
                });
            }

        }, 3500); // 🔥 FIX RENDER DELAY

    });

});

/* =========================================
   HISTORY
========================================= */

app.get("/history", (req, res) => {
    res.json(history);
});

/* =========================================
   DELETE VIDEO
========================================= */

app.post("/delete", (req, res) => {

    const { name } = req.body;

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

        return res.json({
            success: false,
            message: "Fichier introuvable ❌"
        });

    } catch (err) {
        console.log(err);

        return res.json({
            success: false,
            message: "Erreur suppression ❌"
        });
    }

});

/* =========================================
   OPEN FOLDER
========================================= */

app.get("/open-folder", (req, res) => {

    try {

        if (process.platform === "win32") {
            exec(`start "" "${downloadsPath}"`);
        }

        res.json({
            success: true,
            message: "Dossier ouvert ✔"
        });

    } catch (err) {

        res.json({
            success: false,
            message: "Erreur dossier ❌"
        });
    }

});

/* =========================================
   START SERVER
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 AssaneDown actif sur port " + PORT);
});