import path from "path";
import { app, ipcMain, session } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import cors from "cors";
const express = require("express");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const isProd = process.env.NODE_ENV === "production";

// AGORA BACKEND FOR RETRIEVING TOKENS BASED ON CHANNEL-NAMES
const APP_ID = "97053747cb414a02bb27de8e55549466";
const APP_CERTIFICATE = "2e62982b423148b582d9a9d71cd33606";

// Create the Express app
const expressApp = express();
const port = 3000;

// Use CORS to allow all origins
expressApp.use(cors());

// Define the route for generating tokens
expressApp.get("/rtcToken", (req, res) => {
    const channelName = req.query.channelName;
    if (!channelName) {
        return res.status(400).json({ error: "Channel name is required" });
    }

    const uid = 0; // uid 0 means the Agora server will assign one
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 24 * 60 * 60;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        role,
        privilegeExpireTime
    );
    return res.json({ token });
});

// Start the Express server
expressApp.listen(port, () => {
    console.log(`Token server is running on port ${port}`);
});

// Main app logic
if (isProd) {
    serve({ directory: "app" });
} else {
    app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
    await app.whenReady();

    const mainWindow = createWindow("main", {
        width: 1400,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    if (isProd) {
        await mainWindow.loadURL("app://./home");
    } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/home`);
        mainWindow.webContents.openDevTools();
    }
})();

app.on("window-all-closed", () => {
    app.quit();
});

ipcMain.on("message", async (event, arg) => {
    event.reply("message", `${arg} World!`);
});
