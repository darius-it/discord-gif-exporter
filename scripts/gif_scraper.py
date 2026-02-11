
import os
import json
import requests
import subprocess
from urllib.parse import urlparse

INPUT_JSON_FILE = "input.json"
OUTPUT_DIR = "gifs"
TEMP_DIR = "temp"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)


def safe_filename(url):
    parsed = urlparse(url)
    name = os.path.basename(parsed.path)
    name = os.path.splitext(name)[0]
    return name.replace("-", "_")


def download(url):
    if url.startswith("//"):
        url = "https:" + url

    response = requests.get(url, stream=True)
    response.raise_for_status()

    filename = os.path.basename(urlparse(url).path)
    temp_path = os.path.join(TEMP_DIR, filename)

    with open(temp_path, "wb") as f:
        for chunk in response.iter_content(8192):
            f.write(chunk)

    return temp_path


def convert_to_gif(input_path, output_path):
    palette_path = input_path + "_palette.png"

    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-vf", "palettegen",
        palette_path
    ], check=True)

    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-i", palette_path,
        "-lavfi", "paletteuse",
        output_path
    ], check=True)

    os.remove(palette_path)


def main():
    with open(INPUT_JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    for original_url, meta in data.items():
        try:
            print(f"Processing: {original_url}")

            src = meta["src"]
            temp_file = download(src)

            output_file = os.path.join(
                OUTPUT_DIR,
                safe_filename(original_url) + ".gif"
            )

            convert_to_gif(temp_file, output_file)

            print(f"Saved: {output_file}")

        except Exception as e:
            print(f"Failed: {e}")

    print("Done.")


if __name__ == "__main__":
    main()
