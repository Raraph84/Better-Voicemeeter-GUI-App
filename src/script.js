window.addEventListener("load", () => {

    const inputs = document.getElementById("inputs");
    const outputs = document.getElementById("outputs");

    let initialized = false;

    const updateSliderSizes = () => {

        for (const inputElement of inputs.childNodes) {
            const gainElement = inputElement.childNodes[1].childNodes[1];
            const gainInputElement = gainElement.childNodes[0];
            gainInputElement.style.width = `${gainElement.clientHeight}px`;
            gainInputElement.style.height = `${gainElement.clientWidth}px`;
        }

        for (const outputElement of outputs.childNodes) {
            const gainElement = outputElement.childNodes[1].childNodes[1];
            const gainOutputElement = gainElement.childNodes[0];
            gainOutputElement.style.width = `${gainElement.clientHeight}px`;
            gainOutputElement.style.height = `${gainElement.clientWidth}px`;
        }
    }

    const calculateLevel = (level) => {
        level = level > 1e-5 ? (20 * Math.log10(level)) : -100;
        level = ((level - -80) * 100) / (12 - -80);
        level = Math.round(level * 100) / 100;
        if (level < 0) level = 0;
        if (level > 100) level = 100;
        return level;
    }

    const setInputGain = (id, gain) => {
        if (gain < -60) gain = -60;
        if (gain > 12) gain = 12;
        window.api.send("config", { inputs: [{ id: id, gain }] })
    }

    const setOutputGain = (id, gain) => {
        if (gain < -60) gain = -60;
        if (gain > 12) gain = 12;
        window.api.send("config", { outputs: [{ id: id, gain }] })
    }

    window.addEventListener("resize", updateSliderSizes);

    window.api.on("config", (event) => {

        if (initialized) {

            for (const input of event.inputs) {

                const inputElement = inputs.childNodes[input.id];

                inputElement.childNodes[0].innerText = input.label; // Label

                const columnElement = inputElement.childNodes[1];

                columnElement.childNodes[0].className = input.mute ? "level muted" : "level"; // Level

                columnElement.childNodes[1].childNodes[0].value = input.gain; // Gain

                const buttonsElement = columnElement.childNodes[2];

                buttonsElement.childNodes[0].innerText = `${Math.round(input.gain * 10) / 10}dB`; // Gain value

                for (const output of input.outputs) {
                    const outputElement = buttonsElement.childNodes[output.id + 1];
                    outputElement.className = output.enabled ? "active" : ""; // Output
                }

                buttonsElement.childNodes[input.outputs.length + 1].className = input.mute ? "mute active" : "mute"; // Mute
            }

            for (const output of event.outputs) {

                const outputElement = outputs.childNodes[output.id];

                const columnElement = outputElement.childNodes[1];

                columnElement.childNodes[0].className = output.mute ? "level muted" : "level"; // Level

                columnElement.childNodes[1].childNodes[0].value = output.gain; // Gain

                const buttonsElement = columnElement.childNodes[2];

                buttonsElement.childNodes[0].innerText = `${Math.round(output.gain * 10) / 10}dB`; // Gain value

                buttonsElement.childNodes[1].className = output.mute ? "mute active" : "mute"; // Mute
            }

        } else {

            for (const input of event.inputs) {

                const inputElement = document.createElement("div");
                inputElement.className = "input";

                const labelElement = document.createElement("label");
                labelElement.className = "label";
                labelElement.innerText = input.label;
                inputElement.appendChild(labelElement);

                const columnElement = document.createElement("div");
                columnElement.className = "column";
                inputElement.appendChild(columnElement);

                const levelElement = document.createElement("div");
                levelElement.className = input.mute ? "level muted" : "level";
                columnElement.appendChild(levelElement);

                const levelRightElement = document.createElement("div");
                levelElement.appendChild(levelRightElement);

                const levelRightContentElement = document.createElement("div");
                levelRightContentElement.style.height = "0%";
                levelRightElement.appendChild(levelRightContentElement);

                const levelLeftElement = document.createElement("div");
                levelElement.appendChild(levelLeftElement);

                const levelLeftContentElement = document.createElement("div");
                levelLeftContentElement.style.height = "0%";
                levelLeftElement.appendChild(levelLeftContentElement);

                const gainElement = document.createElement("div");
                gainElement.className = "gain";
                columnElement.appendChild(gainElement);

                const gainInputElement = document.createElement("input");
                gainInputElement.type = "range";
                gainInputElement.min = "-60";
                gainInputElement.max = "12";
                gainInputElement.step = "0.1";
                gainInputElement.value = input.gain;
                gainInputElement.addEventListener("input", (event) => setInputGain(input.id, parseFloat(event.target.value)));
                gainInputElement.addEventListener("dblclick", () => setInputGain(input.id, 0));
                gainInputElement.addEventListener("wheel", (event) => setInputGain(input.id, parseFloat(gainInputElement.value) + (event.deltaY < 0 ? 3 : -3)));
                gainElement.appendChild(gainInputElement);

                const buttonsElement = document.createElement("div");
                buttonsElement.className = "buttons";
                columnElement.appendChild(buttonsElement);

                const gainValueElement = document.createElement("div");
                gainValueElement.className = "gain-value";
                gainValueElement.innerText = `${Math.round(input.gain * 10) / 10}dB`;
                buttonsElement.appendChild(gainValueElement);

                for (const output of input.outputs) {
                    const outputElement = document.createElement("button");
                    outputElement.innerText = output.name;
                    outputElement.className = output.enabled ? "active" : "";
                    outputElement.addEventListener("click", () => window.api.send("config", { inputs: [{ id: input.id, outputs: [{ id: output.id, enabled: !outputElement.className.includes("active") }] }] }));
                    buttonsElement.appendChild(outputElement);
                }

                const muteElement = document.createElement("button");
                muteElement.innerText = "Mute";
                muteElement.className = input.mute ? "mute active" : "mute";
                muteElement.addEventListener("click", () => window.api.send("config", { inputs: [{ id: input.id, mute: !muteElement.className.includes("active") }] }));
                buttonsElement.appendChild(muteElement);

                inputs.appendChild(inputElement);
            }

            for (const output of event.outputs) {

                const outputElement = document.createElement("div");
                outputElement.className = "output";

                const labelElement = document.createElement("label");
                labelElement.className = "label";
                labelElement.innerText = output.name;
                outputElement.appendChild(labelElement);

                const columnElement = document.createElement("div");
                columnElement.className = "column";
                outputElement.appendChild(columnElement);

                const levelElement = document.createElement("div");
                levelElement.className = output.mute ? "level muted" : "level";
                columnElement.appendChild(levelElement);

                const levelRightElement = document.createElement("div");
                levelElement.appendChild(levelRightElement);

                const levelRightContentElement = document.createElement("div");
                levelRightContentElement.style.height = "0%";
                levelRightElement.appendChild(levelRightContentElement);

                const levelLeftElement = document.createElement("div");
                levelElement.appendChild(levelLeftElement);

                const levelLeftContentElement = document.createElement("div");
                levelLeftContentElement.style.height = "0%";
                levelLeftElement.appendChild(levelLeftContentElement);

                const gainElement = document.createElement("div");
                gainElement.className = "gain";
                columnElement.appendChild(gainElement);

                const gainOutputElement = document.createElement("input");
                gainOutputElement.type = "range";
                gainOutputElement.min = "-60";
                gainOutputElement.max = "12";
                gainOutputElement.step = "0.1";
                gainOutputElement.value = output.gain;
                gainOutputElement.addEventListener("input", (event) => setOutputGain(output.id, parseFloat(event.target.value)));
                gainOutputElement.addEventListener("dblclick", () => setOutputGain(output.id, 0));
                gainOutputElement.addEventListener("wheel", (event) => setOutputGain(output.id, parseFloat(gainOutputElement.value) + (event.deltaY < 0 ? 3 : -3)));
                gainElement.appendChild(gainOutputElement);

                const buttonsElement = document.createElement("div");
                buttonsElement.className = "buttons";
                columnElement.appendChild(buttonsElement);

                const gainValueElement = document.createElement("div");
                gainValueElement.className = "gain-value";
                gainValueElement.innerText = `${Math.round(output.gain * 10) / 10}dB`;
                buttonsElement.appendChild(gainValueElement);

                const muteElement = document.createElement("button");
                muteElement.innerText = "Mute";
                muteElement.className = output.mute ? "mute active" : "mute";
                muteElement.addEventListener("click", () => window.api.send("config", { outputs: [{ id: output.id, mute: !muteElement.className.includes("active") }] }));
                buttonsElement.appendChild(muteElement);

                outputs.appendChild(outputElement);
            }

            setTimeout(() => updateSliderSizes(), 1);

            initialized = true;
        }
    });

    window.api.on("levels", (event) => {

        if (!initialized) return;

        for (const input of event.inputs) {
            const levelElement = inputs.childNodes[input.id].childNodes[1].childNodes[0];
            levelElement.childNodes[0].childNodes[0].style.height = calculateLevel(input.levelLeft) + "%";
            levelElement.childNodes[1].childNodes[0].style.height = calculateLevel(input.levelRight) + "%";
        }

        for (const output of event.outputs) {
            const levelElement = outputs.childNodes[output.id].childNodes[1].childNodes[0];
            levelElement.childNodes[0].childNodes[0].style.height = calculateLevel(output.levelLeft) + "%";
            levelElement.childNodes[1].childNodes[0].style.height = calculateLevel(output.levelRight) + "%";
        }

    });

    window.api.send("loaded");
});
