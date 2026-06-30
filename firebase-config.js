// ==========================================
// 🚀 1. การตั้งค่า Firebase & ตัวแปรหลัก
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB4iCObhze_rzU83QZKAFOzffFk_Bz0mgQ",
  authDomain: "mk2026.firebaseapp.com",
  databaseURL: "https://lms-classroom2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "LMS-Classroom2026",
  messagingSenderId: "1005483544251",
  appId: "1:1005483544251:web:3464201f7914c4d56aa39e",
  measurementId: "G-EM1L8WCBTR"
};

// GEMINI_API_KEY ถูกย้ายไปที่ Backend เพื่อความปลอดภัย
const GAS_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbz8rPFrFUpGxQLdRP7YM8Y3el9TA5m-fiftvnLqcKKoS5wQxA4lPHLP_pb5kqLKG-kg/exec";
const PASSWORD_SALT = "LMS_SUPER_SECRET_SALT_2026!";

// เริ่มต้นใช้งาน Firebase
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();
const auth = firebase.auth();
const storage = (typeof firebase.storage === "function") ? firebase.storage() : null; 
const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryApp");
let user = null, cid = null, aid = null, students = [];
let lastSearchRes = null;
let isSubmittingScore = false, isSavingAt = false;
let chart1 = null, chart2 = null;
let currentUploadFile = null;
