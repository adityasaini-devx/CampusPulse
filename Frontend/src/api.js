
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://campuspulse-aerb.onrender.com/api/v1"
).replace(/\/+$/, "");

// Send requests to the CampusPulse backend
export async function apiRequest(
  path,
  options = {},
  token = localStorage.getItem("campusToken") || ""
) {
  if (!path) {
    throw new Error("API endpoint is missing.");
  }

  // Ensure the endpoint starts with only one slash
  const endpoint = `/${String(path).replace(/^\/+/, "")}`;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    ...options.headers,
  };

  // JSON requests need this header; FormData requests do not
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  // Attach JWT for protected endpoints
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("CampusPulse connection error:", error);

    throw new Error(
      "Cannot connect to the backend. Check Render status and CORS settings."
    );
  }

  // Read the response safely
  const responseText = await response.text();
  let data = null;

  if (responseText.trim()) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        throw new Error(
          `Request failed with HTTP ${response.status}: ${responseText.slice(0, 150)}`
        );
      }

      throw new Error("The backend returned an invalid JSON response.");
    }
  }

  // Display errors returned by the backend
  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem("campusToken");
      localStorage.removeItem("campusRole");
      localStorage.removeItem("campusUser");
    }

    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed with HTTP ${response.status}.`
    );
  }

  return data;
}

export default apiRequest;
