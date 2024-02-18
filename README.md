# Better Voicemeeter GUI - App

An Electron-based application for simplifying the management of basic settings in Voicemeeter Banana/Potato.

**This application utilizes its corresponding [frontend](https://github.com/Raraph84/Better-Voicemeeter-GUI-Frontend).**

![Better Voicemeeter GUI Screenshot](https://files.raraph.fr/better-voicemeeter-gui-screenshot.png)

## Features

- Display of input names.
- Visualization of audio levels.
- Adjustment of gain.
- Redirect inputs to different outputs.
- Mute function for each input/output.

## Roadmap

- Ability to show/hide inputs/outputs.
- Ability to link inputs/outputs to Windows volume.
- Ability to launch on startup.
- Ability to change hard output.
- Find a better icon.

## Build (with cmd)

Download [Git](https://git-scm.com/downloads) and [NodeJS](https://nodejs.org/en/download)  
Clone the app and frontend repos :
```
git clone https://github.com/Raraph84/Better-Voicemeeter-GUI-App
git clone https://github.com/Raraph84/Better-Voicemeeter-GUI-Frontend
```
Build the frontend :
```
cd Better-Voicemeeter-GUI-Frontend
npm install
npm run build
```
Move the frontend to the app :
```
cd ..
move Better-Voicemeeter-GUI-Frontend/build Better-Voicemeeter-GUI-App/src/frontend
```
Build the app :
```
cd Better-Voicemeeter-GUI-App
npm install
npm run package
```
The built app is in `Better-Voicemeeter-GUI-App/out`

## Contributions

Contributions are welcome! If you would like to contribute, please create a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For any questions or assistance, feel free to reach out to me on Discord: [@raraph84](https://discord.com/users/486801186419245060).
