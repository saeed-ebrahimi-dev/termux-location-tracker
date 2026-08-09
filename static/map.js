// Toggle the info card when the FAB button is tapped (mobile)
document.getElementById('menuFab').addEventListener('click', function() {
    const card = document.getElementById('infoCard');
    card.classList.toggle('open');
    this.textContent = card.classList.contains('open') ? '✕' : '📍';
});

const map = L.map('map', { zoomControl: true }).setView([32.0, 53.0], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const targetIcon = L.divIcon({
    className: 'tracker-target-icon',
    html: '<div class="tracker-target"><div class="tt-ring"></div><div class="tt-ring"></div><div class="tt-ring"></div><div class="tt-dot"></div></div>',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
});

let targetMarker = null;
let accuracyCircle = null;
let pathTrail = [];
let trailPolyline = null;

function updateMap(data) {
    const lat = data.location.latitude;
    const lon = data.location.longitude;

    if (!targetMarker) {
        targetMarker = L.marker([lat, lon], { icon: targetIcon }).addTo(map);
        targetMarker.bindPopup('<b>🎯 Target Location</b><br>' + lat.toFixed(6) + ', ' + lon.toFixed(6));
    } else {
        targetMarker.setLatLng([lat, lon]);
        targetMarker.setPopupContent('<b>🎯 Target Location</b><br>' + lat.toFixed(6) + ', ' + lon.toFixed(6));
    }

    const accuracy = data.location.accuracy || 0;
    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
    }
    accuracyCircle = L.circle([lat, lon], {
        radius: accuracy,
        color: '#4285F4',
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        weight: 1
    }).addTo(map);

    // Keep a trail of the last 100 positions
    pathTrail.push([lat, lon]);
    if (pathTrail.length > 100) pathTrail.shift();

    if (!trailPolyline) {
        trailPolyline = L.polyline(pathTrail, {
            color: '#ff6b6b',
            weight: 3,
            opacity: 0.8,
            dashArray: '6, 8',
            lineJoin: 'round'
        }).addTo(map);
    } else {
        trailPolyline.setLatLngs(pathTrail);
    }

    if (accuracy > 0) {
        map.fitBounds(accuracyCircle.getBounds(), { maxZoom: 17 });
    } else {
        map.setView([lat, lon], 16);
    }

    document.getElementById('latVal').textContent = lat.toFixed(6);
    document.getElementById('lonVal').textContent = lon.toFixed(6);
    document.getElementById('altVal').textContent = (data.location.altitude != null ? data.location.altitude.toFixed(1) + ' m' : '--');
    document.getElementById('accVal').textContent = (data.location.accuracy != null ? data.location.accuracy.toFixed(1) + ' m' : '--');
    document.getElementById('spdVal').textContent = (data.location.speed != null ? data.location.speed.toFixed(2) + ' m/s' : '--');
    document.getElementById('brgVal').textContent = (data.location.bearing != null ? data.location.bearing.toFixed(1) + '°' : '--');
    document.getElementById('provVal').textContent = data.location.provider || '--';

    // Build the Google Maps links from the current coordinates
    const coordStr = lat.toFixed(6) + ',' + lon.toFixed(6);
    const encodedCoord = encodeURIComponent(coordStr);

    document.getElementById('googleMapsBtn').href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodedCoord + '&travelmode=driving';

    const gmapsViewUrl = 'https://www.google.com/maps?q=' + encodedCoord + '&z=16';
    const viewBtn = document.getElementById('googleMapsViewBtn');
    if (viewBtn) {
        viewBtn.href = gmapsViewUrl;
    }

    if (data.battry) {
        const percent = data.battry.percentage != null ? data.battry.percentage : (data.battry.level != null ? data.battry.level : null);
        const fill = document.getElementById('batteryFill');
        const pctEl = document.getElementById('batteryPercent');

        if (percent != null) {
            pctEl.textContent = percent + '%';
            fill.style.width = percent + '%';
            fill.classList.toggle('low', percent < 20);
            fill.classList.toggle('medium', percent >= 20 && percent < 50);
        }

        let statusText = data.battry.status || '';
        if (data.battry.plugged && data.battry.plugged !== 'UNPLUGGED') {
            statusText = '⚡ Charging';
        } else if (statusText === 'DISCHARGING') {
            statusText = '🔋 Discharging';
        } else if (statusText === 'FULL') {
            statusText = '✅ Full';
        }
        statusText += ' | ' + (data.battry.temperature != null ? data.battry.temperature.toFixed(1) + '°C' : '');
        document.getElementById('batteryStatus').textContent = statusText;
    }

    if (data.received_at_display) {
        document.getElementById('lastUpdate').textContent = 'Last device data: ' + data.received_at_display;
    } else {
        const now = new Date();
        const nowStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB');
        document.getElementById('lastUpdate').textContent = 'Last device data: ' + nowStr;
    }
}

function showStatus(msg, show = true) {
    const el = document.getElementById('statusOverlay');
    el.textContent = msg;
    el.style.display = show ? 'block' : 'none';
    if (show) {
        setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
}

let pollTimer = null;
let lastDataHash = '';
let isFirstLoad = true;

async function fetchLatest() {
    try {
        const res = await fetch('/api/location');
        const json = await res.json();
        if (json.location) {
            const hash = JSON.stringify(json);
            if (hash !== lastDataHash || isFirstLoad) {
                lastDataHash = hash;
                isFirstLoad = false;
                const data = {
                    location: json.location,
                    battry: json.battry,
                    received_at_display: json.received_at_display
                };
                updateMap(data);
                showStatus('🟢 New data received');
            }
        } else {
            document.getElementById('statusOverlay').textContent = '⏳ Waiting for data from device...';
            document.getElementById('statusOverlay').style.display = 'block';
        }
    } catch (e) {
        console.error('Error fetching data:', e);
        showStatus('🔴 Connection error', true);
    }
}

function startPolling() {
    fetchLatest();
    pollTimer = setInterval(fetchLatest, 2000);
}

startPolling();