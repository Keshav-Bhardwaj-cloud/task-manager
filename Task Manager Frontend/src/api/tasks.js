import { apiRequest } from './client';

export async function fetchTasks(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return apiRequest(`/api/v1/tasks${queryString ? `?${queryString}` : ''}`, {
    authRequired: true,
  });
}

export async function createTask(data) {
  return apiRequest('/api/v1/tasks', {
    method: 'POST',
    body: data,
    authRequired: true,
  });
}

export async function updateTask(taskId, data) {
  return apiRequest(`/api/v1/tasks/${taskId}`, {
    method: 'PATCH',
    body: data,
    authRequired: true,
  });
}

export async function deleteTask(taskId) {
  return apiRequest(`/api/v1/tasks/${taskId}`, {
    method: 'DELETE',
    authRequired: true,
  });
}
