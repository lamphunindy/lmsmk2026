// ==========================================
// 📅 ระบบตารางสอน & แจ้งเตือนเช็คชื่อ
// ==========================================

// ฝัง CSS แอนิเมชันกะพริบเตือน
if (!document.getElementById('schedule-alert-styles')) {
    const style = document.createElement('style');
    style.id = 'schedule-alert-styles';
    style.innerHTML = `@keyframes pulse-alert { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }`;
    document.head.appendChild(style);
}

// ฟังก์ชันเปิดตั้งค่าวันสอนสำหรับแต่ละห้อง
async function openScheduleSettings(cid, cname) {
    const snap = await db.ref(`classrooms/${cid}/teachDays`).once('value');
    const teachDays = snap.val() || [];

    const days = [
        { id: 1, name: '💛 วันจันทร์' }, { id: 2, name: '💖 วันอังคาร' },
        { id: 3, name: '💚 วันพุธ' }, { id: 4, name: '🧡 วันพฤหัสบดี' }, { id: 5, name: '💙 วันศุกร์' }
    ];

    let html = '<div style="text-align:left; margin-top:10px; background:var(--bg); padding:15px; border-radius:12px;">';
    days.forEach(d => {
        const isChecked = teachDays.includes(d.id) ? 'checked' : '';
        html += `<label style="display:flex; align-items:center; margin-bottom:12px; font-size:1.1rem; cursor:pointer; font-weight:500;">
                    <input type="checkbox" class="teach-day-cb" value="${d.id}" ${isChecked} style="width:22px; height:22px; margin-right:12px; accent-color:var(--primary);"> ${d.name}
                 </label>`;
    });
    html += '</div>';

    const { value: formValues } = await Swal.fire({
        title: `📅 ตารางสอนห้อง ${cname}`,
        html: html,
        showCancelButton: true,
        confirmButtonText: '💾 บันทึกตาราง',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const selected = [];
            document.querySelectorAll('.teach-day-cb:checked').forEach(cb => selected.push(parseInt(cb.value)));
            return selected;
        }
    });

    if (formValues) {
        showL();
        try {
            await db.ref(`classrooms/${cid}/teachDays`).set(formValues);
            hideL();
            showT('บันทึกตารางสอนสำเร็จ!');
            loadClasses(); // รีเฟรชหน้าห้องเรียนเพื่ออัปเดตแจ้งเตือน
        } catch (e) { handleFail(e); }
    }
}


let teacherClassData = { st: {}, as: {}, at: {}, sc: {}, sub: {}, ex: {}, exSub: {} };
let teacherClassDebounce = null;
let currentTeacherCid = null;

function detachTeacherListeners() {
  if (currentTeacherCid) {
    db.ref(`students/${currentTeacherCid}`).off('value');
    db.ref(`assignments/${currentTeacherCid}`).off('value');
    db.ref(`attendance/${currentTeacherCid}`).off('value');
    db.ref(`scores`).off('value');
    db.ref(`submissions/${currentTeacherCid}`).off('value');
    db.ref(`exams/${currentTeacherCid}`).off('value');
    db.ref(`exam_submissions/${currentTeacherCid}`).off('value');
  }
}

function updateTeacherClassUI() {
  if (teacherClassDebounce) clearTimeout(teacherClassDebounce);
  teacherClassDebounce = setTimeout(() => {
    processClassData(
      teacherClassData.st, teacherClassData.as, teacherClassData.at,
      teacherClassData.sc, teacherClassData.sub, teacherClassData.ex, teacherClassData.exSub
    );
  }, 300);
}

async function openClass(id, name, emoji) {
  showL(); 
  detachTeacherListeners();
  cid = id;
  currentTeacherCid = id;
  document.getElementById('det-title').innerText = `${emoji} ${name}`;
  try {
    const [stSnap, asSnap, atSnap, scSnap, subSnap, exSnap, exSubSnap, annSnap] = await Promise.all([
      db.ref(`students/${cid}`).once('value'), 
      db.ref(`assignments/${cid}`).once('value'),
      db.ref(`attendance/${cid}`).once('value'), 
      db.ref(`scores`).once('value'),
      db.ref(`submissions/${cid}`).once('value'),
      db.ref(`exams/${cid}`).once('value'),
      db.ref(`exam_submissions/${cid}`).once('value'),
      db.ref(`announcements/${cid}`).once('value')
    ]);
    
    const annObj = annSnap.val() || {};
    document.getElementById('class-announcement-input').value = annObj.text || '';
    
    teacherClassData.st = stSnap.val() || {};
    teacherClassData.as = asSnap.val() || {};
    teacherClassData.at = atSnap.val() || {};
    teacherClassData.sc = scSnap.val() || {};
    teacherClassData.sub = subSnap.val() || {};
    teacherClassData.ex = exSnap.val() || {};
    teacherClassData.exSub = exSubSnap.val() || {};
    
    updateTeacherClassUI();
    hideL(); 
    switchView('v-detail');

    db.ref(`students/${cid}`).on('value', snap => { teacherClassData.st = snap.val() || {}; updateTeacherClassUI(); });
    db.ref(`assignments/${cid}`).on('value', snap => { teacherClassData.as = snap.val() || {}; updateTeacherClassUI(); });
    db.ref(`attendance/${cid}`).on('value', snap => { teacherClassData.at = snap.val() || {}; updateTeacherClassUI(); });
    db.ref(`scores`).on('value', snap => { teacherClassData.sc = snap.val() || {}; updateTeacherClassUI(); });
    db.ref(`submissions/${cid}`).on('value', snap => { teacherClassData.sub = snap.val() || {}; updateTeacherClassUI(); });
    db.ref(`exams/${cid}`).on('value', snap => { teacherClassData.ex = snap.val() || {}; updateTeacherClassUI(); });
    db.ref(`exam_submissions/${cid}`).on('value', snap => { teacherClassData.exSub = snap.val() || {}; updateTeacherClassUI(); });
  } catch(err) { handleFail(err); }
}

function openEditClass(id, name, emoji) {
  document.getElementById('ec-id').value = id;
  document.getElementById('ec-name').value = name;
  document.getElementById('ec-emoji').value = emoji;
  openModal('m-edit-class');
}

async function saveEditClass() {
  const id = document.getElementById('ec-id').value;
  const name = document.getElementById('ec-name').value.trim();
  const emoji = document.getElementById('ec-emoji').value.trim();
  
  if(!name) return showT('กรุณากรอกชื่อห้องเรียน', true);
  
  showL();
  try {
    await db.ref(`classrooms/${id}`).update({ name: name, emoji: emoji });
    hideL(); closeModal('m-edit-class'); showT('แก้ไขข้อมูลห้องเรียนสำเร็จ'); loadClasses();
  } catch(e) { handleFail(e); }
}

function deleteClass(classId) {
  if(confirm('🚨 คำเตือน: คุณแน่ใจหรือไม่ว่าจะลบห้องเรียนนี้?\n(ข้อมูลนักเรียน คะแนน และการเช็คชื่อในห้องนี้จะถูกลบทั้งหมดและกู้คืนไม่ได้)')) {
    showL();
    Promise.all([
      db.ref(`classrooms/${classId}`).remove(),
      db.ref(`students/${classId}`).remove(),
      db.ref(`assignments/${classId}`).remove(),
      db.ref(`attendance/${classId}`).remove(),
      db.ref(`exams/${classId}`).remove()
    ]).then(() => {
      hideL(); showT('ลบห้องเรียนเรียบร้อยแล้ว'); loadClasses();
    }).catch(handleFail);
  }
}
// 💡 เพิ่มรับค่า subObj
function renderWarningBoard(asObj, atObj, scObj, subObj = {}) {
  const warningBoard = document.getElementById('warning-board');
  if(!warningBoard) return;

  let warningsHtml = '';
  const assignments = Object.keys(asObj);
  const MAX_MISSING_WORK = 1; // สมมติว่าค้าง 1 งานก็เตือนเลย (เปลี่ยนตัวเลขได้ตามต้องการ)
  const MAX_ABSENCES = 3; 
  const MAX_LEAVES = 4;       

  students.forEach(s => {
    let missingCount = 0; let missingNames = [];
    assignments.forEach(aid => {
      const score = (scObj[aid] && scObj[aid][s.id] !== undefined) ? scObj[aid][s.id] : '-';
      const isSubmitted = subObj[aid] && subObj[aid][s.id]; // 💡 ตรวจสอบว่าเด็กส่งงานนี้มาแล้วหรือยัง
      
      // 💡 จะนับว่าค้างงาน ก็ต่อเมื่อ (ยังไม่มีคะแนน) และ (ยังไม่ได้อัปโหลดไฟล์ส่ง)
      if ((score === '-' || score === '') && !isSubmitted) { 
          missingCount++; 
          missingNames.push(asObj[aid].title); 
      }
    });

    let absentCount = 0; let leaveCount = 0; 
    Object.values(atObj).forEach(day => {
      if (day[s.id] === 'ขาด') absentCount++;
      if (day[s.id] === 'ลา' || day[s.id] === 'ป่วย') leaveCount++; 
    });

    if (missingCount >= MAX_MISSING_WORK) {
      warningsHtml += `<div class="card" style="margin:0; background:var(--bg-red); border-color:var(--border-red); padding:15px; display:flex; align-items:center; gap:10px;">
          <span style="font-size:2rem;">🚨</span>
          <div>
            <strong style="color:var(--text-red);">เลขที่ ${s.number} ${s.name} (ค้าง ${missingCount} งาน)</strong><br>
            <span style="color:var(--text-red); font-size:0.85rem;">ยังไม่ส่ง: ${missingNames.join(', ')}</span>
          </div>
        </div>`;
    }
    if (absentCount >= MAX_ABSENCES) {
       warningsHtml += `<div class="card" style="margin:0; background:var(--bg-orange); border-color:var(--border-orange); padding:15px; display:flex; align-items:center; gap:10px;">
          <span style="font-size:2rem;">⚠️</span>
          <div><strong style="color:var(--text-orange);">เลขที่ ${s.number} ${s.name} (ขาดเรียน ${absentCount} ครั้ง)</strong></div>
        </div>`;
    }
    if (leaveCount >= MAX_LEAVES) {
       warningsHtml += `<div class="card" style="margin:0; background:var(--bg-blue); border-color:var(--border-blue); padding:15px; display:flex; align-items:center; gap:10px;">
          <span style="font-size:2rem;">📝</span>
          <div><strong style="color:var(--text-blue);">เลขที่ ${s.number} ${s.name} (ลากิจ/ป่วย ${leaveCount} ครั้ง)</strong></div>
        </div>`;
    }
  });

  if(warningsHtml === '') { warningBoard.style.display = 'none'; } 
  else { warningBoard.style.display = 'grid'; warningBoard.innerHTML = warningsHtml; }
}

// 💡 รับตัวแปร exObj และ exSubObj เข้ามาเพิ่ม
function processClassData(stObj, asObj, atObj, scObj, subObj = {}, exObj = {}, exSubObj = {}) {
  students = Object.keys(stObj).map(sid => ({ id: sid, ...stObj[sid] })).sort((a,b) => a.number - b.number);
  const assignments = Object.keys(asObj).map(aid => ({ id: aid, ...asObj[aid] }));
  const exams = Object.keys(exObj).map(eid => ({ id: eid, ...exObj[eid] })); // รายการข้อสอบ

  let scoreHtml = '<table><thead><tr><th>เลขที่</th><th class="text-left">ชื่อ-นามสกุล</th>';
  
  // 1. หัวตาราง: งานทั่วไป
  assignments.forEach(a => { scoreHtml += `<th>${a.title} (${a.maxScore})</th>`; });
  
  // 2. หัวตาราง: ข้อสอบ
  exams.forEach(ex => {
      let exMax = 0;
      if(ex.questions) ex.questions.forEach(q => exMax += (parseFloat(q.score) || 1));
      scoreHtml += `<th>📝 ${ex.title} (${exMax})</th>`;
  });

  scoreHtml += '<th>รวม</th><th>เกรด</th></tr></thead><tbody>';

  students.forEach(s => {
    let rowTotal = 0; let rowMax = 0;
    scoreHtml += `<tr><td>${s.number}</td><td class="text-left">${s.name}</td>`;
    
    // 1. คะแนนงานทั่วไป
    assignments.forEach(a => {
      let score = (scObj[a.id] && scObj[a.id][s.id] !== undefined) ? scObj[a.id][s.id] : '-';
      scoreHtml += `<td>${score}</td>`;
      if(score !== '-' && !isNaN(score)) rowTotal += parseFloat(score);
      rowMax += parseFloat(a.maxScore);
    });

    // 2. คะแนนข้อสอบ
    exams.forEach(ex => {
       let exMax = 0;
       if(ex.questions) ex.questions.forEach(q => exMax += (parseFloat(q.score) || 1));
       rowMax += exMax;

       let exScore = '-';
       // ถ้าเด็กส่งข้อสอบแล้ว ให้ดึงคะแนนมาโชว์
       if(exSubObj[ex.id] && exSubObj[ex.id][s.id]) {
           exScore = exSubObj[ex.id][s.id].score;
           rowTotal += parseFloat(exScore);
       }
       scoreHtml += `<td style="color:var(--primary); font-weight:bold;">${exScore}</td>`;
    });

    scoreHtml += `<td class="total-col">${rowTotal}</td><td class="total-col">${getAutoGrade(rowTotal, rowMax)}</td></tr>`;
  });
  document.getElementById('score-summary-table').innerHTML = students.length ? scoreHtml + '</tbody></table>' : '<p style="text-align:center; padding:20px;">ยังไม่มีนักเรียนในห้องนี้</p>';

  // --- ส่วนเช็คชื่อยังคงเหมือนเดิม ---
  let attHtml = '<table><thead><tr><th>เลขที่</th><th class="text-left">ชื่อ-นามสกุล</th><th>มา</th><th>สาย</th><th>ขาด</th><th>ลา</th><th>ป่วย</th></tr></thead><tbody>';
  students.forEach(s => {
    let stats = { "มา":0, "สาย":0, "ขาด":0, "ลา":0, "ป่วย":0 };
    Object.values(atObj).forEach(day => { if(day[s.id] && stats[day[s.id]] !== undefined) stats[day[s.id]]++; });
    attHtml += `<tr><td>${s.number}</td><td class="text-left">${s.name}</td><td class="tag-มา">${stats["มา"]}</td><td class="tag-สาย">${stats["สาย"]}</td><td class="tag-ขาด">${stats["ขาด"]}</td><td class="tag-ลา">${stats["ลา"]}</td><td class="tag-ป่วย">${stats["ป่วย"]}</td></tr>`;
  });
  document.getElementById('attendance-summary-table').innerHTML = students.length ? attHtml + '</tbody></table>' : '<p style="text-align:center; padding:20px;">ยังไม่มีข้อมูล</p>';
  
  renderWarningBoard(asObj, atObj, scObj, subObj);
}

function getAutoGrade(score, max) { 
  if(!max || max == 0) return '-'; let p = (score / max) * 100; 
  if(p >= 80) return '4'; if(p >= 75) return '3.5'; if(p >= 70) return '3'; if(p >= 65) return '2.5'; if(p >= 60) return '2'; if(p >= 55) return '1.5'; if(p >= 50) return '1'; return '0'; 
}



// ==========================================
