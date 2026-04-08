(function () {
    "use strict";

    const defaultAvatar = "/img/profile/default-user.svg";
    const msgEl = document.getElementById("rqFamilyMsg");
    const incomingEl = document.getElementById("rqFamilyIncoming");
    const outgoingEl = document.getElementById("rqFamilyOutgoing");
    const membersEl = document.getElementById("rqFamilyMembers");
    const trappedEl = document.getElementById("rqFamilyTrapped");
    const form = document.getElementById("rqFamilyAddForm");
    const emailInput = document.getElementById("rqFamilyEmail");
    const trappedNotified = new Set();

    function csrfHeaders() {
        const token = document.querySelector('meta[name="_csrf"]');
        const header = document.querySelector('meta[name="_csrf_header"]');
        if (!token || !header) {
            return {};
        }
        return { [header.getAttribute('content')]: token.getAttribute('content') };
    }

    function setMsg(text, ok) {
        if (!msgEl) {
            return;
        }
        msgEl.textContent = text || "";
        msgEl.className = "small mb-3 " + (ok ? "text-success" : "text-danger");
    }

    async function readErrorMessage(res, fallbackMessage) {
        try {
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                const j = await res.json();
                return j && j.error ? String(j.error) : fallbackMessage;
            }
            const text = await res.text();
            if (text && text.trim()) {
                return text.trim().slice(0, 300);
            }
        } catch (e) { }
        return fallbackMessage;
    }

    function row(name, email, photoPath, extra, actions) {
        return `<div class="rq-family-item">
            <div class="rq-family-item-head">
                <img class="rq-family-avatar" src="${photoPath || defaultAvatar}" alt=""
                     onerror="this.onerror=null;this.src='${defaultAvatar}'">
                <div>
                    <div class="rq-family-name">${name || "—"}</div>
                    <div class="rq-family-email">${email || "—"}</div>
                </div>
            </div>
            ${extra ? `<div class="rq-family-meta">${extra}</div>` : ""}
            <div class="rq-family-actions">${actions || ""}</div>
        </div>`;
    }

    function locateBtn(lat, lon) {
        if (lat == null || lon == null) {
            return "";
        }
        const q = encodeURIComponent(String(lat) + "," + String(lon));
        return `<a class="btn btn-sm btn-outline-info" target="_blank" rel="noopener noreferrer"
                    href="https://www.google.com/maps/dir/?api=1&destination=${q}">
                    <i class="fa-solid fa-location-dot me-1"></i>Locate
                </a>`;
    }

    function renderIncoming(items) {
        if (!items.length) {
            incomingEl.innerHTML = '<p class="rq-family-empty">No incoming requests.</p>';
            return;
        }
        incomingEl.innerHTML = items.map(function (r) {
            return row(r.requesterName, r.requesterEmail, null, "", `
                <button class="btn btn-sm btn-success js-rq-accept" data-id="${r.id}">Accept</button>
                <button class="btn btn-sm btn-outline-light js-rq-reject" data-id="${r.id}">Reject</button>
            `);
        }).join("");
    }

    function renderOutgoing(items) {
        if (!items.length) {
            outgoingEl.innerHTML = '<p class="rq-family-empty">No outgoing requests.</p>';
            return;
        }
        outgoingEl.innerHTML = items.map(function (r) {
            return row(r.targetName, r.targetEmail, null, "Pending acceptance", "");
        }).join("");
    }

    function renderMembers(items) {
        if (!items.length) {
            membersEl.innerHTML = '<p class="rq-family-empty">No family members connected yet.</p>';
            return;
        }
        membersEl.innerHTML = items.map(function (m) {
            const extra = m.trapped
                ? `Status: NOT SAFE · Location ${m.trappedLatitude}, ${m.trappedLongitude} (reported ${m.trappedReportedAt})`
                : `Status: Safe · Privacy mode active (location hidden unless trapped).`;
            return row(m.fullName, m.email, m.profilePhotoPath, extra, `
                ${m.trapped ? locateBtn(m.trappedLatitude, m.trappedLongitude) : ""}
                ${m.trapped ? `<button class="btn btn-sm btn-warning js-rq-safe" data-id="${m.id}">Mark safe / Rescued</button>` : ""}
                <button class="btn btn-sm btn-outline-danger js-rq-remove" data-id="${m.id}">Remove</button>
            `);
        }).join("");
    }

    function renderTrapped(items) {
        if (!trappedEl) {
            return;
        }
        const trapped = items.filter(function (m) { return !!m.trapped; });
        if (!trapped.length) {
            trappedEl.innerHTML = '<p class="rq-family-empty">No trapped alerts in your family right now.</p>';
            return;
        }
        trappedEl.innerHTML = trapped.map(function (m) {
            const extra = `Current location: ${m.trappedLatitude}, ${m.trappedLongitude}<br>Reported at: ${m.trappedReportedAt}`;
            return row(m.fullName, m.email, m.profilePhotoPath, extra, `
                ${locateBtn(m.trappedLatitude, m.trappedLongitude)}
                <button class="btn btn-sm btn-warning js-rq-safe" data-id="${m.id}">Mark safe / Rescued</button>
            `);
        }).join("");
    }

    function notifyForTrapped(items) {
        if (!("Notification" in window)) {
            return;
        }
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
        if (Notification.permission !== "granted") {
            return;
        }
        items.forEach(function (m) {
            const eventKey = String(m.id) + ":" + String(m.trappedReportedAt || "");
            if (!m.trapped) {
                trappedNotified.delete(eventKey);
                return;
            }
            if (trappedNotified.has(eventKey)) {
                return;
            }
            trappedNotified.add(eventKey);
            try {
                new Notification("RapidQuake family alert", {
                    body: m.fullName + " may be trapped. Open profile to review location."
                });
            } catch (e) { }
        });
    }

    function post(url, body) {
        return fetch(url, {
            method: "POST",
            headers: Object.assign({ "Content-Type": "application/json" }, csrfHeaders()),
            credentials: "same-origin",
            body: body ? JSON.stringify(body) : "{}"
        });
    }

    function del(url) {
        return fetch(url, {
            method: "DELETE",
            headers: csrfHeaders(),
            credentials: "same-origin"
        });
    }

    async function refresh() {
        try {
            const res = await fetch("/api/family/overview", { credentials: "same-origin" });
            if (!res.ok) {
                setMsg(await readErrorMessage(res, "Could not load family data."), false);
                return;
            }
            const data = await res.json();
            renderIncoming(data.incoming || []);
            renderOutgoing(data.outgoing || []);
            renderMembers(data.family || []);
            renderTrapped(data.family || []);
            notifyForTrapped(data.family || []);
        } catch (e) {
            setMsg("Network issue while loading family data.", false);
        }
    }

    if (!form || !emailInput || !incomingEl || !outgoingEl || !membersEl) {
        return;
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) {
            setMsg("Please enter a family member email.", false);
            return;
        }
        const res = await post("/api/family/request", { email: email });
        if (!res.ok) {
            setMsg(await readErrorMessage(res, "Could not send request."), false);
            return;
        }
        emailInput.value = "";
        setMsg("Family request sent.", true);
        await refresh();
    });

    document.addEventListener("click", async function (e) {
        const accept = e.target.closest(".js-rq-accept");
        if (accept) {
            await post("/api/family/request/" + accept.getAttribute("data-id") + "/accept");
            await refresh();
            return;
        }
        const reject = e.target.closest(".js-rq-reject");
        if (reject) {
            await post("/api/family/request/" + reject.getAttribute("data-id") + "/reject");
            await refresh();
            return;
        }
        const remove = e.target.closest(".js-rq-remove");
        if (remove) {
            await del("/api/family/member/" + remove.getAttribute("data-id"));
            await refresh();
            return;
        }
        const safe = e.target.closest(".js-rq-safe");
        if (safe) {
            const r = await post("/api/family/trapped/" + safe.getAttribute("data-id") + "/mark-safe");
            if (!r.ok) {
                setMsg(await readErrorMessage(r, "Could not mark member safe."), false);
            } else {
                setMsg("Family member removed from trapped list.", true);
            }
            await refresh();
        }
    });

    setInterval(refresh, 5000);
    refresh();
})();
