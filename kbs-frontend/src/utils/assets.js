const PRODUCTION_BACKEND_URL = "https://backend-dx5f.onrender.com";

export const getApiBaseUrl = () => {
  const fallback = import.meta.env.PROD
    ? `${PRODUCTION_BACKEND_URL}/api/v1`
    : "http://localhost:5000/api/v1";

  return import.meta.env.VITE_API_URL || fallback;
};

export const getAssetBaseUrl = () => {
  const configured = import.meta.env.VITE_ASSET_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  const apiRoot = configured || getApiBaseUrl();
  return apiRoot.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
};

export const resolveAssetUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      const isUpload = parsed.pathname.startsWith("/uploads/");
      const isFrontendHost =
        parsed.hostname === "exercice-expressjs.onrender.com" ||
        parsed.hostname === window.location.hostname ||
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1";

      if (isUpload && isFrontendHost) {
        return `${getAssetBaseUrl()}${parsed.pathname}`;
      }
    } catch (error) {
      return url;
    }

    return url;
  }

  const imagePath = url.startsWith("/") ? url : `/${url}`;
  return `${getAssetBaseUrl()}${imagePath}`;
};
