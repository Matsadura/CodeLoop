export const request = async (url, options) => {
  const token = localStorage.getItem("_token");

  if (token)
    options.headers = { Authorization: `Bearer ${token}` }
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${url}`, options);
  const data = await response.json();
  return { status: response.status, data };
};
