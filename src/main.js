// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const links = document.getElementById("nav-links");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  links.classList.toggle("open", !open);
});
links.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("open");
  }
});

// Logo: back to the top of the homepage (and close the mobile menu)
document.querySelector(".brand").addEventListener("click", (e) => {
  toggle.setAttribute("aria-expanded", "false");
  links.classList.remove("open");
  if (location.pathname === "/" || location.pathname === "/index.html") {
    e.preventDefault();
    history.replaceState(null, "", location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// Solid nav background once the page scrolls
const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Fade sections in as they enter the viewport
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 },
  );
  reveals.forEach((el) => {
    el.classList.add("pending");
    io.observe(el);
  });
}

document.getElementById("year").textContent = String(new Date().getFullYear());

// If a photo can't load, keep the dark placeholder instead of a broken-image icon
document.querySelectorAll("main img").forEach((img) => {
  const hide = () => img.classList.add("failed");
  if (img.complete && img.naturalWidth === 0) hide();
  img.addEventListener("error", hide);
});

// Sign-in state for the nav. Loaded after the page is interactive so the Firebase SDK never delays first paint.
const loadAuthNav = () => import("./auth-nav.js");
if ("requestIdleCallback" in window) requestIdleCallback(loadAuthNav, { timeout: 2000 });
else setTimeout(loadAuthNav, 300);
