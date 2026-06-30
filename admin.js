// ==========================================
// 🛡️ 8. ระบบหลังบ้าน แอดมิน & Backup
// ==========================================

async function loadAdminDashboard() {
  showL();
  try {
      const snap = await db.ref('users').once('value'); 
      const usersData = snap.val() || {};
      let teacherHtml = '<table><thead><tr><th class="text-left">Username (Email)</th><th class="text-left">ชื่อ-นามสกุล</th><th>จัดการ</th></tr></thead><tbody>';
      let adminHtml = '<table><thead><tr><th class="text-left">Username (Email)</th><th class="text-left">ชื่อ-นามสกุล</th><th>จัดการ</th></tr></thead><tbody>';
      let hasTeacher = false; let hasAdmin = false;

      Object.keys(usersData).forEach(uid => {
          const u = usersData[uid];
          const displayUsername = u.email || uid;
          const safeEmail = u.email ? u.email : ''; // ส่งค่าอีเมลไปหน้าต่างแก้ไข

          if (u.role === 'teacher') {
              hasTeacher = true;
              teacherHtml += `<tr><td class="text-left" style="font-weight:600;">${displayUsername}</td><td class="text-left">${u.name}</td>
                  <td><div style="display:flex; gap:5px; justify-content:center;"><button class="btn-sm btn-outline" onclick="editTeacher('${uid}', '${u.name}', '${safeEmail}')">✏️ แก้ไข</button><button class="btn-sm btn-red" onclick="deleteUser('${uid}')">🗑️ ลบ</button></div></td></tr>`;
          } else if (u.role === 'admin' || u.role === 'superadmin') {
              hasAdmin = true; let actionBtns = '';
              if (user.role === 'superadmin') {
                  actionBtns = `<div style="display:flex; gap:5px; justify-content:center;"><button class="btn-sm btn-outline" onclick="editAdmin('${uid}', '${u.name}', '${safeEmail}')">✏️ แก้ไข</button>${uid !== user.username ? `<button class="btn-sm btn-red" onclick="deleteUser('${uid}')">🗑️ ลบ</button>` : ''}</div>`;
              } else { actionBtns = (uid === user.username) ? '<span style="color:var(--text-green); font-weight:bold;">บัญชีของคุณ</span>' : '-'; }
              adminHtml += `<tr><td class="text-left" style="font-weight:600;">${displayUsername} <span style="font-size:0.8rem; color:var(--primary);">(${u.role})</span></td><td class="text-left">${u.name}</td><td>${actionBtns}</td></tr>`;
          }
      });
      teacherHtml += '</tbody></table>'; adminHtml += '</tbody></table>';

      document.getElementById('teacher-list').innerHTML = hasTeacher ? teacherHtml : '<p style="text-align:center; padding:20px; color:var(--text-muted);">ยังไม่มีข้อมูลครูผู้สอน</p>';
      document.getElementById('admin-list').innerHTML = hasAdmin ? adminHtml : '';

      if (user.role === 'superadmin') {
          document.getElementById('superadmin-panel').style.display = 'block'; document.getElementById('btn-sys-settings').style.display = 'inline-flex';
      } else {
          document.getElementById('superadmin-panel').style.display = 'none'; document.getElementById('btn-sys-settings').style.display = 'none';
      }
      hideL();
  } catch (e) { handleFail(e); }
}

function editTeacher(uid, name, email) { 
    document.getElementById('et-u').value = uid; 
    document.getElementById('et-email').value = email; 
    document.getElementById('et-n').value = name; 
    document.getElementById('et-p').value = ''; 
    openModal('m-edit-teacher'); 
}

async function saveEditTeacher() {
  const uid = document.getElementById('et-u').value; 
  const email = document.getElementById('et-email').value.trim(); 
  const name = document.getElementById('et-n').value; 
  const pass = document.getElementById('et-p').value;
  if(!name) return showT('กรุณากรอกชื่อ', true);
  
  showL(); 
  let updates = { name: name, email: email }; 
  if(pass) updates.password = await hashPasswordClient(pass);
  
  db.ref(`users/${uid}`).update(updates).then(()=>{ 
      hideL(); closeModal('m-edit-teacher'); showT('แก้ไขข้อมูลครูสำเร็จ'); loadAdminDashboard(); 
  }).catch(handleFail);
}

function editAdmin(uid, name, email) { 
    document.getElementById('ea-u').value = uid; 
    document.getElementById('ea-email').value = email; 
    document.getElementById('ea-n').value = name; 
    document.getElementById('ea-p').value = ''; 
    openModal('m-edit-admin'); 
}

async function saveEditAdmin() {
  const uid = document.getElementById('ea-u').value; 
  const email = document.getElementById('ea-email').value.trim(); 
  const name = document.getElementById('ea-n').value; 
  const pass = document.getElementById('ea-p').value;
  if(!name) return showT('กรุณากรอกชื่อ', true);
  
  showL(); 
  let updates = { name: name, email: email }; 
  if(pass) updates.password = await hashPasswordClient(pass);
  
  db.ref(`users/${uid}`).update(updates).then(()=>{ 
      hideL(); closeModal('m-edit-admin'); showT('แก้ไขข้อมูลแอดมินสำเร็จ'); loadAdminDashboard(); 
  }).catch(handleFail);
}

function deleteUser(uid) {
  if (confirm(`ต้องการลบบัญชีผู้ใช้ "${uid}" ใช่หรือไม่?`)) {
      showL(); db.ref(`users/${uid}`).remove().then(() => { hideL(); showT('ลบบัญชีเรียบร้อยแล้ว'); loadAdminDashboard(); }).catch(handleFail);
  }
}

async function openAdminClasses() {
  showL(); switchView('v-admin-classes');
  try {
    const [classSnap, userSnap] = await Promise.all([ db.ref('classrooms').once('value'), db.ref('users').once('value') ]);
    const classes = classSnap.val() || {}; const users = userSnap.val() || {}; const list = document.getElementById('admin-class-list');
    let html = ''; const keys = Object.keys(classes);
    if (keys.length === 0) { html = '<p style="text-align:center; grid-column:1/-1; padding:20px;">ยังไม่มีข้อมูลห้องเรียนในระบบ</p>'; } 
    else {
      keys.forEach(cid => {
        const c = classes[cid]; let teacherName = c.teacher;
        if (users[c.teacher] && users[c.teacher].name) teacherName = `${users[c.teacher].name} <span style="font-size:0.8rem; color:var(--text-muted);">(${c.teacher})</span>`;
        else if (!c.teacher) teacherName = '<span style="color:var(--text-red);">ไม่มีครูประจำวิชา</span>';
        html += `<div class="card" style="border-left: 5px solid var(--border-blue);"><h3 style="margin-bottom:10px; color:var(--text-main);">${c.emoji || '🏫'} ${c.name}</h3><p style="margin-bottom:15px; font-size:0.95rem;">ครูผู้สอน: <b>${teacherName}</b></p><button class="btn btn-outline" style="width:100%; border-color:var(--border-blue); color:var(--text-blue);" onclick="openTransferModal('${cid}', '${c.name}', '${c.teacher}')">🔄 โอนย้าย / เปลี่ยนครู</button></div>`;
      });
    }
    list.innerHTML = html; hideL();
  } catch (e) { handleFail(e); }
}

async function openTransferModal(classId, className, currentTeacher) {
  showL();
  try {
    const snap = await db.ref('users').once('value'); const users = snap.val() || {};
    let options = '<option value="">-- เลือกครูคนใหม่ --</option>';
    Object.keys(users).forEach(uid => {
      const u = users[uid];
      if (u.role === 'teacher' || u.role === 'admin' || u.role === 'superadmin') {
        let isSelected = (uid === currentTeacher) ? 'selected' : '';
        options += `<option value="${uid}" ${isSelected}>${u.name} (${uid})</option>`;
      }
    });
    document.getElementById('transfer-new-teacher').innerHTML = options; document.getElementById('transfer-class-name').innerText = `ห้อง: ${className}`; document.getElementById('transfer-cid').value = classId;
    hideL(); openModal('m-transfer-class');
  } catch (e) { handleFail(e); }
}

async function saveTransferClass() {
  const cid = document.getElementById('transfer-cid').value; const newTeacher = document.getElementById('transfer-new-teacher').value;
  if (!newTeacher) return showT('กรุณาเลือกครูผู้สอนคนใหม่', true);
  showL();
  try { await db.ref(`classrooms/${cid}/teacher`).set(newTeacher); hideL(); closeModal('m-transfer-class'); if(typeof Swal !== 'undefined') Swal.fire('สำเร็จ', 'โอนย้ายห้องเรียนเรียบร้อยแล้ว', 'success'); else showT('โอนย้ายห้องเรียนสำเร็จ'); openAdminClasses(); } 
  catch (e) { handleFail(e); }
}

async function doBackup() {
  if(!user || (user.role !== 'admin' && user.role !== 'superadmin')) return showT('สิทธิ์ไม่เพียงพอ เฉพาะแอดมินเท่านั้น', true);
  showL();
  try {
    const snap = await db.ref('/').once('value'); const allData = snap.val();
    if(!allData) { hideL(); return showT('ไม่มีข้อมูลให้แบ็คอัพ', true); }
    const jsonStr = JSON.stringify(allData, null, 2); const blob = new Blob([jsonStr], { type: "application/json" }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    const d = new Date(); const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    a.download = `LMS_Backup_${dateStr}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    hideL(); if(typeof Swal !== 'undefined') Swal.fire('สำเร็จ!', 'ดาวน์โหลดไฟล์ Backup ลงเครื่องเรียบร้อยแล้ว', 'success'); else showT('ดาวน์โหลดไฟล์ Backup แล้ว');
  } catch(e) { handleFail(e); }
}

// ระบบตั้งค่า Footer และชื่อเว็บ และปุ่มต่างๆ (แก้ไขใหม่ให้ครอบคลุมปุ่มทั้งหมด)
function openSystemSettings() {
  document.getElementById('sys-title-input').value = document.getElementById('main-lobby-title').innerText;
  const fText = document.getElementById('sys-footer-text');
  document.getElementById('sys-footer-input').value = fText ? fText.innerText : '';
  
  // โหลดหน้าหลัก
  document.getElementById('sys-btn-search').value = document.getElementById('btn-search-text') ? document.getElementById('btn-search-text').innerText : '';
  document.getElementById('sys-btn-student').value = document.getElementById('btn-student-login-text') ? document.getElementById('btn-student-login-text').innerText : '';
  document.getElementById('sys-btn-staff').value = document.getElementById('btn-staff-login-text') ? document.getElementById('btn-staff-login-text').innerText : '';
  document.getElementById('sys-btn-calendar').value = document.getElementById('btn-calendar-text') ? document.getElementById('btn-calendar-text').innerText : '';

  // โหลดเมนูห้องเรียน
  document.getElementById('sys-btn-tools').value = document.getElementById('btn-tools-text') ? document.getElementById('btn-tools-text').innerText : '';
  document.getElementById('sys-btn-seating').value = document.getElementById('btn-seating-text') ? document.getElementById('btn-seating-text').innerText : '';
  document.getElementById('sys-btn-timeline').value = document.getElementById('btn-timeline-text') ? document.getElementById('btn-timeline-text').innerText : '';
  document.getElementById('sys-btn-attendance').value = document.getElementById('btn-attendance-text') ? document.getElementById('btn-attendance-text').innerText : '';
  document.getElementById('sys-btn-assignments').value = document.getElementById('btn-assignments-text') ? document.getElementById('btn-assignments-text').innerText : '';
  document.getElementById('sys-btn-exams').value = document.getElementById('btn-exams-text') ? document.getElementById('btn-exams-text').innerText : '';

  // โหลดการจัดการนักเรียน
  document.getElementById('sys-btn-excel').value = document.getElementById('btn-excel-text') ? document.getElementById('btn-excel-text').innerText : '';
  document.getElementById('sys-btn-cert').value = document.getElementById('btn-cert-text') ? document.getElementById('btn-cert-text').innerText : '';
  document.getElementById('sys-btn-add-student').value = document.getElementById('btn-add-student-text') ? document.getElementById('btn-add-student-text').innerText : '';
  document.getElementById('sys-btn-manage-student').value = document.getElementById('btn-manage-student-text') ? document.getElementById('btn-manage-student-text').innerText : '';
  document.getElementById('sys-btn-hero-points').value = document.getElementById('btn-hero-points-text') ? document.getElementById('btn-hero-points-text').innerText : '';

  openModal('m-system-settings');
}

async function saveSysSettings() {
  const newTitle = document.getElementById('sys-title-input').value.trim(); 
  if(!newTitle) return showT('กรุณากรอกชื่อระบบ', true);
  showL();
  try {
    const settingsObj = { 
      title: newTitle, 
      footer: document.getElementById('sys-footer-input').value.trim(),
      btnSearch: document.getElementById('sys-btn-search').value.trim(),
      btnStudent: document.getElementById('sys-btn-student').value.trim(),
      btnStaff: document.getElementById('sys-btn-staff').value.trim(),
      btnCalendar: document.getElementById('sys-btn-calendar').value.trim(),
      btnTools: document.getElementById('sys-btn-tools').value.trim(),
      btnSeating: document.getElementById('sys-btn-seating').value.trim(),
      btnTimeline: document.getElementById('sys-btn-timeline').value.trim(),
      btnAttendance: document.getElementById('sys-btn-attendance').value.trim(),
      btnAssignments: document.getElementById('sys-btn-assignments').value.trim(),
      btnExams: document.getElementById('sys-btn-exams').value.trim(),
      btnExcel: document.getElementById('sys-btn-excel').value.trim(),
      btnCert: document.getElementById('sys-btn-cert').value.trim(),
      btnAddStudent: document.getElementById('sys-btn-add-student').value.trim(),
      btnManageStudent: document.getElementById('sys-btn-manage-student').value.trim(),
      btnHeroPoints: document.getElementById('sys-btn-hero-points').value.trim()
    };

    await db.ref('system_settings').update(settingsObj);
    
    // อัปเดตหน้าจอทันที
    document.getElementById('main-lobby-title').innerText = settingsObj.title; 
    if (document.getElementById('sys-footer-text')) document.getElementById('sys-footer-text').innerText = settingsObj.footer;
    if (document.getElementById('btn-search-text') && settingsObj.btnSearch) document.getElementById('btn-search-text').innerText = settingsObj.btnSearch;
    if (document.getElementById('btn-student-login-text') && settingsObj.btnStudent) document.getElementById('btn-student-login-text').innerText = settingsObj.btnStudent;
    if (document.getElementById('btn-staff-login-text') && settingsObj.btnStaff) document.getElementById('btn-staff-login-text').innerText = settingsObj.btnStaff;
    if (document.getElementById('btn-calendar-text') && settingsObj.btnCalendar) document.getElementById('btn-calendar-text').innerText = settingsObj.btnCalendar;
    
    if (document.getElementById('btn-tools-text') && settingsObj.btnTools) document.getElementById('btn-tools-text').innerText = settingsObj.btnTools;
    if (document.getElementById('btn-seating-text') && settingsObj.btnSeating) document.getElementById('btn-seating-text').innerText = settingsObj.btnSeating;
    if (document.getElementById('btn-timeline-text') && settingsObj.btnTimeline) document.getElementById('btn-timeline-text').innerText = settingsObj.btnTimeline;
    if (document.getElementById('btn-attendance-text') && settingsObj.btnAttendance) document.getElementById('btn-attendance-text').innerText = settingsObj.btnAttendance;
    if (document.getElementById('btn-assignments-text') && settingsObj.btnAssignments) document.getElementById('btn-assignments-text').innerText = settingsObj.btnAssignments;
    if (document.getElementById('btn-exams-text') && settingsObj.btnExams) document.getElementById('btn-exams-text').innerText = settingsObj.btnExams;

    if (document.getElementById('btn-excel-text') && settingsObj.btnExcel) document.getElementById('btn-excel-text').innerText = settingsObj.btnExcel;
    if (document.getElementById('btn-cert-text') && settingsObj.btnCert) document.getElementById('btn-cert-text').innerText = settingsObj.btnCert;
    if (document.getElementById('btn-add-student-text') && settingsObj.btnAddStudent) document.getElementById('btn-add-student-text').innerText = settingsObj.btnAddStudent;
    if (document.getElementById('btn-manage-student-text') && settingsObj.btnManageStudent) document.getElementById('btn-manage-student-text').innerText = settingsObj.btnManageStudent;
    if (document.getElementById('btn-hero-points-text') && settingsObj.btnHeroPoints) document.getElementById('btn-hero-points-text').innerText = settingsObj.btnHeroPoints;

    hideL(); closeModal('m-system-settings'); showT('บันทึกการตั้งค่าระบบเรียบร้อย');
  } catch (e) { handleFail(e); }
}
function openProfile() {
  if (!user) return;
  
  // 💡 แก้ไข: ดึง Email ที่ใช้ล็อกอินมาโชว์แทนรหัส UID ยาวๆ
  const displayUser = (auth.currentUser && auth.currentUser.email) ? auth.currentUser.email : user.username;
  
  document.getElementById('prof-id').innerText = displayUser;
  document.getElementById('prof-role').innerText = user.role === 'teacher' ? 'ครูผู้สอน' : 'แอดมิน';
  document.getElementById('prof-name').value = user.name || '';
  document.getElementById('prof-pass').value = ''; // ปล่อยว่างไว้เผื่อเปลี่ยนรหัส
  
  openModal('m-profile');
}

async function saveProfile() {
  const newName = document.getElementById('prof-name').value.trim();
  const newPass = document.getElementById('prof-pass').value;
  
  if (!newName) return showT('กรุณากรอกชื่อ-นามสกุล', true);

  showL(); 
  try {
    const currentUser = auth.currentUser; // ดึงข้อมูลผู้ใช้ปัจจุบันจาก Firebase
    
    // 1. ถ้ามีการกรอกรหัสผ่านใหม่ ให้สั่งเปลี่ยนรหัสใน Firebase Auth
    if (newPass) {
      if (currentUser) {
        await currentUser.updatePassword(newPass);
      } else {
        hideL(); 
        return showT('เซสชันหมดอายุ กรุณาล็อกอินใหม่', true);
      }
    }
    
    // 2. อัปเดตชื่อใน Realtime Database (ใช้ UID เพื่อความแม่นยำ)
    await db.ref(`users/${currentUser.uid}`).update({ name: newName });
    
    user.name = newName; 
    hideL();
    closeModal('m-profile');
    showT('บันทึกข้อมูลโปรไฟล์และรหัสผ่านสำเร็จแล้ว!');
    
    if(user.role === 'admin' || user.role === 'superadmin') {
      if(typeof loadAdminDashboard === 'function') loadAdminDashboard();
    }
  } catch (e) {
    hideL();
    // 💡 ดักจับ Error ด่านความปลอดภัยของ Firebase
    if (e.code === 'auth/requires-recent-login') {
        if(typeof Swal !== 'undefined') {
            Swal.fire('เพื่อความปลอดภัย', 'การเปลี่ยนรหัสผ่านต้องทำหลังจากเพิ่งล็อกอินเข้ามาใหม่ๆ กรุณาล็อกเอาท์แล้วล็อกอินใหม่อีกครั้งครับ', 'warning');
        } else {
            showT('เพื่อความปลอดภัย กรุณาล็อกเอาท์แล้วเข้าใหม่ก่อนเปลี่ยนรหัส', true);
        }
    } else if (e.code === 'auth/weak-password') {
        showT('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', true);
    } else {
        handleFail(e);
    }
  }
}

function openCommentModal(sid, name) { document.getElementById('cm-id').value = sid; document.getElementById('cm-name').innerText = `นักเรียน: ${name}`; document.getElementById('cm-text').value = ''; openModal('m-comment'); }
async function saveComment() {
  const sid = document.getElementById('cm-id').value; const text = document.getElementById('cm-text').value.trim();
  if(!text) return showT('กรุณาพิมพ์ข้อความบันทึก', true); if(!cid) return showT('ไม่พบห้องเรียน', true);
  showL();
  try { await db.ref(`students/${cid}/${sid}/comments`).push({ text: text, date: new Date().toISOString(), teacher: user.name }); hideL(); closeModal('m-comment'); showT('บันทึกพฤติกรรมเรียบร้อย'); } catch (e) { handleFail(e); }
}

function openRewardSystem() { if(typeof Swal !== 'undefined') { Swal.fire({ title: '🏆 หอเกียรติยศ', text: 'ระบบตู้โชว์ผลงานกำลังอยู่ระหว่างการพัฒนาครับ!', icon: 'info' }); } else { alert('ระบบหอเกียรติยศเร็วๆ นี้!'); } }

async function saveClass() {
  const name = document.getElementById('cn').value.trim(); const emoji = document.getElementById('ce').value.trim();
  if(!name) return showT('กรุณากรอกชื่อห้องเรียน', true);
  showL(); try { await db.ref('classrooms').push({ name, emoji, teacher: user.username }); hideL(); closeModal('m-class'); showT('สร้างห้องเรียนสำเร็จ'); loadClasses(); } catch(e) { handleFail(e); }
}
async function saveTeacher() {
  const name = document.getElementById('tc-n').value.trim(); 
  const email = document.getElementById('tc-u').value.trim(); 
  const pass = document.getElementById('tc-p').value;
  
  if(!name || !email || !pass) return showT('กรอกข้อมูลให้ครบ', true);
  
  showL(); 
  try {
    const userCred = await secondaryApp.auth().createUserWithEmailAndPassword(email, pass);
    const newUid = userCred.user.uid;
    
    // 💡 เพิ่มคำสั่ง: บันทึก email ลงไปในฐานข้อมูลด้วย
    await db.ref(`users/${newUid}`).set({ name: name, role: 'teacher', email: email });
    
    await secondaryApp.auth().signOut();
    
    hideL(); 
    closeModal('m-teacher'); 
    document.getElementById('tc-n').value = ''; document.getElementById('tc-u').value = ''; document.getElementById('tc-p').value = '';
    showT('เพิ่มบัญชีครูสำเร็จ!'); 
    loadAdminDashboard(); 
  } catch(e) { 
    hideL();
    if(e.code === 'auth/email-already-in-use') showT('อีเมลนี้มีผู้ใช้งานแล้ว', true);
    else if(e.code === 'auth/invalid-email') showT('รูปแบบอีเมลไม่ถูกต้อง', true);
    else handleFail(e); 
  }
}

async function saveAdmin() {
  const name = document.getElementById('ad-n').value.trim(); 
  const email = document.getElementById('ad-u').value.trim(); 
  const pass = document.getElementById('ad-p').value;
  
  if(!name || !email || !pass) return showT('กรอกข้อมูลให้ครบ', true);
  
  showL(); 
  try {
    const userCred = await secondaryApp.auth().createUserWithEmailAndPassword(email, pass);
    const newUid = userCred.user.uid;
    
    // 💡 เพิ่มคำสั่ง: บันทึก email ลงไปในฐานข้อมูลด้วย
    await db.ref(`users/${newUid}`).set({ name: name, role: 'admin', email: email });
    
    await secondaryApp.auth().signOut();
    
    hideL(); 
    closeModal('m-admin-add'); 
    document.getElementById('ad-n').value = ''; document.getElementById('ad-u').value = ''; document.getElementById('ad-p').value = '';
    showT('เพิ่มบัญชีแอดมินสำเร็จ!'); 
    loadAdminDashboard(); 
  } catch(e) { 
    hideL();
    if(e.code === 'auth/email-already-in-use') showT('อีเมลนี้มีผู้ใช้งานแล้ว', true);
    else handleFail(e); 
  }
}

// ==========================================
// ?? ตั้งค่าโลโก้ระบบ
// ==========================================
async function uploadMainLogo() {
  const fileInput = document.getElementById('upload-logo-file');
  const file = fileInput.files[0];
  if (!file) return showT('กรุณาเลือกไฟล์ก่อน', true);
  
  if (file.size > 1024 * 1024 * 2) { 
    return showT('ไฟล์รูปภาพใหญ่เกินไป (จำกัดไม่เกิน 2MB)', true);
  }

  showL();
  document.getElementById('loading').innerHTML = '<div class="spinner"></div><b style="color:white; margin-top:10px;">กำลังอัปโหลดขึ้น Google Drive...</b>';
  try {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const base64DataUrl = e.target.result;
        
        // บันทึก Base64 ลง Firebase โดยตรง หมดปัญหาภาพแตกจาก Google Drive
        await db.ref('settings/logoUrl').set(base64DataUrl);
        document.getElementById('main-lobby-logo').src = base64DataUrl;
        document.getElementById('admin-logo-preview').src = base64DataUrl;
        
        document.getElementById('loading').innerHTML = '<div class="spinner"></div><b style="color:white; margin-top:10px;">กำลังประมวลผล...</b>';
        hideL();
        showT('อัปเดตโลโก้สำเร็จ (บันทึกลงระบบโดยตรง)!');
      } catch (err) {
        document.getElementById('loading').innerHTML = '<div class="spinner"></div><b style="color:white; margin-top:10px;">กำลังประมวลผล...</b>';
        handleFail(err);
      }
    };
    reader.onerror = function() {
      document.getElementById('loading').innerHTML = '<div class="spinner"></div><b style="color:white; margin-top:10px;">กำลังประมวลผล...</b>';
      hideL();
      showT('เกิดข้อผิดพลาดในการอ่านไฟล์', true);
    };
    reader.readAsDataURL(file);
  } catch (error) {
    document.getElementById('loading').innerHTML = '<div class="spinner"></div><b style="color:white; margin-top:10px;">กำลังประมวลผล...</b>';
    handleFail(error);
  }
}
// ==========================================
// ?? ตั้งค่าข้อความต้อนรับและสีหลัก
// ==========================================
async function saveLobbyTitle() {
  const title = document.getElementById('admin-lobby-title').value.trim();
  if (!title) return showT('กรุณาพิมพ์ข้อความ', true);
  showL();
  try {
    await db.ref('settings/lobbyTitle').set(title);
    document.getElementById('main-lobby-title').innerText = title;
    hideL();
    showT('บันทึกข้อความสำเร็จ');
  } catch (error) { handleFail(error); }
}

async function savePrimaryColor() {
  const color = document.getElementById('admin-primary-color').value;
  showL();
  try {
    await db.ref('settings/primaryColor').set(color);
    document.documentElement.style.setProperty('--primary', color);
    hideL();
    showT('เปลี่ยนสีหลักสำเร็จ');
  } catch (error) { handleFail(error); }
}

async function resetPrimaryColor() {
  showL();
  try {
    await db.ref('settings/primaryColor').remove();
    document.documentElement.style.setProperty('--primary', '#6366f1');
    document.getElementById('admin-primary-color').value = '#6366f1';
    hideL();
    showT('คืนค่าสีดั้งเดิมสำเร็จ');
  } catch (error) { handleFail(error); }
}


