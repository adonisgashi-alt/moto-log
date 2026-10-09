// Keeps the top navigation in step with the Firebase sign-in state on every page:
// signed out shows Get the app / Log in, signed in shows the account and Sign out.
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase.js";

const root = document.documentElement;
const KEY = "motolog-user";

const remember = (user) => {
  try {
    if (user) localStorage.setItem(KEY, user.email || user.displayName || "Account");
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the nav still updates, it just can't pre-paint on the next page */
  }
};

const render = (label) => {
  root.classList.toggle("signed-in", Boolean(label));
  document.querySelectorAll("[data-user-email]").forEach((el) => (el.textContent = label ?? ""));
  document.querySelectorAll("[data-user-initial]").forEach((el) => (el.textContent = (label ?? "").charAt(0).toUpperCase()));
};

// Pre-paint from the last known state, then let Firebase confirm it
try {
  render(localStorage.getItem(KEY));
} catch {
  /* ignore */
}

onAuthStateChanged(auth, (user) => {
  remember(user);
  render(user ? user.email || user.displayName || "Account" : null);
});

// Avatar dropdown: closes on outside click, Escape, or after choosing an item
const setMenu = (open) => {
  document.querySelectorAll(".nav-user").forEach((box) => {
    box.querySelector(".nav-dropdown").hidden = !open;
    box.querySelector("[data-user-menu]").setAttribute("aria-expanded", String(open));
  });
};
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const wasOpen = document.querySelector(".nav-dropdown:not([hidden])");
  setMenu(false);
  if (wasOpen) document.querySelector("[data-user-menu]").focus();
});

document.addEventListener("click", async (e) => {
  const toggle = e.target.closest("[data-user-menu]");
  if (toggle) return setMenu(toggle.getAttribute("aria-expanded") !== "true");
  if (!e.target.closest(".nav-dropdown")) setMenu(false);
  if (!e.target.closest("[data-sign-out]")) return;
  await signOut(auth);
  // The garage is private, so leave it; anywhere else the page just flips back to signed out
  if (location.pathname.startsWith("/dashboard")) location.assign("/login");
});
