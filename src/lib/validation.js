/**
 * Validates a username.
 * Rules: Only lowercase letters, numbers, underscore. No spaces. Length: 3-15 chars.
 * @param {string} username 
 * @returns {boolean}
 */
export const isValidUsername = (username) => {
  if (!username) return false;
  // Must be 3-15 chars, alphanumeric only, and must contain at least one letter
  const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{3,15}$/;
  return usernameRegex.test(username);
};

/**
 * Validates an email address.
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password.
 * Rules: Min 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
 * @param {string} password 
 * @returns {boolean}
 */
export const isValidPassword = (password) => {
  if (!password) return false;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+={}\[\]|\\:;"'<>,.?/])[A-Za-z\d@$!%*?&#^()_\-+={}\[\]|\\:;"'<>,.?/]{6,}$/;
  return passwordRegex.test(password);
};

/**
 * Returns error messages for a password if it fails validation.
 * @param {string} password 
 * @returns {string[]}
 */
export const getPasswordErrors = (password) => {
  const errors = [];
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters");
  else if (!/[A-Z]/.test(password)) errors.push("Must include at least one uppercase letter");
  else if (!/[a-z]/.test(password)) errors.push("Must include at least one lowercase letter");
  else if (!/\d/.test(password)) errors.push("Must include at least one number");
  else if (!/[@$!%*?&#^()_\-+={}\[\]|\\:;"'<>,.?/]/.test(password)) errors.push("Must include at least one special character");
  return errors;
};
