function downloadExportedGifs() {
    const uploadedFiles = document.getElementById("json-export-upload").files;
    if (uploadedFiles.length > 1) {
        console.error("Cannot upload more than one JSON!");
        return;
    }
    const exportJSON = uploadedFiles[0];

    const enableWasmConversion = document.getElementById("gif-conversion-enabled").checked;

    console.log(exportJSON);
    console.log(enableWasmConversion);
}