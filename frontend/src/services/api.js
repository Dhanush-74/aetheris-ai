const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('aetheris_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(data) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async demoLogin() {
    const res = await fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updatePreferences(preferences) {
    const res = await fetch(`${API_BASE}/auth/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences)
    });
    return res.json();
  },

  // Conversations
  async getConversations(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/chat/conversations${query}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getConversation(id) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateConversationTitle(id, title) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title })
    });
    return res.json();
  },

  async deleteConversation(id) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async clearAllConversations() {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateFeedback(messageId, feedback) {
    const res = await fetch(`${API_BASE}/chat/message/${messageId}/feedback`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ feedback })
    });
    return res.json();
  },

  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  /**
   * Stream message with Server-Sent Events (SSE)
   * @param {Object} payload
   * @param {Function} onChunk
   * @param {Function} onDone
   * @param {Function} onError
   * @param {AbortSignal} signal
   */
  async streamMessage(payload, { onMeta, onChunk, onDone, onError, signal }) {
    try {
      const response = await fetch(`${API_BASE}/chat/message/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
        signal
      });

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch (_) {}
        throw new Error(errData.message || `Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.substring(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'meta' && onMeta) {
                onMeta(data);
              } else if (data.type === 'chunk' && onChunk) {
                onChunk(data.text);
              } else if (data.type === 'done' && onDone) {
                onDone(data);
              } else if (data.type === 'error' && onError) {
                onError(new Error(data.error));
              }
            } catch (err) {
              console.warn('Failed to parse SSE JSON chunk:', jsonStr, err);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream stopped by user');
      } else if (onError) {
        onError(err);
      }
    }
  }
};
