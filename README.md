# discord-gif-exporter
Small utility to export Discord favorite GIFs from the Browser (using a Tampermonkey Userscript).

## How to use:
1. Install Tampermonkey ([Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) | [Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en))
2. Open [the script](https://github.com/darius-it/discord-gif-exporter/raw/refs/heads/main/scripts/dsc-gif-exporter-1.0.user.js) and press install
3. Access Discord from the browser, go to any chat and open the GIF picker
4. There should be a button saying "Export GIFs", which will download a JSON file with links to all of your favorited GIFs.
<img width="638" height="142" alt="image" src="https://github.com/user-attachments/assets/670c2f77-839f-48f0-a34b-20c86526ff2a" />

<br>
Enjoy! From this point on, you can use the JSON file to download the GIFs for archival purposes.

## Credits
Logic for extracting the GIFs is from this GitHub Gist by Davr1: https://gist.github.com/Davr1/af6a5806a3bf4b5b7dc18829029b42c2, I adapted it into a Tampermonkey Userscript for convenience purposes.
