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

    const MAP_PREFIX = 'rq-map-alert-';
    const COUNTDOWN_SECONDS = 20;
    const userScope = (function () {
        const el = document.getElementById('rqEmergencyUserKey');
        if (!el || !el.textContent) {
            return 'user';
        }
        return el.textContent.trim().toLowerCase();
    })();
    let currentEmergencySince = '';
    let responseKey = '';
    let handling = false;
    let countdownTimer = null;
    let modalInstance = null;
    let trappedBannerBound = false;
    let pendingTrappedReportPromise = null;
    let emergencySafeBound = false;
    let emergencyDismissBound = false;
    const respondedKeys = new Set();

    function getModal() {
        const el = document.getElementById('emergencySafetyModal');
        if (!el) {
            return null;
        }
        if (!modalInstance && typeof bootstrap !== 'undefined') {
            modalInstance = new bootstrap.Modal(el);
        }
        return modalInstance;
    }

    function requestNotify() {
        if (!('Notification' in window) || Notification.permission === 'granted') {
            return;
        }
        if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    function showNotify(body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification('RapidQuake — Emergency', {
                    body: body || 'Please confirm you are safe in the app.'
                });
            } catch (e) { /* ignore */ }
        }
    }

    function postJson(url, body) {
        return fetch(url, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, csrfHeaders()),
            body: body ? JSON.stringify(body) : '{}',
            credentials: 'same-origin'
        });
    }

    function getServerLocationHint() {
        return fetch('/api/user/location-hint', { credentials: 'same-origin' })
            .then(function (r) {
                if (!r.ok) {
                    return null;
                }
                return r.json();
            })
            .then(function (j) {
                if (!j || j.latitude == null || j.longitude == null) {
                    return null;
                }
                return {
                    latitude: Number(j.latitude),
                    longitude: Number(j.longitude),
                    accuracyMeters: j.accuracyMeters != null ? Number(j.accuracyMeters) : null
                };
            })
            .catch(function () {
                return null;
            });
    }

    function getBestPosition() {
        return new Promise(function (resolve) {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracyMeters: pos.coords.accuracy
                    });
                },
                function () {
                    resolve(null);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
            );
        });
    }

    function clearCountdown() {
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
    }

    function markResponded() {
        if (!responseKey) {
            return;
        }
        respondedKeys.add(responseKey);
    }

    function hasResponded() {
        if (!responseKey) {
            return false;
        }
        return respondedKeys.has(responseKey);
    }

    function setModalMode(alertMode) {
        const countdown = document.getElementById('emergencyCountdown');
        const followup = document.getElementById('emergencyFollowupMessage');
        const msg = document.getElementById('emergencyMessage');
        if (alertMode === 'followup') {
            if (countdown) {
                countdown.classList.add('d-none');
            }
            if (followup) {
                followup.classList.remove('d-none');
                followup.textContent = 'Your location is shared with the rescue team. Help is on the way. You can still click "I am safe" anytime.';
            }
            if (msg) {
                msg.textContent = 'Emergency response started for your location.';
            }
            return;
        }
        if (countdown) {
            countdown.classList.remove('d-none');
        }
        if (followup) {
            followup.classList.add('d-none');
            followup.textContent = '';
        }
        if (msg) {
            msg.textContent = alertMode === 'map'
                ? 'You are inside a current earthquake impact zone. Please confirm you are safe.'
                : 'Possible earthquake activity reported. Please confirm you are safe.';
        }
    }

    function reportTrapped() {
        return getBestPosition().then(function (pos) {
            if (pos) {
                return postJson('/api/safety/trapped', pos);
            }
            return getServerLocationHint().then(function (hintPos) {
                if (hintPos) {
                    return postJson('/api/safety/trapped', hintPos);
                }
                return postJson('/api/safety/trapped', { fallbackToStored: true });
            });
        });
    }

    function bindTrappedBanner() {
        if (trappedBannerBound) {
            return;
        }
        const safeBtn = document.getElementById('rqTrappedSafeBtn');
        if (!safeBtn) {
            return;
        }
        safeBtn.addEventListener('click', function () {
            safeBtn.disabled = true;
            markSafeNow().finally(function () {
                safeBtn.disabled = false;
            });
        });
        trappedBannerBound = true;
    }

    function showTrappedBanner(data) {
        const banner = document.getElementById('rqTrappedSticky');
        const text = document.getElementById('rqTrappedStickyText');
        if (!banner) {
            return;
        }
        if (text && data && data.reportedAt) {
            text.textContent = 'You are marked as trapped (reported ' + data.reportedAt + '). Tap "I am safe" after you are safe.';
        }
        banner.classList.remove('d-none');
    }

    function hideTrappedBanner() {
        const banner = document.getElementById('rqTrappedSticky');
        if (!banner) {
            return;
        }
        banner.classList.add('d-none');
    }

    function postSafeNow() {
        return postJson('/api/safety/im-safe', {})
            .then(function () {
                hideTrappedBanner();
                pollPersistentTrappedStatus();
            })
            .catch(function () {
                hideTrappedBanner();
            });
    }

    function markSafeNow() {
        // If timeout-report is still posting trapped status, run a second safe clear after it completes.
        return postSafeNow().then(function () {
            if (!pendingTrappedReportPromise) {
                return null;
            }
            return pendingTrappedReportPromise.finally(function () {
                return postSafeNow();
            });
        });
    }

    function bindEmergencySafeButton() {
        if (emergencySafeBound) {
            return;
        }
        const safeBtn = document.getElementById('emergencySafeBtn');
        if (!safeBtn) {
            return;
        }
        safeBtn.onclick = function () {
            safeBtn.disabled = true;
            clearCountdown();
            markResponded();
            markSafeNow().finally(function () {
                const m = getModal();
                if (m) {
                    m.hide();
                }
                handling = false;
                safeBtn.disabled = false;
            });
        };
        emergencySafeBound = true;
    }

    function bindEmergencyDismissButton() {
        if (emergencyDismissBound) {
            return;
        }
        const dismissBtn = document.getElementById('emergencyDismissBtn');
        if (!dismissBtn) {
            return;
        }
        dismissBtn.addEventListener('click', function () {
            clearCountdown();
            handling = false;
            markResponded();
            const m = getModal();
            if (m) {
                m.hide();
            }
        });
        emergencyDismissBound = true;
    }

    function startSafetyFlow(mode, initialSeconds) {
        if (handling) {
            return;
        }
        handling = true;
        requestNotify();
        showNotify(mode === 'map'
            ? 'You are in a disaster impact zone. Confirm safety in RapidQuake.'
            : 'Please confirm you are safe in the app.');
        setModalMode(mode === 'map' ? 'map' : 'emergency');

        const modal = getModal();
        if (modal) {
            modal.show();
        }
        bindEmergencySafeButton();
        bindEmergencyDismissButton();

        let left = Math.max(1, Number(initialSeconds || COUNTDOWN_SECONDS));
        const span = document.getElementById('emergencySeconds');
        if (span) {
            span.textContent = String(left);
        }

        clearCountdown();
        countdownTimer = setInterval(function () {
            left -= 1;
            if (span) {
                span.textContent = String(Math.max(0, left));
            }
            if (left <= 0) {
                clearCountdown();
                onTimeout();
            }
        }, 1000);

    }

    function onTimeout() {
        markResponded();
        pendingTrappedReportPromise = reportTrapped();
        pendingTrappedReportPromise.finally(function () {
            pendingTrappedReportPromise = null;
            setModalMode('followup');
            handling = false;
        });
    }

    function globalRemainingSeconds(sinceIso) {
        if (!sinceIso) {
            return COUNTDOWN_SECONDS;
        }
        const sinceMs = Date.parse(sinceIso);
        if (Number.isNaN(sinceMs)) {
            return COUNTDOWN_SECONDS;
        }
        const elapsedMs = Date.now() - sinceMs;
        const remaining = Math.ceil((COUNTDOWN_SECONDS * 1000 - elapsedMs) / 1000);
        return Math.max(0, remaining);
    }

    function stableEmergencyKey(since) {
        return 'rq-emergency:' + userScope + '::' + since;
    }

    function stableMapKey(tag) {
        return MAP_PREFIX + userScope + '::' + tag;
    }

    window.RapidQuakeEmergency = window.RapidQuakeEmergency || {};
    window.RapidQuakeEmergency.triggerFromMap = function (eventTag) {
        if (!eventTag) {
            return;
        }
        responseKey = stableMapKey(String(eventTag));
        if (hasResponded() || handling) {
            return;
        }
        startSafetyFlow('map');
    };

    function poll() {
        fetch('/api/emergency/status', { credentials: 'same-origin' })
            .then(function (r) {
                return r.json();
            })
            .then(function (data) {
                const active = !!data.active;
                const since = data.since ? String(data.since) : '';

                if (!active) {
                    currentEmergencySince = '';
                    responseKey = '';
                    handling = false;
                    clearCountdown();
                    const m = getModal();
                    if (m) {
                        m.hide();
                    }
                    return;
                }

                if (since !== currentEmergencySince) {
                    currentEmergencySince = since;
                    responseKey = stableEmergencyKey(currentEmergencySince);
                }

                if (!hasResponded() && !handling) {
                    const remaining = globalRemainingSeconds(currentEmergencySince);
                    if (remaining <= 0) {
                        handling = true;
                        markResponded();
                        pendingTrappedReportPromise = reportTrapped();
                        pendingTrappedReportPromise.finally(function () {
                            pendingTrappedReportPromise = null;
                            setModalMode('followup');
                            const m = getModal();
                            if (m) {
                                bindEmergencySafeButton();
                                bindEmergencyDismissButton();
                                m.show();
                            }
                            handling = false;
                        });
                        return;
                    }
                    startSafetyFlow('emergency', remaining);
                }
            })
            .catch(function () { /* ignore */ });
    }

    function pollPersistentTrappedStatus() {
        if (handling) {
            return;
        }
        bindTrappedBanner();
        fetch('/api/safety/me/trapped', { credentials: 'same-origin' })
            .then(function (r) {
                if (!r.ok) {
                    return null;
                }
                return r.json();
            })
            .then(function (data) {
                if (!data || !data.trapped) {
                    hideTrappedBanner();
                    return;
                }
                showTrappedBanner(data);
            })
            .catch(function () { /* ignore */ });
    }

    setInterval(poll, 2000);
    setInterval(pollPersistentTrappedStatus, 5000);
    bindEmergencySafeButton();
    bindEmergencyDismissButton();
    poll();
    pollPersistentTrappedStatus();
})();
