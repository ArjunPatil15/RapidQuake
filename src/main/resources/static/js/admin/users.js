(function () {
    "use strict";

    const defaultPhoto = "/img/profile/default-user.svg";
    const grid = document.getElementById("adminUsersGrid");
    const emptyState = document.getElementById("adminUsersEmptyState");
    const searchInput = document.getElementById("adminUserSearch");
    const countEl = document.getElementById("adminUserResultCount");
    const msgEl = document.getElementById("adminUserActionMsg");

    const detailModalEl = document.getElementById("adminUserDetailModal");
    let detailModal = null;

    let selectedUserId = null;
    let selectedUserActive = true;
    let detailHistory = [];
    let users = [];
    let searchDebounce = null;

    function getDetailModal() {
        if (!detailModalEl || typeof bootstrap === "undefined") {
            return null;
        }
        if (!detailModal) {
            detailModal = new bootstrap.Modal(detailModalEl);
        }
        return detailModal;
    }

    function fmt(v) {
        return v == null || v === "" ? "—" : v;
    }

    function renderCount() {
        countEl.textContent = users.length + (users.length === 1 ? " user" : " users");
    }

    function cardHtml(u) {
        const activeBadge = u.active
            ? '<span class="badge text-bg-success">Active</span>'
            : '<span class="badge text-bg-secondary">Deactivated</span>';
        return `
            <article class="admin-user-card admin-card">
                <div class="admin-user-top">
                    <img src="${u.profilePhotoPath || defaultPhoto}" alt="User photo" class="admin-user-photo"
                         onerror="this.onerror=null;this.src='${defaultPhoto}'">
                    <div>
                        <h3>${fmt(u.fullName)}</h3>
                        <p>${fmt(u.email)}</p>
                        ${activeBadge}
                    </div>
                </div>
                <div class="admin-user-actions">
                    <button class="btn btn-sm btn-outline-warning js-view-user" data-id="${u.id}">View details</button>
                </div>
            </article>
        `;
    }

    function renderGrid() {
        grid.innerHTML = users.map(cardHtml).join("");
        emptyState.style.display = users.length ? "none" : "block";
        renderCount();
    }

    function setMessage(text, ok) {
        msgEl.textContent = text || "";
        msgEl.className = "small mt-3 mb-0 " + (ok ? "text-success" : "text-danger");
    }

    async function loadUsers(name) {
        const query = name ? "?name=" + encodeURIComponent(name) : "";
        const res = await fetch("/api/admin/users" + query, { credentials: "same-origin" });
        if (!res.ok) {
            throw new Error("Could not load users");
        }
        users = await res.json();
        renderGrid();
    }

    function toExtraLines(u) {
        const privacyMsg = fmt(u.locationPrivacyMessage);
        const locationVisible = !!u.locationVisibleToAdmin;
        const coords = u.lastLatitude != null && u.lastLongitude != null
            ? `${u.lastLatitude}, ${u.lastLongitude}`
            : "Hidden";
        const locAt = u.lastLocationAt || "—";
        const createdAt = u.createdAt || "—";
        const note = fmt(u.locationSourceNote);
        const family = Array.isArray(u.familyMembers) ? u.familyMembers : [];
        const familyHtml = family.length
            ? family.map(function (f) {
                return `<li class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <span>${fmt(f.fullName)} (${fmt(f.email)})</span>
                    <button type="button" class="btn btn-outline-warning btn-sm js-view-family-member" data-id="${f.id}">
                        View details
                    </button>
                </li>`;
            }).join("")
            : "<li>No connected family members</li>";
        return `
            <div><strong>City:</strong> ${fmt(u.city)}</div>
            <div><strong>Phone:</strong> ${fmt(u.phone)}</div>
            <div><strong>Privacy:</strong> ${privacyMsg}</div>
            <div><strong>Last location:</strong> ${coords}</div>
            <div><strong>Location updated:</strong> ${locationVisible ? locAt : "Hidden"}</div>
            <div><strong>Location source:</strong> ${locationVisible ? note : "Hidden"}</div>
            <div><strong>Created at:</strong> ${createdAt}</div>
            <div class="mt-2"><strong>Connected family:</strong><ul class="mb-0 mt-1">${familyHtml}</ul></div>
        `;
    }

    function renderBackButton() {
        const backBtn = document.getElementById("adminDetailBackBtn");
        if (!backBtn) {
            return;
        }
        backBtn.classList.toggle("d-none", detailHistory.length <= 1);
    }

    async function openDetails(userId, pushHistory = true) {
        const res = await fetch("/api/admin/users/" + userId, { credentials: "same-origin" });
        if (!res.ok) {
            setMessage("Could not load user details.", false);
            return;
        }
        const u = await res.json();
        if (pushHistory) {
            const last = detailHistory.length ? detailHistory[detailHistory.length - 1] : null;
            if (String(last) !== String(u.id)) {
                detailHistory.push(u.id);
            }
        }
        selectedUserId = u.id;
        selectedUserActive = !!u.active;

        document.getElementById("adminDetailPhoto").src = u.profilePhotoPath || defaultPhoto;
        document.getElementById("adminDetailName").textContent = fmt(u.fullName);
        document.getElementById("adminDetailEmail").textContent = fmt(u.email);
        document.getElementById("adminEditFullName").value = u.fullName || "";
        document.getElementById("adminEditEmail").value = u.email || "";
        document.getElementById("adminEditCity").value = u.city || "";
        document.getElementById("adminEditPhone").value = u.phone || "";
        document.getElementById("adminDetailExtra").innerHTML = toExtraLines(u);
        document.getElementById("adminDetailTitleText").textContent = "User details";

        const status = document.getElementById("adminDetailStatus");
        status.className = "badge mt-2 " + (u.active ? "text-bg-success" : "text-bg-secondary");
        status.textContent = u.active ? "Active" : "Deactivated";

        const toggleBtn = document.getElementById("adminToggleActiveBtn");
        toggleBtn.textContent = u.active ? "Deactivate" : "Activate";
        toggleBtn.className = u.active ? "btn btn-outline-light" : "btn btn-success";

        renderBackButton();
        setMessage("", true);
        const modal = getDetailModal();
        if (modal) {
            modal.show();
        }
    }

    async function saveUser() {
        if (!selectedUserId) {
            return;
        }
        const body = {
            fullName: document.getElementById("adminEditFullName").value.trim(),
            city: document.getElementById("adminEditCity").value.trim(),
            phone: document.getElementById("adminEditPhone").value.trim()
        };
        const res = await fetch("/api/admin/users/" + selectedUserId, {
            method: "PUT",
            headers: Object.assign({ "Content-Type": "application/json" }, window.RapidQuakeAdmin.csrfHeaders()),
            credentials: "same-origin",
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            setMessage(error.error || "Failed to save user.", false);
            return;
        }
        setMessage("User updated successfully.", true);
        await loadUsers(searchInput.value.trim());
    }

    async function toggleActive() {
        if (!selectedUserId) {
            return;
        }
        const endpoint = selectedUserActive ? "deactivate" : "activate";
        const res = await fetch("/api/admin/users/" + selectedUserId + "/" + endpoint, {
            method: "POST",
            headers: window.RapidQuakeAdmin.csrfHeaders(),
            credentials: "same-origin"
        });
        if (!res.ok) {
            setMessage("Could not update user status.", false);
            return;
        }
        const data = await res.json();
        selectedUserActive = !!data.active;
        setMessage(selectedUserActive ? "User activated." : "User deactivated.", true);
        await openDetails(selectedUserId);
        await loadUsers(searchInput.value.trim());
    }

    async function deleteUser() {
        if (!selectedUserId) {
            return;
        }
        const ok = window.confirm("Delete this user permanently?");
        if (!ok) {
            return;
        }
        const res = await fetch("/api/admin/users/" + selectedUserId, {
            method: "DELETE",
            headers: window.RapidQuakeAdmin.csrfHeaders(),
            credentials: "same-origin"
        });
        if (!res.ok) {
            setMessage("Could not delete user.", false);
            return;
        }
        const modal = getDetailModal();
        if (modal) {
            modal.hide();
        }
        await loadUsers(searchInput.value.trim());
    }

    grid.addEventListener("click", function (e) {
        const btn = e.target.closest(".js-view-user");
        if (!btn) {
            return;
        }
        detailHistory = [];
        openDetails(btn.getAttribute("data-id"));
    });

    document.getElementById("adminDetailExtra").addEventListener("click", function (e) {
        const btn = e.target.closest(".js-view-family-member");
        if (!btn) {
            return;
        }
        openDetails(btn.getAttribute("data-id"), true).catch(function () {
            setMessage("Could not open family member details.", false);
        });
    });

    document.getElementById("adminDetailBackBtn").addEventListener("click", function () {
        if (detailHistory.length <= 1) {
            return;
        }
        detailHistory.pop();
        const previousId = detailHistory[detailHistory.length - 1];
        openDetails(previousId, false).catch(function () {
            setMessage("Could not go back to previous user.", false);
        });
    });

    detailModalEl.addEventListener("hidden.bs.modal", function () {
        detailHistory = [];
        renderBackButton();
    });

    searchInput.addEventListener("input", function () {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(function () {
            loadUsers(searchInput.value.trim()).catch(function () {
                setMessage("Search failed.", false);
            });
        }, 250);
    });

    document.getElementById("adminSaveUserBtn").addEventListener("click", function () {
        saveUser().catch(function () {
            setMessage("Failed to save.", false);
        });
    });

    document.getElementById("adminToggleActiveBtn").addEventListener("click", function () {
        toggleActive().catch(function () {
            setMessage("Failed to update status.", false);
        });
    });

    document.getElementById("adminDeleteUserBtn").addEventListener("click", function () {
        deleteUser().catch(function () {
            setMessage("Failed to delete.", false);
        });
    });

    loadUsers("").catch(function () {
        setMessage("Could not load users.", false);
    });

    const params = new URLSearchParams(window.location.search);
    const openUserId = params.get("openUserId");
    if (openUserId) {
        detailHistory = [];
        openDetails(openUserId).catch(function () {
            setMessage("Could not open requested user.", false);
        });
    }
})();
