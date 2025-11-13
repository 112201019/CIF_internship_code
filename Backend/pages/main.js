function setCookie(name, value, days = 1) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// FIXED: Returns the VALUE of the first cookie found
function getCookie() {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    if (cookie) {
      // split("=")[1] gets the VALUE (the token)
      // split("=")[0] gets the NAME (which was your bug)
      const parts = cookie.split("=");
      if (parts.length >= 2) {
          return parts[1]; // Return the token value
      }
    }
  }
  return null;
}
function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
