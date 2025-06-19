export const setTagihanNotificationCookieUntilTomorrowStart = (name, value) => {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0); // Set ke 00:00:00 hari ini
  tomorrow.setDate(tomorrow.getDate() + 1); // Tambah 1 hari

  const expires = "expires=" + tomorrow.toUTCString();
  document.cookie = `${name}=${value}; ${expires}; path=/`;
};

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};
