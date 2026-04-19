async function downloadExportedGifs() {
    const uploadedFiles = document.getElementById("json-export-upload").files;
    if (uploadedFiles.length > 1) {
        showMessage("Cannot upload more than one JSON!", "error");
        return;
    }
    const exportJSON = uploadedFiles[0];
    const enableWasmConversion = document.getElementById("gif-conversion-enabled").checked;

    const gifList = await getGifsArray(exportJSON);

    const folderHandle = await getFolderHandle();

    updateStatus(`Downloaded 0/${gifList.length} files...`)

    let downloadedGifs = 0;
    for (let gifNum = 0; gifNum < gifList.length; gifNum++) {
        const element = gifList[gifNum];

        try {
            const fetchedFileResult = await fetch(element.src); // TODO: strip discord external paths and fetch the original link
            await downloadFile(folderHandle, element.originalReference.split("/").at(-1), fetchedFileResult);
        }
        catch(err) {
            showMessage(`Error while downloading file, skipping...`, "error")
            continue;
        }
        
        downloadedGifs++;
        updateStatus(`Downloaded ${gifNum+1}/${gifList.length} files...`);
    }
    
    updateStatus("");
    showMessage("Successfully downloaded your GIFs.");
}

/**
 * Opens the folder picker and returns a handle.
 * Must be called from a user-initiated event (like a click).
 */
async function getFolderHandle() {
  try {
    const handle = await window.showDirectoryPicker({
        mode: "readwrite"
    });
    return handle;
  } catch (err) {
    showMessage(`User cancelled or folder access denied: ${err}`, "error");
    return null;
  }
}

/**
 * Streams a fetch response body directly into a file within a directory.
 */
async function downloadFile(dirHandle, filename, response) {
  if (!response.body) {
    showMessage("Failed downloading file: The response has no body to stream.", "error");
    throw new Error("The response has no body to stream.");
  }

  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await response.body.pipeTo(writable);
}

/**
 * Returns an array of objects with information about each exported GIF
 */
async function getGifsArray(file) {
    const fileContents = await file.text();
    const parsedJSON = JSON.parse(fileContents);

    const gifsArray = Object.keys(parsedJSON).map(key => ({
        originalReference: key,
        ...parsedJSON[key]
    }));

    return gifsArray;
}

function showMessage(message, type) {
    const messageDisplay = document.getElementById("message");
    messageDisplay.textContent = message;
    messageDisplay.style.color = type === "error" ? "red" : "green";
}

function updateStatus(message) {
    const statusDisplay = document.getElementById("status");
    statusDisplay.textContent = message;
}