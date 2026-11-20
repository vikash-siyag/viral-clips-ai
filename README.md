# 🎬 ViralClips.AI — 9:16 Shorts Generator & Director Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node: >=18](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Format: 9:16 Shorts](https://img.shields.io/badge/Format-9%3A16%20Shorts%20(1080x1920)-FFE600.svg)](https://github.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com)

A web studio to convert video streams and media links into vertical **9:16 shorts** featuring:
- **Top half (50%)**: Speaker / Facecam cropped and centered with voice audio
- **Bottom half (50%)**: Gameplay / B-roll footage (strictly muted)
- **Subtitles**: Word-by-word karaoke captions with the active word in **bright yellow**
- **Top Hook**: 2-second bold headline banner at the start
- **Director Feedback**: Prompt-driven adjustments for camera crop framing, zoom, subtitle sync offset, and automated re-export to `/clips/clip_01.mp4`.

---

## ⚡ Key Specifications

| Component | Technical Specification |
| :--- | :--- |
| **Output Resolution** | 1080 × 1920 (9:16 portrait aspect ratio @ 60FPS) |
| **Top Section** | Speaker video cropped with customizable X/Y positioning and zoom factor |
| **Bottom Section** | Muted background footage (3D Runner, Voxel Parkour, Neon Stunt Ramp, or stream gameplay) |
| **Karaoke Subtitles** | Word-level timing synchronization with the active spoken word in `#FFE600` yellow |
| **Headline Hook** | Prominent top banner animated during time `0.0s` to `2.0s` |
| **Export Folder** | Sequential files automatically output as `/clips/clip_01.mp4`, `clip_02.mp4` |
| **Adjustment Engine** | Chat prompt interface to correct face framing, zoom, or subtitle timing delays |

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/viral-clips-ai.git
cd viral-clips-ai
```

### 2. Start the local server
```bash
npm start
```
*Alternatively, run directly with Node:*
```bash
node server/server.js
```

### 3. Open in your browser
Open `http://localhost:3000` to access the studio.

---

## 🎯 Director Prompt Controls

You can adjust framing and synchronization via the built-in natural language input bar:

| Request | Example Prompt | Action Performed |
| :--- | :--- | :--- |
| **Face crop too high** | `"Face cut off on top, shift down 15%"` | Adjusts top crop Y-offset downwards |
| **Face too distant** | `"Zoom in on face 20%"` | Increases speaker scale multiplier |
| **Captions behind audio** | `"Captions late by 0.4s, make them faster"` | Shifts subtitle timing offset earlier (`-0.4s`) |
| **Captions ahead of audio** | `"Captions 0.2s ahead of audio"` | Shifts subtitle timing offset later (`+0.2s`) |
| **Update 2s hook headline** | `"Change hook to: HOW VIDEO PIPELINES WORK ⚙️"` | Replaces the 2-second intro hook text |
| **Switch background** | `"Switch gameplay to 3D Speed Runner"` | Updates the bottom half video track |
| **Export immediately** | `"Looks great! Fix and re-export now"` | Re-renders and writes next clip to `/clips` |

---

## 📁 Repository Structure

```text
viral-clips-ai/
├── clips/                     # Destination for rendered shorts (.gitkeep)
│   ├── clip_01.mp4
│   └── clip_02.mp4
├── public/                    # Web frontend
│   ├── index.html             # Studio UI & 9:16 Canvas Viewport
│   ├── css/
│   │   └── style.css          # Dark studio theme
│   ├── js/
│   │   ├── app.js             # Main controller
│   │   ├── player.js          # 9:16 composition engine
│   │   ├── captions.js        # Word-by-word karaoke renderer
│   │   ├── director.js        # Natural language adjustment processor
│   │   ├── exporter.js        # 1080x1920 encoder & disk exporter
│   │   └── presets.js         # Sample presets & procedural b-roll
│   └── assets/
├── server/
│   ├── server.js              # REST API & static server
│   └── ffmpeg_pipeline.js     # FFmpeg filter_complex script builder
├── scripts/
│   ├── export_cli.js          # CLI export utility
│   └── test_studio.js         # Automated test suite
├── Dockerfile                 # Docker container with FFmpeg
├── docker-compose.yml         # Container orchestration
├── package.json
├── .gitignore
└── README.md
```

---

## 🐙 Pushing to GitHub

To push this project to your GitHub account:

```bash
git init
git add .
git commit -m "Initial commit: 9:16 viral shorts generator studio"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/viral-clips-ai.git
git push -u origin main
```

---

## 🐳 Docker Support

To run in Docker with pre-installed FFmpeg:
```bash
docker-compose up --build
```
Rendered clips in `/app/clips` will map to your local `./clips` directory.

---

## 🧪 Verification Tests

Run the test suite:
```bash
node scripts/test_studio.js
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
