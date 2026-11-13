const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let accessToken = localStorage.getItem('task_manager_access_token') || '';
let refreshPromise = null;

export function getAccessToken() {
  if (!accessToken) {
    accessToken = localStorage.getItem('task_manager_access_token') || '';
  }
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || '';

  if (accessToken) {
    localStorage.setItem('task_manager_access_token', accessToken);
  } else {
    localStorage.removeItem('task_manager_access_token');
  }
}

export function clearAccessToken() {
  accessToken = '';
  localStorage.removeItem('task_manager_access_token');
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetch(`${API_URL}/auth/refreshAccessToken`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error?.message || payload?.message || 'Your session has expired. Please sign in again.');
    }

    if (!payload.newAccessToken) {
      throw new Error('The server did not return a new access token.');
    }

    setAccessToken(payload.newAccessToken);
    return payload.newAccessToken;
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    authRequired = false,
    skipRefresh = false,
  } = options;

  const requestHeaders = { ...headers };
  const token = getAccessToken();

  if (authRequired && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && !(body instanceof FormData) && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const requestConfig = {
    method,
    credentials: 'include',
    headers: requestHeaders,
  };

  if (body !== undefined) {
    requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response = await fetch(`${API_URL}${path}`, requestConfig);

  if (response.status === 401 && authRequired && !skipRefresh) {
    try {
      await refreshAccessToken();
      const retryHeaders = {
        ...requestHeaders,
        Authorization: `Bearer ${getAccessToken()}`,
      };

      const retryConfig = {
        ...requestConfig,
        headers: retryHeaders,
      };

      response = await fetch(`${API_URL}${path}`, retryConfig);
    } catch (error) {
      clearAccessToken();
      throw error;
    }
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || 'The server could not complete the request.');
  }

  return payload;
}
