// ============================
// API HELPER
// ============================
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (authToken) {
        options.headers['Authorization'] = 'Bearer ' + authToken;
    }
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(API_URL + endpoint, options);
        if (!res.ok) {
            let msg = 'Request failed';
            try {
                const data = await res.json();
                msg = data.error || msg;
            } catch (err) {
                msg = 'Server error: ' + res.status + ' ' + res.statusText;
            }
            throw new Error(msg);
        }
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        if (
            err.message === 'Failed to fetch' ||
            err.message.includes('NetworkError') ||
            err.name === 'TypeError'
        ) {
            throw new Error(
                'Cannot connect to server. Please make sure the backend is running on http://127.0.0.1:5000'
            );
        }
        throw err;
    }
}
