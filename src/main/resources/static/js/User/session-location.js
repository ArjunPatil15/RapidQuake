(function () {
    'use strict';

    function csrfHeaders() {
        const token = document.querySelector('meta[name="_csrf"]');
        const header = document.querySelector('meta[name="_csrf_header"]');
        if (!token || !header) {
            return {};
        }
        return { [header.getAttribute('content')]: token.getAttribute('content') };
    }

    function postLocation(lat, lon, accuracy) {
        fetch('/api/user/location', {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, csrfHeaders()),
            body: JSON.stringify({
                latitude: lat,
                longitude: lon,
                accuracyMeters: accuracy != null ? accuracy : null
            }),
            credentials: 'same-origin'
        }).catch(function () { /* ignore */ });
    }

    if (!navigator.geolocation) {
        return;
    }

    let lastSent = 0;
    const minIntervalMs = 25000;

    function maybePostPosition(pos) {
        if (!pos || !pos.coords) {
            return;
        }
        const now = Date.now();
        if (now - lastSent < minIntervalMs) {
            return;
        }
        lastSent = now;
        const c = pos.coords;
        postLocation(c.latitude, c.longitude, c.accuracy);
    }

    function startWatch() {
        navigator.geolocation.watchPosition(
            function (pos) {
                maybePostPosition(pos);
            },
            function () { /* denied or unavailable */ },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
        );
    }

    navigator.geolocation.getCurrentPosition(
        maybePostPosition,
        function () { /* denied on first prompt */ },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
            if (result.state === 'granted' || result.state === 'prompt') {
                startWatch();
            }
            result.onchange = function () {
                if (result.state === 'granted') {
                    startWatch();
                }
            };
        }).catch(function () {
            startWatch();
        });
        return;
    }

    startWatch();
})();
