import { apiRequest, clearAccessToken, setAccessToken } from './client';

export async function registerUser(data) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: data,
  });
}

export async function loginUser(data) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: data,
  });

  if (response.token) {
    setAccessToken(response.token);
  }

  return response;
}

export async function logoutUser() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      authRequired: true,
    });
  } finally {
    clearAccessToken();
  }
}
