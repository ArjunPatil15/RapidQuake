// userMap.js - Fixed Version with Manual Location Entry
console.log('userMap.js loaded successfully');

let map;
let userMarker = null;
let userLocation = null;
let accuracyCircle = null;
let earthquakeCircles = [];

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
            minZoom: 2,
            worldCopyJump: true,
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0
        }).setView([20, 0], 2);

        console.log('Map object created');

        // Satellite imagery layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19,
            noWrap: false
        }).addTo(map);

        // Labels layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap',
            subdomains: 'abcd',
            maxZoom: 19,
            noWrap: false
        }).addTo(map);

        console.log('Map tiles added');

        // Force map to fit in container
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                console.log('Map size invalidated');
            }
        }, 500);

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
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13],
        html: '<div class="user-marker"></div>'
    });

    userMarker = L.marker([lat, lon], { 
        icon: userIcon,
        zIndexOffset: 10000,
        interactive: true
    }).addTo(map);
    
    console.log('User marker added');

    userMarker.bindPopup(`
        <div style="font-family: Arial, sans-serif; min-width: 280px;">
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
                <span class="popup-label">Accuracy:</span>
                <span class="popup-value">±${accuracy.toFixed(1)} m</span>
            </div>
            <div style="margin-top: 12px; padding: 12px; background: #e3f2fd; border-radius: 8px; font-size: 12px; color: #1565c0;">
                ℹ️ Your current position. The blue circle shows the accuracy range.
            </div>
        </div>
    `, {
        maxWidth: 350
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

function manualLocation() {
    console.log('Manual location entry requested');
    
    const currentLat = userLocation ? userLocation.lat : 18.5204;
    const currentLon = userLocation ? userLocation.lon : 73.8567;
    
    const lat = prompt(`Enter your latitude:\n(Example: 18.5204 for Pune, India)\n(Range: -90 to 90)`, currentLat);
    
    if (lat === null) return; // User cancelled
    
    const lon = prompt(`Enter your longitude:\n(Example: 73.8567 for Pune, India)\n(Range: -180 to 180)`, currentLon);
    
    if (lon === null) return; // User cancelled
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
        alert('❌ Invalid coordinates!\n\nPlease enter valid numbers.\nLatitude: -90 to 90\nLongitude: -180 to 180');
        return;
    }
    
    if (latitude < -90 || latitude > 90) {
        alert('❌ Invalid latitude!\n\nLatitude must be between -90 and 90');
        return;
    }
    
    if (longitude < -180 || longitude > 180) {
        alert('❌ Invalid longitude!\n\nLongitude must be between -180 and 180');
        return;
    }
    
    console.log('Valid coordinates entered:', latitude, longitude);
    addUserMarker(latitude, longitude, 100);
    
    const statusEl = document.getElementById('user-location-status');
    if (statusEl) {
        statusEl.innerHTML = `📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Manual)`;
    }
    
    alert(`✅ Location set successfully!\n\nLatitude: ${latitude.toFixed(6)}°\nLongitude: ${longitude.toFixed(6)}°`);
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
        map.flyTo([userLocation.lat, userLocation.lon], 15, {
            duration: 1.5
        });
        setTimeout(() => {
            if (userMarker) userMarker.openPopup();
        }, 1600);
    } else {
        alert('📍 Location not available!\n\nPlease:\n1. Allow location access, or\n2. Click the orange button to enter your location manually');
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
        alert('⚠️ Geolocation not supported by your browser.\n\nClick the orange button to enter your location manually.');
        return;
    }

    if (statusEl) {
        statusEl.innerHTML = '📍 Requesting permission...';
    }
    
    console.log('Requesting geolocation...');

    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('✅ Location received:', position);
            
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
            console.error('❌ Geolocation error:', error);
            
            let errorMsg = '❌ Location failed';
            let detailMsg = '';
            
            if (error.code === 1) { // PERMISSION_DENIED
                errorMsg = '🚫 Permission denied';
                detailMsg = 'Location access was denied.\n\nTo fix this:\n1. Click the 🔒 icon in your address bar\n2. Allow location access\n3. Click the green retry button\n\nOR click the orange button to enter your location manually.';
            } else if (error.code === 2) { // POSITION_UNAVAILABLE
                errorMsg = '📡 Signal unavailable';
                detailMsg = 'GPS signal not available.\n\nTry:\n1. Moving near a window\n2. Enabling location services\n3. Using the orange button to enter location manually';
            } else if (error.code === 3) { // TIMEOUT
                errorMsg = '⏱️ Timeout';
                detailMsg = 'Location request timed out.\n\nTry:\n1. Click the green retry button\n2. Use the orange button to enter location manually';
            }
            
            if (statusEl) {
                statusEl.innerHTML = errorMsg;
            }
            
            console.log('Showing error alert...');
            setTimeout(() => {
                if (detailMsg) {
                    alert(errorMsg + '\n\n' + detailMsg);
                }
            }, 100);
        },
        options
    );
}

async function fetchEarthquakeData() {
    try {
        console.log('Fetching earthquake data from USGS...');
        const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Earthquake data fetched:', data.features.length, 'earthquakes');
        return data;
    } catch (error) {
        console.error('❌ Error fetching earthquake data:', error);
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = '<div class="spinner"></div><p>Error loading data. Retrying in 10s...</p>';
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
        countEl.innerHTML = `<strong>${data.features.length}</strong> earthquakes`;
    }
    
    const now = new Date();
    const updateEl = document.getElementById('last-update');
    if (updateEl) {
        updateEl.innerHTML = `${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }

    // Remove old earthquake circles
    earthquakeCircles.forEach(circle => {
        try {
            map.removeLayer(circle);
        } catch (e) {
            console.error('Error removing circle:', e);
        }
    });
    earthquakeCircles = [];

    console.log('Adding', data.features.length, 'earthquake markers...');

    data.features.forEach((earthquake, index) => {
        try {
            const coords = earthquake.geometry.coordinates;
            const mag = earthquake.properties.mag || 0;
            const place = earthquake.properties.place || 'Unknown location';
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
                <div style="font-family: Arial, sans-serif; min-width: 300px;">
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
                maxWidth: 380
            });

            earthquakeCircles.push(circle);
        } catch (e) {
            console.error('Error adding earthquake marker:', e);
        }
    });

    console.log('✅ Added', earthquakeCircles.length, 'earthquake markers');
}

async function initialize() {
    console.log('=== Starting RapidQuake Map Initialization ===');
    
    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mapInitialized = initMap();
    
    if (!mapInitialized) {
        console.error('Map initialization failed, retrying in 1 second...');
        setTimeout(initialize, 1000);
        return;
    }
    
    // Wait for map to settle
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('Map ready, requesting location...');
    getUserLocation();
    
    console.log('Loading earthquake data...');
    const data = await fetchEarthquakeData();
    if (data) {
        displayEarthquakes(data);
    } else {
        console.log('Failed to load initial data, will retry in 10 seconds');
        setTimeout(async () => {
            const retryData = await fetchEarthquakeData();
            if (retryData) displayEarthquakes(retryData);
        }, 10000);
    }
    
    console.log('=== Initialization Complete ===');
}

// Auto-refresh earthquake data every 5 minutes
setInterval(async () => {
    console.log('Auto-refreshing earthquake data...');
    const data = await fetchEarthquakeData();
    if (data) {
        displayEarthquakes(data);
    }
}, 300000);

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

console.log('✅ userMap.js initialization setup complete');