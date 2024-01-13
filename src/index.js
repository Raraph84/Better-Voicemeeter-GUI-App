const { app, BrowserWindow, Tray, Menu, ipcMain } = require("electron");
const path = require("path");
const voicemeeter = require("voicemeeter-remote");
const config = require("../config.json");

/** @type {import("electron").BrowserWindow} */
let window;

let interval;

const createWindow = () => {

    if (window) {
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
        title: "Better Voicemeeter GUI",
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    });

    if (app.isPackaged) window.setMenu(null);

    window.loadFile(path.join(__dirname, "index.html"));
};

const createTray = () => {

    const tray = new Tray(path.join(__dirname, "icon.png"));
    tray.setContextMenu(Menu.buildFromTemplate([{ label: "Fermer", click: () => app.quit() }]));

    tray.on("click", () => {
        createWindow();
    });
};

app.on("ready", () => {
    voicemeeter.init().then(() => {
        voicemeeter.login();
        createTray();
        if (!app.isPackaged) createWindow();
    });
});

app.on("window-all-closed", () => {
    window = null;
});

app.on("will-quit", () => {
    voicemeeter.logout();
});

ipcMain.on("loaded", () => {

    let initialized = false;

    interval = setInterval(() => {

        if (!window) {
            clearInterval(interval);
            return;
        }

        if (voicemeeter.isParametersDirty() || !initialized) {
            initialized = true;
            window.webContents.send("config", {
                inputs: voicemeeter.voicemeeterConfig.strips.map((strip) => {
                    const stripName = (!strip.isVirtual ? "A" : "B") + (voicemeeter.voicemeeterConfig.strips.filter((s) => s.isVirtual === strip.isVirtual).findIndex((s) => s === strip) + 1);
                    return {
                        id: strip.id,
                        name: stripName,
                        label: voicemeeter._getParameterString(0, "label", strip.id),
                        gain: voicemeeter._getParameterFloat(0, "gain", strip.id),
                        mute: !!voicemeeter._getParameterFloat(0, "mute", strip.id),
                        outputs: voicemeeter.voicemeeterConfig.buses.map((bus) => {
                            const busName = (!bus.isVirtual ? "A" : "B") + (voicemeeter.voicemeeterConfig.buses.filter((b) => b.isVirtual === bus.isVirtual).findIndex((b) => b === bus) + 1);
                            return {
                                id: bus.id,
                                name: busName,
                                enabled: !!voicemeeter._getParameterFloat(0, busName, strip.id)
                            };
                        })
                    };
                }),
                outputs: voicemeeter.voicemeeterConfig.buses.map((bus) => {
                    const busName = (!bus.isVirtual ? "A" : "B") + (voicemeeter.voicemeeterConfig.buses.filter((b) => b.isVirtual === bus.isVirtual).findIndex((b) => b === bus) + 1);
                    return {
                        id: bus.id,
                        name: busName,
                        gain: voicemeeter._getParameterFloat(1, "gain", bus.id),
                        mute: !!voicemeeter._getParameterFloat(1, "mute", bus.id)
                    };
                })
            });
        }

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

    }, 1000 / 33);
});

ipcMain.on("config", (event, args) => {

    if (typeof args.inputs !== "undefined") {
        for (const input of args.inputs) {
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
            if (typeof output.gain !== "undefined")
                voicemeeter._setParameterFloat(1, "gain", output.id, output.gain);
            if (typeof output.mute !== "undefined")
                voicemeeter._setParameterFloat(1, "mute", output.id, output.mute ? 1 : 0);
        }
    }
});
