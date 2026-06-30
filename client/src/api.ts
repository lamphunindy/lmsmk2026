const API_BASE_URL = '/api';

export const getAuthToken = () => localStorage.getItem('lms_token');
export const setAuthToken = (token: string) => localStorage.setItem('lms_token', token);
export const removeAuthToken = () => localStorage.removeItem('lms_token');

export const callAI = async (message: string, systemPrompt?: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Unauthorized: No token found');
  }

  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, systemPrompt })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};
