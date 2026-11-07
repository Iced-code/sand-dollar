import { use } from "react";

const API_URL = "http://127.0.0.1:8000";

const USER_ID_KEY = "sand_dollar_user_id";

export function getUserId() {
    let userId = localStorage.getItem(USER_ID_KEY);

    if(!userId){
        userId = crypto.randomUUID();
        localStorage.setItem(USER_ID_KEY, userId)
    }

    return userId;
}

// Access FastAPI endpoints
export async function apiFetch(endpoint, options={}) {
    const headers = new Headers(options.headers);
    
    headers.set("X-User-ID", getUserId());

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if(!response.ok){
        const error = await response.json().catch(() => ({}));

        throw new Error(
            error.detail || `API request failed: ${response.status}`
        );
    }

    return response.json();
}

export async function getCurrentUser() {
    return apiFetch("/users/me")
}