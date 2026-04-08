(function () {
    'use strict';
    document.addEventListener('DOMContentLoaded', function () {
        var rotatingText = document.getElementById('rotating-text');
        if (!rotatingText) {
            return;
        }
        var phrases = ['Stay Alert', 'Stay Prepared', 'Stay Safe', 'Stay Informed'];
        var currentIndex = 0;
        function rotateText() {
            rotatingText.classList.add('fade-out');
            setTimeout(function () {
                currentIndex = (currentIndex + 1) % phrases.length;
                rotatingText.textContent = phrases[currentIndex];
                rotatingText.classList.remove('fade-out');
            }, 250);
        }
        setTimeout(function () {
            setInterval(rotateText, 2500);
        }, 2000);

        loadLiveSummary();
    });

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    }

    function setAlertLevel(maxMag) {
        var badge = document.getElementById('rqAlertLevelBadge');
        var text = document.getElementById('rqAlertLevelText');
        if (!badge || !text) {
            return;
        }
        badge.className = 'status badge fs-4 mb-2';
        if (maxMag >= 7) {
            badge.classList.add('bg-danger');
            badge.textContent = 'High';
            text.textContent = 'Major seismic activity detected. Stay alert and follow safety guidance.';
        } else if (maxMag >= 5) {
            badge.classList.add('bg-warning', 'text-dark');
            badge.textContent = 'Elevated';
            text.textContent = 'Moderate activity detected globally. Keep emergency contacts ready.';
        } else {
            badge.classList.add('bg-success');
            badge.textContent = 'Normal';
            text.textContent = 'No major immediate global threats detected.';
        }
    }

    function sinceText(epochMs) {
        var diffMs = Date.now() - epochMs;
        var mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + ' min ago';
        var hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + ' hr ago';
        var days = Math.floor(hrs / 24);
        return days + ' day ago';
    }

    function loadLiveSummary() {
        var feedUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
        fetch(feedUrl)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var features = Array.isArray(data.features) ? data.features : [];
                if (!features.length) {
                    setText('rqLiveUpdatedAt', 'Live feed unavailable right now.');
                    return;
                }
                var latest = features[0];
                var mag = latest.properties && latest.properties.mag != null ? Number(latest.properties.mag) : 0;
                var place = latest.properties && latest.properties.place ? latest.properties.place : 'Unknown location';
                var t = latest.properties && latest.properties.time ? Number(latest.properties.time) : Date.now();
                var maxMag = features.reduce(function (max, f) {
                    var m = f.properties && f.properties.mag != null ? Number(f.properties.mag) : 0;
                    return m > max ? m : max;
                }, 0);

                setText('rqLatestMagnitude', 'M ' + mag.toFixed(1));
                setText('rqLatestPlace', place);
                setText('rqLatestTime', sinceText(t));
                setText('rqTodayCount', String(features.length));
                setText('rqLiveUpdatedAt', 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                setAlertLevel(maxMag);
            })
            .catch(function () {
                setText('rqLiveUpdatedAt', 'Could not load live seismic feed.');
            });
    }
})();
