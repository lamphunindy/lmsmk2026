// ==========================================
// 🔐 3. ระบบเข้าสู่ระบบ (Login & Auth)
// ==========================================
async function hashPasswordClient(password) {
  try {
    const msgUint8 = new TextEncoder().encode(password + PASSWORD_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return btoa(password + PASSWORD_SALT);
  }
}

function cleanKeyClient(str) { return str ? str.toString().toLowerCase().replace(/[.$#\[\]\/]/g, '_').trim() : ''; }

async function doLoginStaff() { 
  const email = document.getElementById('u').value.trim(); 
  const p = document.getElementById('p').value; 
  if (!email || !p) return showT('กรอกข้อมูลให้ครบ', true); 
  
  showL(); 
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, p);
    const firebaseUser = userCredential.user;
    
    const snap = await db.ref(`users/${firebaseUser.uid}`).once('value');
    const userData = snap.val();
    
    if (userData) {
        // 💡 แก้ไขตรงนี้: เพิ่ม username: firebaseUser.uid เข้าไปเพื่อให้ระบบหน้าห้องเรียนรู้จักครู
        user = { 
            status: 'success', 
            role: userData.role, 
            name: userData.name, 
            uid: firebaseUser.uid, 
            username: firebaseUser.uid 
        };
        showT(`ยินดีต้อนรับคุณ ${user.name}`); 
        hideL();
        
        if(user.role === 'superadmin' || user.role === 'admin') { 
          if(typeof loadAdminDashboard === 'function') loadAdminDashboard(); 
          switchView('v-admin'); 
        } else { 
          loadClasses(); 
          switchView('v-teacher'); 
        }
    } else {
        auth.signOut();
        hideL(); showT('บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบ', true);
    }
  } catch (error) { 
    hideL(); 
    showT('อีเมล หรือ รหัสผ่าน ไม่ถูกต้อง', true); 
    console.error(error);
  }
}

async function doLoginStudent() {
  const u = document.getElementById('stu-u').value.trim(); 
  const p = document.getElementById('stu-p').value.trim(); 
  if (!u || !p) return showT('กรอกข้อมูลให้ครบ', true); 
  
  showL(); 
  try {
    const snap = await db.ref('students').once('value');
    const dbObj = snap.val() || {}; 
    let found = null;
    
    for (let classId in dbObj) {
      for (let sid in dbObj[classId]) {
        let s = dbObj[classId][sid];
        if (s.studentId && s.studentId.toString() === u && s.pin === p) {
          found = { role: 'student', name: s.name, sid: sid, cid: classId, studentId: s.studentId }; 
          break;
        }
      }
      if (found) break;
    }
    
    if (found) { 
        user = found; 
        showT(`สวัสดีฮีโร่ ${user.name}!`); 
        if(typeof executeSearchStudentData === 'function') {
            executeSearchStudentData(user.sid, true); 
        } else {
            hideL(); 
            showT('ระบบกำลังประกอบร่าง กรุณารอโค้ดส่วนต่อไปครับ', true);
        }
    } else { 
        hideL(); showT('ข้อมูลไม่ถูกต้อง', true); 
    } 
  } catch (error) { handleFail(error); }
}

function logout() { 
  // เคลียร์เซสชันจำล็อกอินของนักเรียน
  localStorage.removeItem('lms_student_query');
  localStorage.removeItem('lms_student_isSid');
  
  // 💡 สั่งให้ Firebase เคลียร์เซสชันการล็อกอินออก
  auth.signOut().then(() => {
    user = null; cid = null; lastSearchRes = null; 
    switchView('v-lobby'); 
    showT('ออกจากระบบเรียบร้อยแล้ว'); 
  }).catch((error) => {
    handleFail(error);
  });
}
