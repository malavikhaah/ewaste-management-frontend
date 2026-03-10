export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8082";

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
      if (response.status === 401) {
        const message = data.message || "Session expired. Please log in again.";
        localStorage.removeItem("token");
        throw new Error(message);
      }

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
        `Unable to reach server. Start backend on ${API_BASE} and check CORS settings.`
      );
    }
    throw error;
  }
}
