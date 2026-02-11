import os
import json
import requests
import subprocess
import argparse
import sys
from urllib.parse import urlparse


def safe_filename(url):
    parsed = urlparse(url)
    name = os.path.basename(parsed.path)
    name = os.path.splitext(name)[0]
    return name.replace("-", "_")


def download(url, temp_dir):
    if url.startswith("//"):
        url = "https:" + url

    response = requests.get(url, stream=True)
    response.raise_for_status()

    filename = os.path.basename(urlparse(url).path)
    temp_path = os.path.join(temp_dir, filename)

    with open(temp_path, "wb") as f:
        for chunk in response.iter_content(8192):
            f.write(chunk)

    return temp_path


def convert_to_gif(input_path, output_path, compression=50):
    # Compression logic
    # compression 0: Original quality
    # compression 50: ~500px width
    # compression 100: ~200px width
    
    filters = []
    
    if compression > 0:
        # Calculate target width: 800 down to 200
        target_width = int(800 - (compression * 6))
        target_width = max(200, target_width)  # Floor at 200px

        # Scale but don't upscale if image is smaller
        filters.append(f"scale='min(iw,{target_width})':-1:flags=lanczos")

    # Construct complex filter graph
    filter_chain = ",".join(filters) if filters else "null"
    
    # [0:v] filters [x]; [x] split [a][b]; [a] palettegen [p]; [b][p] paletteuse
    if filters:
        complex_filter = f"[0:v]{filter_chain},split[a][b];[a]palettegen[p];[b][p]paletteuse"
    else:
        complex_filter = "[0:v]split[a][b];[a]palettegen[p];[b][p]paletteuse"

    cmd = [
        "ffmpeg", "-y", "-v", "warning", # Suppress verbose logs
        "-i", input_path,
        "-filter_complex", complex_filter,
        output_path
    ]
    
    subprocess.run(cmd, check=True)


def main():
    parser = argparse.ArgumentParser(description="Download and convert GIFs from a JSON input.")
    parser.add_argument("--input", default="input.json", help="Path to input JSON file")
    parser.add_argument("--output", default="gifs", help="Path to output directory")
    parser.add_argument("--temp", default="temp", help="Path to temporary directory")
    parser.add_argument("--compression", type=int, default=50, help="Compression level 0-100 (default: 50)")

    args = parser.parse_args()

    if not (0 <= args.compression <= 100):
        print("Error: Compression level must be between 0 and 100.")
        sys.exit(1)

    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' does not exist.")
        sys.exit(1)

    if os.path.exists(args.output):
        if os.listdir(args.output):
            print(f"Error: Output directory '{args.output}' is not empty.")
            sys.exit(1)
    else:
        os.makedirs(args.output)

    os.makedirs(args.temp, exist_ok=True)

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    for original_url, meta in data.items():
        try:
            print(f"Processing: {original_url}")

            src = meta["src"]
            temp_file = download(src, args.temp)

            output_file = os.path.join(
                args.output,
                safe_filename(original_url) + ".gif"
            )

            convert_to_gif(temp_file, output_file, args.compression)

            print(f"Saved: {output_file}")

        except Exception as e:
            print(f"Failed: {e}")

    print("Done.")


if __name__ == "__main__":
    main()
