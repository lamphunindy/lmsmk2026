// ==========================================
// 🎨 2. ฟังก์ชันควบคุมหน้าจอ (UI & Utils)
// ==========================================
const showL = () => { document.getElementById('loading').style.setProperty('display', 'flex', 'important'); };
const hideL = () => { document.getElementById('loading').style.setProperty('display', 'none', 'important'); };

function showT(msg, isErr = false) { 
  const t = document.getElementById('toast'); 
  t.innerText = msg; t.className = isErr ? 'show error' : 'show success'; 
  setTimeout(() => t.className = '', 3000); 
}

function handleFail(error) { 
  hideL(); 
  showT('เกิดข้อผิดพลาด: ' + error.message, true); 
  console.error("System Error:", error); 
}

function switchView(id) { 
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); 
  const targetView = document.getElementById(id);
  if(targetView) targetView.classList.add('active'); 
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); 
  window.scrollTo(0,0);
}

function openModal(id) { 
  const modal = document.getElementById(id);
  if(modal) modal.classList.add('active'); 
}

function closeModal(id) { 
  const modal = document.getElementById(id);
  if(modal) {
    modal.classList.remove('active'); 
    modal.querySelectorAll(`input:not([type="color"]):not([type="range"])`).forEach(input => input.value = '');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('lms-theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('theme-toggle');
  if(btn) btn.innerText = isDark ? '☀️' : '🌙';
}
