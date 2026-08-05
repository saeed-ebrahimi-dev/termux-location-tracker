# 📍 Termux Location Tracker

Track your Android device's location and battery status in real-time on a live map.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-✓-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A lightweight **FastAPI** server + **Termux** script that sends your Android device's GPS location and battery status to a live **Leaflet** map — perfect for tracking a phone, a car, or any device running Termux.

---

## ✨ Features

- 🗺️ **Live map** with GPS accuracy circle and movement trail (last 100 points)
- 🔋 **Battery status** — percentage, health, temperature, voltage, and more
- 🧭 **Google Maps navigation** link with exact coordinates
- 📊 **Coordinates card** — latitude, longitude, altitude, speed, bearing
- 📱 **Fully responsive** — works on desktop, tablet, and mobile
- 🔄 **Auto-refresh** every 2 seconds (polling)
- ⏱️ **Last device data time** — shows when the device actually sent data
- 🛡️ **Never-stop Termux script** — survives errors and network drops

---

## 📁 Project Structure

```
├── main.py                    # FastAPI server
├── requirements.txt           # Python dependencies
├── templates/
│   └── map.html               # Live map page (Leaflet)
├── termux-script/
│   └── send_location.sh       # Termux script (Android device)
└── example_data.json          # Sample data for testing
```

---

## 🖥️ Server Setup

### 1. Install dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the server

```bash
python main.py
```

The server runs on `http://0.0.0.0:9000`.

> ⚠️ **Note:** For real-world use, run the server on a machine with a public IP or use a tunnel like [ngrok](https://ngrok.com) / [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/).

---

## 📱 Android Device Setup (Termux)

### 1. Install Termux and prerequisites

> ⚠️ **Important:** `termux-api` is a **separate app** that must be installed alongside Termux.

1. Install **Termux** from [F-Droid](https://f-droid.org/en/packages/com.termux/) (recommended) or Google Play
2. Install **Termux:API** app from [F-Droid](https://f-droid.org/en/packages/com.termux.api/) (required for GPS & battery access)
3. Open Termux and install the API package + tools:

```bash
pkg install termux-api jq curl
```

### 2. Run the location script

```bash
bash termux-script/send_location.sh http://YOUR_SERVER_IP:9000 5
```

**Arguments:**
| Argument | Description | Default |
|----------|-------------|---------|
| `1` | Server URL | `http://YOUR_SERVER_IP:9000` |
| `2` | Send interval (seconds) | `5` |

The script:
- 🔒 Acquires a **wake lock** so Android won't kill it
- 🔄 **Never stops** — retries forever on any error
- 📡 Sends GPS location + battery status every N seconds

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/location` | Receive location & battery JSON from device |
| `GET` | `/api/location` | Latest stored data (JSON) |
| `GET` | `/` or `/map` | Live map page |

### Test with sample data

```bash
curl -X POST http://localhost:9000/location \
  -H "Content-Type: application/json" \
  -d @example_data.json
```

---

## 🗺️ Map Page Features

- 🎯 Target marker with GPS accuracy circle
- 🔋 Battery indicator at the top (percentage, status, temperature)
- 🧭 Google Maps navigation link (with exact coordinates)
- 📍 Direct Google Maps view link
- 📊 Coordinates info card (latitude, longitude, altitude, speed, bearing)
- 🛤️ Movement trail (last 100 points)
- 📱 Fully responsive (desktop, tablet, mobile)
- 🔄 Auto-refresh every 2 seconds (polling)
- ⏱️ Last device data time

---

## 🛠️ Tech Stack

- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/)
- **Frontend:** [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/)
- **Device:** [Termux](https://termux.dev/) + `termux-api`

---

## 📄 License

MIT License — feel free to use, modify, and share.