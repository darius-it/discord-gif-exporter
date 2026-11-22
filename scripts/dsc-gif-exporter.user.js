// ==UserScript==
// @name         Discord GIF Exporter (simple JSON download)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds an export button to the Discord GIF/Emoji/Sticker navigation bar
// @author       darius-it
// @match        https://discord.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const isSettingsModule = x => !!x?.ProtoClass?.typeName?.includes("FrecencyUserSettings");

    const scanExports = exp => {
        if (!exp || typeof exp !== "object" || exp === window) return undefined;
        return [exp, ...Object.values(exp)].find(isSettingsModule);
    };

    // Find internal module for GIFs through Webpack, credits: https://gist.github.com/Davr1/af6a5806a3bf4b5b7dc18829029b42c2
    const getFrecencySettings = () => {
        if (window.FrecencyUserSettings) return window.FrecencyUserSettings;

        // Grab webpack's require function
        const req = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
        webpackChunkdiscord_app.pop();
        console.log("[GIF export] webpack require keys:", req && Object.keys(req));

        let found;

        // Strategy A: scan the module cache (the original approach)
        const cache = req?.c ?? req?.cache;
        if (cache) {
            for (const m of Object.values(cache)) {
                let exp;
                try { exp = m?.exports; } catch { continue; }
                found = scanExports(exp);
                if (found) break;
            }
        }

        // Strategy B: no cache exposed, so find the module by its factory source and require just that one
        if (!found && req?.m) {
            for (const id of Object.keys(req.m)) {
                let src = "";
                try { src = Function.prototype.toString.call(req.m[id]); } catch { continue; }
                if (!src.includes("FrecencyUserSettings")) continue;
                try { found = scanExports(req(id)); } catch { continue; }
                if (found) break;
            }
        }

        if (found) window.FrecencyUserSettings = found; // only cache a real hit
        return found;
    };

    function downloadJSON(content, download) {
        const json = JSON.stringify(content, null, 2);
        Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(new Blob([json], { type: "application/json" })),
            download
        }).click();
    }

    function injectButton() {
        // Anchor on stable ARIA attributes rather than an absolute XPath or hashed class names
        const navBar =
            document.querySelector('[role="tablist"][aria-label="Expression Picker Categories"]') ||
            document.getElementById("gif-picker-tab")?.parentElement;

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
                    console.log("[GIF export] settings module:", settings);
                    if (!settings) throw new Error("FrecencyUserSettings module not found");

                    settings.loadIfNecessary?.();
                    const value = settings.getCurrentValue();
                    console.log("[GIF export] value:", value);

                    const gifs = value.favoriteGifs?.gifs;
                    if (!gifs) throw new Error("favoriteGifs.gifs missing, keys: " + Object.keys(value).join(", "));
                    downloadJSON(gifs, "discord-favorite-gifs.json");
                } catch (err) {
                    console.error("[GIF export]", err);
                    alert("Export failed: " + err.message + " (see console)");
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
