// userMap.js
console.log('userMap.js loaded successfully');

let map;
let userMarker = null;
let userLocation = null;
let accuracyCircle = null;
let earthquakeCircles = [];
let watchId = null;

// Initialize map
function initMap() {
    console.log('Initializing Leaflet map...');
    
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded! Retrying...');
        setTimeout(initMap, 500);
        return false;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found! Retrying...');
        setTimeout(initMap, 500);
        return false;
    }

    try {
        map = L.map('map', {
            zoomControl: true,
            maxZoom: 19,
            minZoom: 2
        }).setView([20, 0], 2);

        console.log('Map object created');

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
        }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        console.log('Map tiles added');

        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                console.log('Map size invalidated');
            }
        }, 300);

        return true;
    } catch (error) {
        console.error('Error initializing map:', error);
        return false;
    }
}

function getColorByMagnitude(mag) {
    if (mag >= 8) return '#8B0000';
    if (mag >= 7) return '#DC143C';
    if (mag >= 6) return '#FF6347';
    if (mag >= 5) return '#FFA500';
    if (mag >= 4) return '#FFD700';
    return '#A9A9A9';
}

function getRadiusByMagnitude(mag) {
    if (mag >= 8) return 500000;
    if (mag >= 7) return 250000;
    if (mag >= 6) return 100000;
    if (mag >= 5) return 50000;
    if (mag >= 4) return 20000;
    return 10000;
}

function getImpactDescription(mag) {
    if (mag >= 8) return 'Great earthquake. Widespread destruction across regions.';
    if (mag >= 7) return 'Major earthquake. Severe damage; felt over huge distances.';
    if (mag >= 6) return 'Strong shaking. Potential for significant damage in populated areas.';
    if (mag >= 5) return 'Moderate shaking. Can cause damage to poorly constructed buildings.';
    if (mag >= 4) return 'Light shaking. Felt indoors; hanging objects swing.';
    return 'Minor earthquake. Generally not felt.';
}

function addUserMarker(lat, lon, accuracy) {
    console.log('Adding user marker at:', lat, lon);
    
    if (!map) {
        console.error('Map not initialized');
        return;
    }

    userLocation = { lat, lon };

    if (userMarker) map.removeLayer(userMarker);
    if (accuracyCircle) map.removeLayer(accuracyCircle);

    const userIcon = L.divIcon({
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
        html: '<div class="user-marker"></div>'
    });

    userMarker = L.marker([lat, lon], { 
        icon: userIcon,
        zIndexOffset: 10000,
        interactive: true
    }).addTo(map);
    
    console.log('User marker added');

    userMarker.bindPopup(`
        <div style="font-family: Arial, sans-serif; min-width: 260px;">
            <div class="popup-title" style="color: #2196F3; border-color: #2196F3;">
                📍 Your Location
            </div>
            <div class="popup-row">
                <span class="popup-label">Latitude:</span>
                <span class="popup-value">${lat.toFixed(6)}°</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Longitude:</span>
                <span class="popup-value">${lon.toFixed(6)}°</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">GPS Accuracy:</span>
                <span class="popup-value">±${accuracy.toFixed(1)} meters</span>
            </div>
            <div style="margin-top: 12px; padding: 10px; background: #e3f2fd; border-radius: 5px; font-size: 12px; color: #1565c0;">
                ℹ️ Your current position. The blue circle shows accuracy range.
            </div>
        </div>
    `, {
        maxWidth: 320
    });

    accuracyCircle = L.circle([lat, lon], {
        color: '#2196F3',
        fillColor: '#2196F3',
        fillOpacity: 0.15,
        radius: accuracy,
        weight: 2,
        dashArray: '10, 5',
        opacity: 0.6
    }).addTo(map);

    console.log('Accuracy circle added');
    map.setView([lat, lon], 13);

    setTimeout(() => {
        if (userMarker) userMarker.openPopup();
    }, 500);
}

function retryLocation() {
    console.log('Retrying location...');
    const statusEl = document.getElementById('user-location-status');
    if (statusEl) {
        statusEl.innerHTML = '🔄 Retrying...';
    }
    getUserLocation();
}

function goToUserLocation() {
    if (userLocation && userMarker && map) {
        map.setView([userLocation.lat, userLocation.lon], 15);
        setTimeout(() => {
            if (userMarker) userMarker.openPopup();
        }, 500);
    } else {
        alert('Location not available. Please allow location access or wait for GPS to acquire signal.');
    }
}

function getUserLocation() {
    console.log('getUserLocation called');
    
    const statusEl = document.getElementById('user-location-status');
    
    if (!("geolocation" in navigator)) {
        console.error('Geolocation not supported');
        if (statusEl) {
            statusEl.innerHTML = '❌ Not supported';
        }
        return;
    }

    if (statusEl) {
        statusEl.innerHTML = '📍 Requesting...';
    }
    
    console.log('Requesting geolocation...');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('Location received:', position);
            
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            console.log(`Lat: ${lat}, Lon: ${lon}, Accuracy: ${accuracy}m`);

            addUserMarker(lat, lon, accuracy);
            
            if (statusEl) {
                statusEl.innerHTML = `📍 ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            }
            
            console.log('User location set successfully');
        },
        (error) => {
            console.error('Geolocation error:', error);
            
            let errorMsg = '❌ Access failed';
            
            if (error.code === error.PERMISSION_DENIED) {
                errorMsg = '🚫 Permission denied';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMsg = '📡 Signal unavailable';
            } else if (error.code === error.TIMEOUT) {
                errorMsg = '⏱️ Timeout';
            }
            
            if (statusEl) {
                statusEl.innerHTML = errorMsg;
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

async function fetchEarthquakeData() {
    try {
        console.log('Fetching earthquake data...');
        const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
        const data = await response.json();
        console.log('Earthquake data fetched:', data.features.length, 'earthquakes');
        return data;
    } catch (error) {
        console.error('Error fetching earthquake data:', error);
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = '<div class="spinner"></div><p>Error loading data. Retrying...</p>';
        }
        return null;
    }
}

function displayEarthquakes(data) {
    console.log('Displaying earthquakes...');
    
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    if (!data || !data.features) {
        console.error('No earthquake data to display');
        return;
    }

    if (!map) {
        console.error('Map not initialized');
        return;
    }

    const countEl = document.getElementById('earthquake-count');
    if (countEl) {
        countEl.innerHTML = `<strong>${data.features.length}</strong> earthquakes (24h)`;
    }
    
    const now = new Date();
    const updateEl = document.getElementById('last-update');
    if (updateEl) {
        updateEl.innerHTML = `Updated: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }

    earthquakeCircles.forEach(circle => {
        try {
            map.removeLayer(circle);
        } catch (e) {
            console.error('Error removing circle:', e);
        }
    });
    earthquakeCircles = [];

    console.log('Adding', data.features.length, 'earthquake markers...');

    data.features.forEach((earthquake) => {
        try {
            const coords = earthquake.geometry.coordinates;
            const mag = earthquake.properties.mag;
            const place = earthquake.properties.place;
            const time = new Date(earthquake.properties.time);

            const circle = L.circle([coords[1], coords[0]], {
                color: getColorByMagnitude(mag),
                fillColor: getColorByMagnitude(mag),
                fillOpacity: 0.25,
                radius: getRadiusByMagnitude(mag),
                weight: 3,
                opacity: 0.8
            }).addTo(map);

            const radiusKm = (getRadiusByMagnitude(mag) / 1000).toFixed(0);
            const color = getColorByMagnitude(mag);

            circle.bindPopup(`
                <div style="font-family: Arial, sans-serif; min-width: 280px;">
                    <div class="popup-title" style="color: ${color}; border-color: ${color};">
                        🔴 Magnitude ${mag.toFixed(1)}
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Impact Radius:</span>
                        <span class="popup-value" style="color: ${color}; font-weight: bold;">${radiusKm} km</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Location:</span>
                        <span class="popup-value">${place}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Date & Time:</span>
                        <span class="popup-value">${time.toLocaleDateString()} ${time.toLocaleTimeString()}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Depth:</span>
                        <span class="popup-value">${coords[2].toFixed(1)} km</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Coordinates:</span>
                        <span class="popup-value">${coords[1].toFixed(3)}°, ${coords[0].toFixed(3)}°</span>
                    </div>
                    <div class="popup-description" style="border-color: ${color};">
                        <strong>Impact:</strong> ${getImpactDescription(mag)}
                    </div>
                </div>
            `, {
                maxWidth: 350
            });

            earthquakeCircles.push(circle);
        } catch (e) {
            console.error('Error adding earthquake marker:', e);
        }
    });

    console.log('Added', earthquakeCircles.length, 'earthquake markers');
}

async function initialize() {
    console.log('=== Starting initialization ===');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mapInitialized = initMap();
    
    if (!mapInitialized) {
        console.error('Map initialization failed, retrying...');
        setTimeout(initialize, 1000);
        return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Map ready, requesting location...');
    getUserLocation();
    
    console.log('Loading earthquake data...');
    const data = await fetchEarthquakeData();
    if (data) {
        displayEarthquakes(data);
    }
    
    console.log('=== Initialization complete ===');
}

setInterval(async () => {
    console.log('Auto-refreshing earthquake data...');
    const data = await fetchEarthquakeData();
    if (data) {
        displayEarthquakes(data);
    }
}, 300000);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

console.log('userMap.js initialization setup complete');