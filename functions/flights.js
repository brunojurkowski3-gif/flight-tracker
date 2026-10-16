<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Flight Tracker</title>
  
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  
  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
    }
    #map {
      height: 100vh;
      width: 100vw;
    }
    #status-card {
      position: absolute;
      top: 15px;
      right: 15px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 1px solid #ddd;
    }
    #status-card h2 {
      margin: 0 0 4px 0;
      font-size: 15px;
      letter-spacing: 0.5px;
    }
    #status-card p {
      margin: 0;
      font-size: 13px;
      color: #0078ff;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <div id="status-card">
    <h2>📡 Live Flight Tracker</h2>
    <p id="plane-count">Connecting to live feed...</p>
  </div>

  <div id="map"></div>

  <!-- Leaflet JS Library -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    // 1. Initialize Map centered over Central Europe (Poland)
    const map = L.map('map').setView([50.0647, 19.9450], 6);

    // 2. Bright OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    const planeMarkers = {};

    // 3. Fetch data directly from your worker root
    async function fetchFlightData() {
      const apiUrl = 'https://flight-tracker.brunojurkowski3.workers.dev/';

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        const aircraftList = data.ac || [];

        document.getElementById('plane-count').innerText = `Live Aircraft Visible: ${aircraftList.length}`;

        const updatedHexes = new Set();

        aircraftList.forEach(plane => {
          const hex = plane.hex;
          const callsign = plane.flight ? plane.flight.trim() : (plane.r || 'UNKNOWN');
          const pLat = plane.lat;
          const pLon = plane.lon;
          const alt = plane.alt_baro !== undefined ? `${plane.alt_baro} ft` : 'N/A';
          const speed = plane.gs !== undefined ? `${Math.round(plane.gs)} knots` : 'N/A';
          const aircraftType = plane.t || 'Unknown Type';

          if (!pLat || !pLon) return;

          updatedHexes.add(hex);

          const popupContent = `
            <strong>Callsign:</strong> ${callsign}<br>
            <strong>Type:</strong> ${aircraftType}<br>
            <strong>ICAO Hex:</strong> ${hex.toUpperCase()}<br>
            <strong>Altitude:</strong> ${alt}<br>
            <strong>Speed:</strong> ${speed}
          `;

          if (planeMarkers[hex]) {
            planeMarkers[hex].setLatLng([pLat, pLon]);
            planeMarkers[hex].getPopup().setContent(popupContent);
          } else {
            const marker = L.circleMarker([pLat, pLon], {
              radius: 6,
              color: '#0056b3',
              fillColor: '#0078ff',
              fillOpacity: 0.9,
              weight: 1.5
            }).bindPopup(popupContent);

            marker.addTo(map);
            planeMarkers[hex] = marker;
          }
        });

        // Clean up markers that left the area
        Object.keys(planeMarkers).forEach(hex => {
          if (!updatedHexes.has(hex)) {
            map.removeLayer(planeMarkers[hex]);
            delete planeMarkers[hex];
          }
        });

      } catch (err) {
        console.error("Failed to fetch aircraft:", err);
        document.getElementById('plane-count').innerText = "Connection error. Retrying...";
      }
    }

    // Initial fetch & refresh loop every 15 seconds
    fetchFlightData();
    setInterval(fetchFlightData, 15000);
  </script>
</body>
</html>
