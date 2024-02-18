const { promises: fs } = require("fs");
const { join, dirname } = require("path");
const { app, BrowserWindow, Tray, Menu, ipcMain } = require("electron");
const path = require("path");
const voicemeeter = require("voicemeeter-remote");

/** @type {import("electron").BrowserWindow} */
let window;

let interval;

let config = {};

const saveConfig = () => fs.writeFile(join(dirname(__dirname), "config.json"), JSON.stringify(config, null, 4));

const createWindow = () => {

    if (window) {
        window.restore();
        window.focus();
        return;
    }

    const width = 15 + (10 + 140 + 10 + 15) * Math.max(voicemeeter.voicemeeterConfig.strips.length, 3) + 16;
    const height = 15 + (119 + 36 * Math.max(voicemeeter.voicemeeterConfig.strips.length, 3)) + 15 + (119 + 36 * 3) + 15 + 39;

    window = new BrowserWindow({
        width,
        height,
        minWidth: width,
        minHeight: height,
        icon: path.join(__dirname, "icon.ico"),
        title: "Better Voicemeeter GUI",
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    });

    if (app.isPackaged) window.setMenu(null);

    if (app.isPackaged) window.loadFile(path.join(__dirname, "frontend", "index.html"));
    else window.loadURL("http://localhost:3000");

    createWindow(); // Focus
};

const createTray = () => {

    const tray = new Tray(path.join(__dirname, "icon.ico"));
    tray.setContextMenu(Menu.buildFromTemplate([{ label: "Close", click: () => app.quit() }]));

    tray.on("click", () => {
        createWindow();
    });
};

app.on("ready", async () => {

    try {
        config = JSON.parse((await fs.readFile(join(dirname(__dirname), "config.json"))).toString());
    } catch (error) {
    }

    await voicemeeter.init();
    voicemeeter.login();

    if (typeof config.outputs !== "object")
        config.outputs = {};

    for (const bus of voicemeeter.voicemeeterConfig.buses) {
        const busName = getBusNameByConfig(bus);
        if (typeof config.outputs[busName] !== "object")
            config.outputs[busName] = {};
        if (typeof config.outputs[busName].label !== "string")
            config.outputs[busName].label = undefined;
    }

    saveConfig();

    createTray();

    if (!app.isPackaged) createWindow();
});

app.on("window-all-closed", () => {
    window = null;
});

app.on("will-quit", () => {
    voicemeeter.logout();
});

const getStripNameByConfig = (strip) => (!strip.isVirtual ? "A" : "B") + (voicemeeter.voicemeeterConfig.strips.filter((s) => s.isVirtual === strip.isVirtual).findIndex((s) => s === strip) + 1);

const getBusNameByConfig = (bus) => (!bus.isVirtual ? "A" : "B") + (voicemeeter.voicemeeterConfig.buses.filter((b) => b.isVirtual === bus.isVirtual).findIndex((b) => b === bus) + 1);
const getBusNameById = (id) => getBusNameByConfig(voicemeeter.voicemeeterConfig.buses[id]);

const sendConfig = () => {

    window.webContents.send("config", {
        inputs: voicemeeter.voicemeeterConfig.strips.map((strip) => ({
            id: strip.id,
            name: getStripNameByConfig(strip),
            label: voicemeeter._getParameterString(0, "label", strip.id) || null,
            gain: voicemeeter._getParameterFloat(0, "gain", strip.id),
            mute: !!voicemeeter._getParameterFloat(0, "mute", strip.id),
            outputs: voicemeeter.voicemeeterConfig.buses.map((bus) => ({
                id: bus.id,
                name: getBusNameByConfig(bus),
                enabled: !!voicemeeter._getParameterFloat(0, getBusNameByConfig(bus), strip.id)
            }))
        })),
        outputs: voicemeeter.voicemeeterConfig.buses.map((bus) => ({
            id: bus.id,
            name: getBusNameByConfig(bus),
            label: config.outputs[getBusNameByConfig(bus)].label || null,
            gain: voicemeeter._getParameterFloat(1, "gain", bus.id),
            mute: !!voicemeeter._getParameterFloat(1, "mute", bus.id)
        }))
    });
}

const sendLevels = () => {

    window.webContents.send("levels", {
        inputs: voicemeeter.voicemeeterConfig.strips.map((strip) => {
            const id = voicemeeter.voicemeeterConfig.strips.filter((s) => s.id < strip.id && !s.isVirtual).length * 2 + voicemeeter.voicemeeterConfig.strips.filter((s) => s.id < strip.id && s.isVirtual).length * 8;
            return {
                id: strip.id,
                levelLeft: voicemeeter.getLevel(1, id),
                levelRight: voicemeeter.getLevel(1, id + 1)
            };
        }),
        outputs: voicemeeter.voicemeeterConfig.buses.map((bus) => {
            const id = bus.id * 8;
            return {
                id: bus.id,
                levelLeft: voicemeeter.getLevel(3, id),
                levelRight: voicemeeter.getLevel(3, id + 1)
            };
        })
    });
}

ipcMain.on("loaded", () => {

    sendConfig();

    interval = setInterval(() => {

        if (!window) {
            clearInterval(interval);
            return;
        }

        if (voicemeeter.isParametersDirty())
            sendConfig();

        sendLevels();

    }, 1000 / 33);
});

ipcMain.on("config", (event, args) => {

    if (typeof args.inputs !== "undefined") {
        for (const input of args.inputs) {
            if (typeof input.label !== "undefined")
                voicemeeter._setParameterString(0, "label", input.id, input.label);
            if (typeof input.gain !== "undefined")
                voicemeeter._setParameterFloat(0, "gain", input.id, input.gain);
            if (typeof input.mute !== "undefined")
                voicemeeter._setParameterFloat(0, "mute", input.id, input.mute ? 1 : 0);
            if (typeof input.outputs !== "undefined") {
                for (const output of input.outputs) {
                    const bus = voicemeeter.voicemeeterConfig.buses[output.id];
                    const busName = (!bus.isVirtual ? "A" : "B") + (voicemeeter.voicemeeterConfig.buses.filter((b) => b.isVirtual === bus.isVirtual).findIndex((b) => b.id === bus.id) + 1);
                    if (typeof output.enabled !== "undefined")
                        voicemeeter._setParameterFloat(0, busName, input.id, output.enabled ? 1 : 0);
                }
            }
        }
    }

    if (typeof args.outputs !== "undefined") {
        for (const output of args.outputs) {
            if (typeof output.label !== "undefined") {
                config.outputs[getBusNameById(output.id)].label = output.label;
                sendConfig();
                saveConfig();
            }
            if (typeof output.gain !== "undefined")
                voicemeeter._setParameterFloat(1, "gain", output.id, output.gain);
            if (typeof output.mute !== "undefined")
                voicemeeter._setParameterFloat(1, "mute", output.id, output.mute ? 1 : 0);
        }
    }
});
