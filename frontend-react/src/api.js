export const API_BASE = "http://localhost:8081";

export async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw };
    }

    if (!response.ok) {
      const message =
        data.message ||
        `${response.status} ${response.statusText}` ||
        "Request failed";
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to reach server. Start backend on http://localhost:8081 and check CORS settings."
      );
    }
    throw error;
  }
}
