// ==UserScript==
// @name         Discord GIF Exporter (simple JSON download)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds an export button to the Discord GIF/Emoji/Sticker navigation bar
// @author       darius-it
// @match        https://discord.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Find internal module for GIFs through Webpack, credits: https://gist.github.com/Davr1/af6a5806a3bf4b5b7dc18829029b42c2
    const getFrecencySettings = () => {
        if (window.FrecencyUserSettings) return window.FrecencyUserSettings;
        window.FrecencyUserSettings = webpackChunkdiscord_app.push([[Symbol()],,e=>Object.values(e.c).values().map(m=>m.exports).filter(x=>typeof x=="object"&&x!=window&&x!=DOMTokenList.prototype).flatMap(x=>[x,...Object.values(x)]).find(x=>x?.ProtoClass?.typeName?.endsWith(".FrecencyUserSettings"))]);
        return window.FrecencyUserSettings;
    };

    function downloadJSON(content, download) {
        const json = JSON.stringify(content, null, 2);
        Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(new Blob([json], { type: "application/json" })),
            download
        }).click();
    }

    function injectButton() {
        const xpath = "/html/body/div[1]/div[2]/div/div[6]/div/div/section/div/div[2]/nav/div"; // XPath to GIF picker, maybe use something more robust here
        const navBar = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (navBar && !document.getElementById("export-gifs-btn")) {
            const btn = document.createElement("div");
            btn.id = "export-gifs-btn";
            btn.innerHTML = "Export GIFs";

            btn.style = `
                margin-left: auto;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                background: #5865F2;
                color: white;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                transition: background-color 0.2s;
            `;

            btn.onmouseover = () => btn.style.backgroundColor = '#4752C4';
            btn.onmouseout = () => btn.style.backgroundColor = '#5865F2';

            btn.onclick = () => {
                try {
                    const settings = getFrecencySettings();
                    settings.loadIfNecessary();
                    const gifs = settings.getCurrentValue().favoriteGifs.gifs;
                    downloadJSON(gifs, "discord-favorite-gifs.json");
                } catch (err) {
                    alert("Click into the GIF tab first to initialize data.");
                }
            };

            navBar.appendChild(btn);
        }
    }

    // Add button in GIF picker once it's opened
    const observer = new MutationObserver(() => {
        injectButton();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();