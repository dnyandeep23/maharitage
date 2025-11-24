const getInternalApiToken = () => {
  const token = process.env.NEXT_APP_X_ACCESS_TOKEN_INTERNAL;
  if (!token) {
    console.error(
      "NEXT_APP_X_ACCESS_TOKEN_INTERNAL is not set in environment variables."
    );
    return null;
  }
  return token;
};

export const fetchWithInternalToken = async (url, options = {}) => {
  const internalToken = getInternalApiToken();

  const headers = {
    ...options.headers,
  };

  if (internalToken) {
    headers["x-access-token-internal"] = internalToken;
  }

  const newOptions = {
    ...options,
    headers,
  };

  return fetch(url, newOptions);
};
