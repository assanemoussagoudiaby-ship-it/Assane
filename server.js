/* =========================================
   ASSANEDOWN SERVER FINAL
   Node.js + Express + yt-dlp
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
   FRONTEND HTML
========================================= */

app.use(express.static(__dirname));

/* =========================================
   DOWNLOADS FOLDER
========================================= */

const downloadsPath = path.join(
    __dirname,
    "downloads"
);

/* =========================================
   CREATE DOWNLOADS
========================================= */

if (!fs.existsSync(downloadsPath)) {

    fs.mkdirSync(downloadsPath);

}

/* =========================================
   PUBLIC DOWNLOADS
========================================= */

app.use(
    "/downloads",
    express.static(downloadsPath)
);

/* =========================================
   HISTORY
========================================= */

let history = [];

/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});

/* =========================================
   DOWNLOAD VIDEO
========================================= */

app.post("/download", (req, res) => {

    const url = req.body.url;

    console.log("📥 VIDEO :", url);

    /* =========================
       VERIFY URL
    ========================= */

    if (!url || !url.startsWith("http")) {

        return res.json({
            success: false,
            message: "Lien invalide ❌"
        });

    }

    /* =========================
       OUTPUT TEMPLATE
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
       FINISH
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

                    const stats =
                        fs.statSync(fullPath);

                    return {

                        name,

                        time:
                            stats.mtime.getTime()

                    };

                })
                .sort((a, b) => b.time - a.time);

            if (files.length === 0) {

                return res.json({
                    success: false,
                    message: "Aucune vidéo trouvée ❌"
                });

            }

            /* =========================
               LAST FILE
            ========================= */

            const lastFile = files[0].name;

            const fullPath = path.join(
                downloadsPath,
                lastFile
            );

            const stats =
                fs.statSync(fullPath);

            const sizeMB = (
                stats.size /
                (1024 * 1024)
            ).toFixed(2);

            const item = {

                name: lastFile,

                size: sizeMB + " MB",

                date:
                    new Date()
                    .toLocaleString(),

                url:
                    req.protocol +
                    "://" +
                    req.get("host") +
                    "/downloads/" +
                    encodeURIComponent(lastFile)

            };

            /* =========================
               SAVE HISTORY
            ========================= */

            history.push(item);

            console.log(
                "✅ TELECHARGE :",
                item.name
            );

            /* =========================
               RESPONSE
            ========================= */

            res.json({

                success: true,

                message:
                    "Vidéo téléchargée ✔",

                file: item

            });

        } catch (err) {

            console.log(err);

            res.json({

                success: false,

                message:
                    "Erreur lecture fichier ❌"

            });

        }

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

    if (!name) {

        return res.json({

            success: false,

            message:
                "Nom fichier manquant ❌"

        });

    }

    const filePath = path.join(
        downloadsPath,
        name
    );

    try {

        if (fs.existsSync(filePath)) {

            fs.unlinkSync(filePath);

            history = history.filter(
                item => item.name !== name
            );

            return res.json({

                success: true,

                message:
                    "Vidéo supprimée ✔"

            });

        }

        res.json({

            success: false,

            message:
                "Fichier introuvable ❌"

        });

    } catch (err) {

        console.log(err);

        res.json({

            success: false,

            message:
                "Erreur suppression ❌"

        });

    }

});

/* =========================================
   OPEN DOWNLOADS FOLDER
========================================= */

app.get("/open-folder", (req, res) => {

    try {

        if (process.platform === "win32") {

            exec(
                `start "" "${downloadsPath}"`
            );

        }

        res.json({

            success: true,

            message:
                "Dossier ouvert ✔"

        });

    } catch (err) {

        console.log(err);

        res.json({

            success: false,

            message:
                "Impossible d'ouvrir dossier ❌"

        });

    }

});

/* =========================================
   START SERVER
========================================= */

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 AssaneDown actif sur le port ${PORT}`
    );

});