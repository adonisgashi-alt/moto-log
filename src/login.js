import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  deleteUser,
  getAdditionalUserInfo,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "./firebase.js";

const form = document.getElementById("login-form");
const note = document.getElementById("login-note");
const submit = document.getElementById("login-submit");
const google = document.getElementById("google-btn");
const original = note.textContent;

const MESSAGES = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/missing-password": "Enter your password.",
  "auth/invalid-credential": "Wrong email or password. Accounts are created in the MotoLog app.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "No account with that email. Create your account in the MotoLog app first.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
  "app/no-account": "No MotoLog account for that Google email. Create your account in the MotoLog app first.",
  "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again.",
  "auth/unauthorized-domain": "Google sign-in isn't enabled for this web address yet.",
};
const IGNORED = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

const busy = (on) => {
  submit.disabled = on;
  google.disabled = on;
};
const fail = (err) => {
  busy(false);
  if (IGNORED.has(err.code)) return;
  note.textContent = MESSAGES[err.code] ?? "Something went wrong. Please try again.";
  note.classList.add("is-error");
};
const reset = () => {
  note.textContent = original;
  note.classList.remove("is-error");
};
const done = () => window.location.assign("/dashboard");

// Already signed in? Skip the form. Ignored while a Google sign-in is being checked below.
let checkingGoogle = false;
onAuthStateChanged(auth, (user) => {
  if (user && !checkingGoogle) done();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  reset();
  const email = form.email.value.trim();
  const password = form.password.value;
  if (!email || !password) {
    note.textContent = "Enter your email and password.";
    note.classList.add("is-error");
    return;
  }
  busy(true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    done();
  } catch (err) {
    fail(err);
  }
});

google.addEventListener("click", async () => {
  reset();
  busy(true);
  checkingGoogle = true;
  try {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    // Accounts are created in the iOS app. Google sign-in would otherwise create a brand-new
    // empty account for anyone who hasn't used MotoLog, so remove it and say so.
    if (getAdditionalUserInfo(result)?.isNewUser) {
      await deleteUser(result.user).catch(() => signOut(auth));
      const err = new Error("no account");
      err.code = "app/no-account";
      throw err;
    }
    done();
  } catch (err) {
    fail(err);
  } finally {
    checkingGoogle = false;
  }
});
