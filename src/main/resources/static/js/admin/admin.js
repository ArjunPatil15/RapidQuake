(function () {
    'use strict';

    window.RapidQuakeAdmin = window.RapidQuakeAdmin || {};

    window.RapidQuakeAdmin.csrfHeaders = function () {
        const token = document.querySelector('meta[name="_csrf"]');
        const header = document.querySelector('meta[name="_csrf_header"]');
        if (!token || !header) {
            return {};
        }
        return { [header.getAttribute('content')]: token.getAttribute('content') };
    };

    window.RapidQuakeAdmin.postJson = function (url, body) {
        return fetch(url, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, window.RapidQuakeAdmin.csrfHeaders()),
            body: body != null ? JSON.stringify(body) : '{}',
            credentials: 'same-origin'
        });
    };
})();
