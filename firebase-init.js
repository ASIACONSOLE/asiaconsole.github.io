import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAY2-JMHxNgBvM8jHmadiCRHi--eDTSW_Q",
  authDomain: "asia-console.firebaseapp.com",
  projectId: "asia-console",
  storageBucket: "asia-console.firebasestorage.app",
  messagingSenderId: "1063457883595",
  appId: "1:1063457883595:web:c8b5946208098f19a9e24e",
  measurementId: "G-50B31ZJV6C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function qs(id){ return document.getElementById(id); }
function show(el, v){ if(el) el.style.display = v ? "" : "none"; }

export function bindAuthUI() {
  const email = qs("email");
  const pass = qs("pass");

  qs("loginBtn")?.addEventListener("click", async () => {
    try {
      await signInWithEmailAndPassword(auth, email.value.trim(), pass.value);
    } catch (e) {
      alert("Giriş hatası");
    }
  });

  qs("registerBtn")?.addEventListener("click", async () => {
    try {
      await createUserWithEmailAndPassword(auth, email.value.trim(), pass.value);
    } catch (e) {
      alert("Kayıt hatası");
    }
  });

  qs("googleBtn")?.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      alert("Google giriş hatası");
    }
  });

  qs("logoutBtn")?.addEventListener("click", async () => {
    await signOut(auth);
  });

  onAuthStateChanged(auth, (user) => {
    show(qs("authBox"), !user);
    show(qs("logoutBtn"), !!user);
    if (qs("userLabel")) {
      qs("userLabel").textContent = user ? user.email : "";
    }
  });
}

export function protectPage() {
  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "./";
  });
}
