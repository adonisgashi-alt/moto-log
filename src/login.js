// Placeholder: no accounts yet. Wire this form to the real login endpoint later.
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("login-note").textContent =
    "Online accounts aren't available yet. We'll let you know when you can log in here.";
});
