
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();

/* =========================================
   CORS FIX GLOBAL
========================================= */

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});

/* =========================================
   CONFIG
========================================= */

app.use(express.json());
app.use(express.static(__dirname));

/* =========================================
   DOWNLOADS FOLDER
========================================= */

const downloadsPath = path.join(__dirname, "downloads");

if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath);
}

app.use("/downloads", express.static(downloadsPath));

/* =========================================
   HISTORY
========================================= */

let history = [];

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================================
   DOWNLOAD (FIX FINAL STABLE RENDER)
========================================= */

app.post("/download", (req, res) => {

    const url = req.body.url;

    console.log("📥 VIDEO:", url);

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
       🔥 IMPORTANT FIX RENDER
    ===================================== */

    const yt = spawn("python3", [
        "-m",
        "yt_dlp",
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
        console.log("❌ SPAWN ERROR:", err);

        return res.json({
            success: false,
            message: "yt-dlp introuvable sur le serveur ❌"
        });
    });

    yt.on("close", () => {

        console.log("⏳ DOWNLOAD TERMINÉ");

        setTimeout(() => {

            try {

                const files = fs.readdirSync(downloadsPath);

                if (!files.length) {
                    return res.json({
                        success: false,
                        message: "Aucune vidéo trouvée ❌"
                    });
                }

                const lastFile = files
                    .map(file => {
                        const full = path.join(downloadsPath, file);
                        return {
                            name: file,
                            time: fs.statSync(full).mtime.getTime()
                        };
                    })
                    .sort((a, b) => b.time - a.time)[0].name;

                const filePath = path.join(downloadsPath, lastFile);
                const stats = fs.statSync(filePath);

                const item = {
                    name: lastFile,
                    size: (stats.size / 1024 / 1024).toFixed(2) + " MB",
                    date: new Date().toLocaleString(),
                    url:
                        req.protocol +
                        "://" +
                        req.get("host") +
                        "/downloads/" +
                        encodeURIComponent(lastFile)
                };

                history.push(item);

                console.log("✅ SUCCESS:", item.name);

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

        }, 5000);

    });

});

/* =========================================
   HISTORY ROUTE
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

    if (!fs.existsSync(filePath)) {
        return res.json({
            success: false,
            message: "Fichier introuvable ❌"
        });
    }

    fs.unlinkSync(filePath);

    history = history.filter(item => item.name !== name);

    res.json({
        success: true,
        message: "Vidéo supprimée ✔"
    });
});

/* =========================================
   START SERVER
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 ASSANEDOWN RUNNING ON PORT", PORT);
});