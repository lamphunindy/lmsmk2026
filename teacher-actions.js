// 🧰 กู้คืน: ระบบภารกิจ, เช็คชื่อ, ที่นั่ง, ให้คะแนน
// ==========================================
function openAttendance() { 
  if(!cid) return;
  const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
  document.getElementById('at-date-picker').value = `${y}-${m}-${day}`;

  let html = '<table><thead><tr><th>เลขที่</th><th class="text-left">ชื่อ-นามสกุล</th><th>เช็คชื่อ</th></tr></thead><tbody>';
  students.forEach(s => {
    html += `<tr><td>${s.number}</td><td class="text-left">${s.name}</td><td>
      <div class="at-group" data-sid="${s.id}">
        <button class="btn btn-outline at-btn" data-val="มา" onclick="this.parentElement.querySelectorAll('.at-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');">มา</button>
        <button class="btn btn-outline at-btn" data-val="สาย" onclick="this.parentElement.querySelectorAll('.at-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');">สาย</button>
        <button class="btn btn-outline at-btn" data-val="ลา" onclick="this.parentElement.querySelectorAll('.at-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');">ลา</button>
        <button class="btn btn-outline at-btn" data-val="ป่วย" onclick="this.parentElement.querySelectorAll('.at-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');">ป่วย</button>
        <button class="btn btn-outline at-btn" data-val="ขาด" onclick="this.parentElement.querySelectorAll('.at-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');">ขาด</button>
      </div>
    </td></tr>`;
  });
  html += '</tbody></table>';
  
  document.getElementById('at-table').innerHTML = html;
  switchView('v-at'); 

  // หลังจากสร้างตารางเสร็จ ให้ดึงข้อมูลเก่าของวันนี้มาแสดงด้วย
  loadAttendanceForSelectedDate();
}

// ฟังก์ชันใหม่! สำหรับดึงข้อมูลการเช็คชื่อของวันที่เลือกมาแสดงบนปุ่ม
async function loadAttendanceForSelectedDate() {
    if(!cid) return;
    const dateStr = document.getElementById('at-date-picker').value;
    if(!dateStr) return;
    
    showL();
    try {
        // ไปดึงข้อมูลการเช็คชื่อของวันนั้นๆ มาจาก Firebase
        const snap = await db.ref(`attendance/${cid}/${dateStr}`).once('value');
        const atRecord = snap.val() || {};
        
        // เคลียร์ปุ่มทั้งหมด แล้วไฮไลท์ปุ่มตามข้อมูลเดิม
        document.querySelectorAll('.at-group').forEach(group => {
            // ลบแถบสีสถานะเก่าออกให้หมดก่อน
            group.querySelectorAll('.at-btn').forEach(b => b.classList.remove('active'));
            
            const sid = group.dataset.sid;
            // ถ้าเด็กคนนี้เคยถูกเช็คชื่อไว้แล้ว ให้ไฮไลท์ปุ่มนั้น
            if (atRecord[sid]) {
                const btn = group.querySelector(`.at-btn[data-val="${atRecord[sid]}"]`);
                if (btn) btn.classList.add('active');
            }
        });
        
        hideL();
    } catch(e) {
        handleFail(e);
    }
}

// ==========================================
// 📅 บันทึกการเช็คชื่อ (แก้บั๊กป้ายแจ้งเตือนค้าง)
// ==========================================
async function submitAt() {
  const dateStr = document.getElementById('at-date-picker').value;
  if(!dateStr) return showT('กรุณาเลือกวันที่ก่อนบันทึก', true);
  if(!cid) return showT('ไม่พบรหัสห้องเรียน', true);

  showL();
  try {
    // 💡 1. ฝังรหัสลับ _recorded ป้องกันฐานข้อมูลลบวันนั้นทิ้ง กรณีครูไม่ได้คลิกปุ่มอะไรเลย
    let atRecord = { _recorded: true };
    document.querySelectorAll('.at-group').forEach(group => {
      const sid = group.dataset.sid;
      const activeBtn = group.querySelector('.at-btn.active');
      if(activeBtn) atRecord[sid] = activeBtn.dataset.val;
    });

    // บันทึกลงฐานข้อมูล
    await db.ref(`attendance/${cid}/${dateStr}`).set(atRecord);
    hideL();
    
    // 💡 2. สั่งรีเฟรชหน้าห้องเรียน (Dashboard) แบบเนียนๆ อยู่เบื้องหลัง เพื่อเคลียร์ป้ายแดง 🚨 ทิ้งทันที!
    setTimeout(() => { if(typeof loadClasses === 'function') loadClasses(); }, 500);
    
    const titleText = document.getElementById('det-title').innerText;
    const emoji = titleText.split(' ')[0];
    const className = titleText.substring(emoji.length).trim();

    if(typeof Swal !== 'undefined') {
        Swal.fire('สำเร็จ', `บันทึกการเช็คชื่อวันที่ ${dateStr} เรียบร้อย!`, 'success').then(() => {
            openClass(cid, className, emoji); // โหลดหน้าเช็คชื่อซ้ำเพื่อยืนยัน
        });
    } else { 
        showT('บันทึกเช็คชื่อเรียบร้อย'); 
        openClass(cid, className, emoji); 
    }
  } catch(error) { handleFail(error); }
}

async function loadAttendanceReport() {
  if(!cid) return;
  showL();
  try {
    const snap = await db.ref(`attendance/${cid}`).once('value');
    const data = snap.val() || {};
    const dates = Object.keys(data).sort();
    
    if (dates.length === 0) {
       document.getElementById('attendance-detailed-table').innerHTML = '<p style="text-align:center; padding:20px;">ยังไม่มีข้อมูลการเช็คชื่อ</p>';
    } else {
       let html = '<table><thead><tr><th>เลขที่</th><th class="text-left">ชื่อ-นามสกุล</th>';
       dates.forEach(d => {
          const parts = d.split('-'); 
          html += `<th>${parts[2]}/${parts[1]}</th>`;
       });
       html += '</tr></thead><tbody>';

       students.forEach(s => {
          html += `<tr><td>${s.number}</td><td class="text-left">${s.name}</td>`;
          dates.forEach(d => {
             const status = data[d][s.id] || '-';
             let tagHtml = status === '-' ? '-' : `<span class="date-tag tag-${status}" style="margin:0; padding:4px 8px; font-size:0.8rem;">${status}</span>`;
             html += `<td>${tagHtml}</td>`;
          });
          html += '</tr>';
       });
       html += '</tbody></table>';
       document.getElementById('attendance-detailed-table').innerHTML = html;
    }
    switchView('v-attendance-report');
    hideL();
  } catch (e) { handleFail(e); }
}

async function loadAssignmentsView() {
  if(!cid) return;
  showL();
  switchView('v-assign');
  
  try {
    const snap = await db.ref(`assignments/${cid}`).once('value');
    const assignData = snap.val() || {};
    const list = document.getElementById('assign-list');
    
    let html = '';
    const keys = Object.keys(assignData);
    
    if(keys.length === 0) {
      html = '<p style="text-align:center; grid-column:1/-1; padding: 20px;">ยังไม่มีภารกิจ/บทเรียนในห้องนี้</p>';
    } else {
      keys.forEach(assignId => {
        const a = assignData[assignId];
        html += `<div class="card" style="border-left: 5px solid var(--border-blue);">
                  <h3 style="margin-bottom:10px; color:var(--text-blue);">📁 ${a.title}</h3>
                  <p style="font-size:0.9rem; margin-bottom:5px;"><b>คะแนนเต็ม:</b> <span style="color:var(--text-orange); font-weight:bold;">${a.maxScore}</span> แต้ม</p>
                  ${a.indicator ? `<p style="font-size:0.9rem; color:var(--text-muted);">ตัวชี้วัด: ${a.indicator}</p>` : ''}
                  
                  <div style="display:flex; gap:5px; margin-top:15px; flex-wrap:wrap;">
                    <button class="btn btn-primary" style="flex:2; min-width:100px;" onclick="openScoreEditor('${assignId}', '${a.title}', ${a.maxScore})">📝 ให้คะแนน</button>
                    <button class="btn btn-outline" style="flex:1; min-width:70px; color:var(--text-main); border-color:var(--border-color);" onclick="editAssign('${assignId}')">⚙️ แก้ไข</button>
                    <button class="btn btn-red" style="flex:1; min-width:70px;" onclick="deleteAssign('${assignId}')">🗑️ ลบ</button>
                  </div>
                 </div>`;
      });
    }
    list.innerHTML = html;
    hideL();
  } catch (error) { handleFail(error); }
}

async function saveAssign() {
  const title = document.getElementById('at').value.trim();
  const maxScore = document.getElementById('am').value;
  
  if(!title || !maxScore) return showT('กรุณากรอกชื่อภารกิจและคะแนนเต็มให้ครบ', true);
  if(!cid) return;

  showL();
  try {
    await db.ref(`assignments/${cid}`).push({
      title: title, maxScore: parseFloat(maxScore),
      indicator: document.getElementById('a-ind').value,
      dol: document.getElementById('a-comp').value,
      youtube: document.getElementById('a-yt').value,
      doc: document.getElementById('a-doc').value,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    closeModal('m-assign');
    document.getElementById('at').value = ''; document.getElementById('am').value = ''; document.getElementById('a-ind').value = '';
    
    hideL(); showT('สร้างภารกิจสำเร็จ!'); loadAssignmentsView(); 
  } catch (error) { handleFail(error); }
}

function deleteAssign(aid) {
  if(confirm('คุณแน่ใจหรือไม่ว่าจะลบภารกิจนี้?')) {
    showL();
    db.ref(`assignments/${cid}/${aid}`).remove()
      .then(() => { hideL(); showT('ลบภารกิจสำเร็จ'); loadAssignmentsView(); })
      .catch(handleFail);
  }
}

// ==========================================
// 💡 เพิ่ม 2 ฟังก์ชันใหม่ สำหรับเปิดหน้าต่างแก้ไข และ บันทึกการแก้ไข
// ==========================================
async function editAssign(aid) {
    showL();
    try {
        const snap = await db.ref(`assignments/${cid}/${aid}`).once('value');
        const a = snap.val();
        if (!a) { hideL(); return showT('ไม่พบข้อมูลภารกิจ', true); }

        // ดึงข้อมูลเดิมมาแสดงในช่องกรอก
        document.getElementById('ea-id').value = aid;
        document.getElementById('ea-title').value = a.title || '';
        document.getElementById('ea-max').value = a.maxScore || '';
        document.getElementById('ea-ind').value = a.indicator || '';
        document.getElementById('ea-comp').value = a.dol || '';
        document.getElementById('ea-yt').value = a.youtube || '';
        document.getElementById('ea-doc').value = a.doc || '';

        hideL();
        openModal('m-edit-assign'); // เปิดหน้าต่างแก้ไข
    } catch (e) { handleFail(e); }
}

async function saveEditAssign() {
    const aid = document.getElementById('ea-id').value;
    const title = document.getElementById('ea-title').value.trim();
    const maxScore = document.getElementById('ea-max').value;

    if(!title || !maxScore) return showT('กรุณากรอกชื่อภารกิจและคะแนนเต็มให้ครบ', true);
    if(!cid || !aid) return;

    showL();
    try {
        // อัปเดตข้อมูลใหม่ลงฐานข้อมูล
        await db.ref(`assignments/${cid}/${aid}`).update({
            title: title,
            maxScore: parseFloat(maxScore),
            indicator: document.getElementById('ea-ind').value,
            dol: document.getElementById('ea-comp').value,
            youtube: document.getElementById('ea-yt').value,
            doc: document.getElementById('ea-doc').value
        });

        closeModal('m-edit-assign');
        hideL();
        showT('แก้ไขภารกิจสำเร็จ!');
        loadAssignmentsView(); // โหลดหน้าใหม่
    } catch (error) { handleFail(error); }
}

async function openScoreEditor(assignId, title, maxScore) {
  showL();
  aid = assignId; 
  document.getElementById('score-title').innerText = `คะแนน: ${title} (เต็ม ${maxScore})`;

  try {
    const [scoreSnap, subSnap, fbSnap] = await Promise.all([
      db.ref(`scores/${aid}`).once('value'),
      db.ref(`submissions/${cid}/${aid}`).once('value'),
      db.ref(`feedbacks/${aid}`).once('value')
    ]);

    const scoreData = scoreSnap.val() || {};
    const subData = subSnap.val() || {}; // ข้อมูลไฟล์งานของเด็กทั้งห้องในภารกิจนี้
    const fbData = fbSnap.val() || {}; // ข้อมูลคอมเมนต์จากครู

    // เพิ่มคอลัมน์ "สถานะการส่งงาน" ในตาราง
    let html = '<table><thead><tr><th>เลขที่</th><th class="text-left">ชื่อ-นามสกุล</th><th>สถานะการส่งงาน</th><th>คะแนน & คอมเมนต์</th></tr></thead><tbody>';
    
    students.forEach(s => {
      const currentScore = scoreData[s.id] !== undefined ? scoreData[s.id] : '';
      const currentFb = fbData[s.id] || '';
      const submission = subData[s.id]; // ตรวจสอบว่าเด็กคนนี้ส่งงานนี้หรือยัง

      let workStatusHtml = '<span style="color:var(--text-red); font-size:0.85rem; font-weight:bold;">❌ ยังไม่ส่ง</span>';
      
      // ถ้ามีข้อมูลการส่งงาน
      if (submission) {
        workStatusHtml = `
          <div style="display:flex; flex-direction:column; gap:5px; align-items:center;">
            <span style="background:var(--bg-green); color:var(--text-green); padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">✅ ส่งงานแล้ว</span>
            <div style="display:flex; gap:5px;">
              <a href="${submission.url}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none; font-size:0.75rem; padding:4px 8px;">👀 ตรวจงาน</a>
              <button class="btn btn-red btn-sm" style="font-size:0.75rem; padding:4px 8px;" onclick="deleteSubmission('${aid}', '${s.id}', '${s.name}')">🗑️ ลบงาน</button>
            </div>
          </div>
        `;
      }

      html += `<tr>
                <td>${s.number}</td>
                <td class="text-left">${s.name}</td>
                <td style="min-width: 120px;" id="sub-status-${s.id}">${workStatusHtml}</td>
                <td>
                  <div style="display:flex; flex-direction:column; gap:5px; align-items:center;">
                    <input type="number" id="score-input-${s.id}" value="${currentScore}" min="0" max="${maxScore}" placeholder="คะแนน" style="width:80px; text-align:center; padding:8px; font-weight:bold; color:var(--primary); border: 2px solid var(--border-color); border-radius: 8px;">
                    <input type="text" id="fb-input-${s.id}" value="${currentFb}" placeholder="เพิ่มคอมเมนต์..." style="width:140px; padding:6px; font-size:0.8rem; border-radius:6px; border:1px solid #ccc; text-align:center;">
                  </div>
                </td>
              </tr>`;
    });
    html += '</tbody></table>';
    
    const scoreTable = document.getElementById('score-table');
    scoreTable.innerHTML = html;
    scoreTable.dataset.max = maxScore;
    scoreTable.dataset.title = title; // เก็บชื่อภารกิจไว้ใช้ตอนรีเฟรชหน้าต่าง

    // ======== 💡 อัปเดตสถานะส่งงานแบบ Realtime โดยไม่รีเฟรชทั้งหน้า ========
    if (window.currentSubmissionListener) {
       db.ref(window.currentSubmissionListener.path).off('value', window.currentSubmissionListener.cb);
    }
    const subRef = db.ref(`submissions/${cid}/${aid}`);
    const cb = snap => {
       const subData = snap.val() || {};
       students.forEach(s => {
          const submission = subData[s.id];
          const td = document.getElementById(`sub-status-${s.id}`);
          if (td) {
             let statusHtml = '<span style="color:var(--text-red); font-size:0.85rem; font-weight:bold;">❌ ยังไม่ส่ง</span>';
             if (submission) {
               statusHtml = `
                 <div style="display:flex; flex-direction:column; gap:5px; align-items:center;">
                   <span style="background:var(--bg-green); color:var(--text-green); padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">✅ ส่งงานแล้ว</span>
                   <div style="display:flex; gap:5px;">
                     <a href="${submission.url}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none; font-size:0.75rem; padding:4px 8px;">👀 ตรวจงาน</a>
                     <button class="btn btn-red btn-sm" style="font-size:0.75rem; padding:4px 8px;" onclick="deleteSubmission('${aid}', '${s.id}', '${s.name}')">🗑️ ลบงาน</button>
                   </div>
                 </div>
               `;
             }
             if(td.innerHTML !== statusHtml) td.innerHTML = statusHtml;
          }
       });
    };
    subRef.on('value', cb);
    window.currentSubmissionListener = { path: `submissions/${cid}/${aid}`, cb };
    // =========================================================================

    const btnSubmit = document.querySelector('#v-scores .btn-primary');
    if(btnSubmit) btnSubmit.style.display = 'block';

    hideL(); switchView('v-scores');
  } catch (e) { handleFail(e); }
}

async function viewExamScores(eid, title) {
  showL();
  document.getElementById('score-title').innerText = `คะแนนสอบ: ${title}`;
  try {
    const [exSnap, subSnap, stSnap] = await Promise.all([
      db.ref(`exams/${cid}/${eid}`).once('value'),
      db.ref(`exam_submissions/${cid}/${eid}`).once('value'),
      db.ref(`students/${cid}`).once('value')
    ]);
    const exam = exSnap.val() || {};
    const subs = subSnap.val() || {};
    const students = stSnap.val() || {};
    
    let maxScore = 0;
    if(exam.questions) exam.questions.forEach(q => maxScore += (parseFloat(q.score) || 1));

    let html = '<table><thead><tr><th>เลขที่</th><th class="text-left">ชื่อ-นามสกุล</th><th>สถานะ</th><th>คะแนนที่ได้</th></tr></thead><tbody>';
    
    const studentList = Object.keys(students).map(id => ({id, ...students[id]})).sort((a,b) => a.number - b.number);
    
    studentList.forEach(s => {
      const sub = subs[s.id];
      if (sub) {
        html += `<tr>
                  <td>${s.number}</td>
                  <td class="text-left">${s.name}</td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:5px; align-items:center;">
                      <span style="background:var(--bg-green); color:var(--text-green); padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">✅ สอบแล้ว</span>
                      <div style="display:flex; gap:5px; margin-top:5px;">
                        <button class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:4px 8px;" onclick="viewExamAnswers('${eid}', '${s.id}', '${s.name}')">👀 ดูคำตอบ</button>
                        <button class="btn btn-red btn-sm" style="font-size:0.75rem; padding:4px 8px;" onclick="resetExamSubmission('${eid}', '${s.id}', '${s.name}')">🔄 ลบสอบใหม่</button>
                      </div>
                    </div>
                  </td>
                  <td><span style="font-weight:bold; color:var(--primary);">${sub.score} / ${maxScore}</span></td>
                </tr>`;
      } else {
        html += `<tr><td>${s.number}</td><td class="text-left">${s.name}</td><td><span style="color:var(--text-red); font-size:0.85rem; font-weight:bold;">❌ ยังไม่สอบ</span></td><td>-</td></tr>`;
      }
    });
    
    html += '</tbody></table>';
    
    const scoreTable = document.getElementById('score-table');
    scoreTable.innerHTML = html;
    
    const btnSubmit = document.querySelector('#v-scores .btn-primary');
    if(btnSubmit) btnSubmit.style.display = 'none';
    
    hideL(); switchView('v-scores');
  } catch(e) { handleFail(e); }
}

async function resetExamSubmission(eid, sid, studentName) {
    if(!confirm(`ต้องการลบผลการสอบของ "${studentName}" เพื่อให้สอบใหม่ใช่หรือไม่?`)) return;
    showL();
    try {
        await db.ref(`exam_submissions/${cid}/${eid}/${sid}`).remove();
        hideL();
        showT('ลบผลการสอบเรียบร้อย เด็กสามารถเข้าสอบใหม่ได้แล้ว');
        const titleText = document.getElementById('score-title').innerText.replace('คะแนนสอบ: ', '');
        viewExamScores(eid, titleText);
    } catch(e) { handleFail(e); }
}

async function viewExamAnswers(eid, sid, studentName) {
    showL();
    try {
        const [exSnap, subSnap] = await Promise.all([
            db.ref(`exams/${cid}/${eid}`).once('value'),
            db.ref(`exam_submissions/${cid}/${eid}/${sid}`).once('value')
        ]);
        const exam = exSnap.val() || {};
        const sub = subSnap.val() || {};
        
        let html = `<div style="margin-bottom:15px;"><h3 style="margin:0; color:var(--primary);">กระดาษคำตอบ: ${studentName}</h3><p style="margin:5px 0 0 0; color:var(--text-muted);">แบบทดสอบ: ${exam.title || 'ไม่ระบุ'}</p></div>`;
        html += `<div style="display:flex; flex-direction:column; gap:10px;">`;
        
        if (exam.questions && sub.answers) {
            exam.questions.forEach((q, idx) => {
                const studentAns = sub.answers[idx] || '-';
                const correctAns = q.correct;
                const isCorrect = studentAns === correctAns;
                
                html += `
                <div class="card" style="border-left:5px solid ${isCorrect ? 'var(--bg-green)' : 'var(--text-red)'}; padding:15px; text-align:left;">
                    <div style="font-weight:bold; margin-bottom:10px;">ข้อ ${idx+1}. ${q.q}</div>
                    <div style="font-size:0.9rem; margin-bottom:5px;">
                        <span style="color:var(--text-muted);">ตอบ:</span> 
                        <span style="color:${isCorrect ? 'var(--text-green)' : 'var(--text-red)'}; font-weight:bold;">${studentAns}</span>
                        ${isCorrect ? '✅' : '❌'}
                    </div>
                    <div style="font-size:0.9rem;">
                        <span style="color:var(--text-muted);">เฉลยที่ถูกต้อง:</span> 
                        <span style="color:var(--text-main); font-weight:bold;">${correctAns}</span>
                    </div>
                </div>`;
            });
        } else {
            html += `<p style="text-align:center;">ไม่มีข้อมูลคำตอบ</p>`;
        }
        
        html += `</div>`;
        
        document.getElementById('ea-modal-body').innerHTML = html;
        openModal('m-exam-answers');
        hideL();
    } catch(e) { handleFail(e); }
}

async function submitScores() {
  if (!aid) return showT('ไม่พบรหัสภารกิจ', true);
  const maxScore = parseFloat(document.getElementById('score-table').dataset.max);

  showL();
  let updates = {}; let hasError = false;

  students.forEach(s => {
    const inputVal = document.getElementById(`score-input-${s.id}`).value;
    if (inputVal !== '') {
      const score = parseFloat(inputVal);
      if (score > maxScore || score < 0) hasError = true;
      else updates[s.id] = score;
    }
  });

  if (hasError) { hideL(); return showT(`กรุณากรอกคะแนนให้อยู่ระหว่าง 0 ถึง ${maxScore}`, true); }

  try {
    // บันทึกลงฐานข้อมูล
    await db.ref(`scores/${aid}`).set(updates);
    hideL();
    
    // 🎯 เคล็ดลับ: ดึงชื่อห้องและอีโมจิ เพื่อสั่งให้ระบบโหลดตารางใหม่ทันที!
    const titleText = document.getElementById('det-title').innerText;
    const emoji = titleText.split(' ')[0];
    const className = titleText.substring(emoji.length).trim();

    if(typeof Swal !== 'undefined') {
        Swal.fire('สำเร็จ', 'บันทึกคะแนนเรียบร้อยแล้ว!', 'success').then(() => {
            openClass(cid, className, emoji); // โหลดใหม่ทันทีแบบเนียนๆ
        });
    } else { 
        showT('บันทึกคะแนนเรียบร้อย');
        openClass(cid, className, emoji); 
    }
  } catch (e) { handleFail(e); }
}

function openSeatingChart() {
  switchView('v-seating-chart');
  const pool = document.getElementById('unassigned-pool');
  const grid = document.getElementById('seat-grid');
  
  pool.innerHTML = ''; grid.innerHTML = '';

  for(let i = 1; i <= 30; i++) {
    grid.innerHTML += `<div class="seat-slot" id="seat-pos-${i}" ondrop="drop(event)" ondragover="allowDrop(event)">
                         <span style="position:absolute; top:5px; left:5px; opacity:0.3; font-size:0.8rem;">${i}</span>
                       </div>`;
  }
  students.forEach(s => {
    pool.innerHTML += `<div class="student-drag" draggable="true" ondragstart="drag(event)" id="stu-drag-${s.id}">${s.number}. ${s.name}</div>`;
  });
}
function allowDrop(ev) { ev.preventDefault(); if(ev.target.classList.contains('seat-slot')) ev.target.classList.add('drag-over'); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }
function drop(ev) {
  ev.preventDefault(); ev.target.classList.remove('drag-over');
  let data = ev.dataTransfer.getData("text");
  let draggedEl = document.getElementById(data);
  if(ev.target.classList.contains('seat-slot') || ev.target.classList.contains('unassigned-pool')) ev.target.appendChild(draggedEl);
}
function saveSeatingChartData() { showT('บันทึกแผนผังที่นั่งแล้ว'); }

// ==========================================
// 🤖 ระบบ AI Chat Buddy (คู่หูผจญภัย)
// ==========================================
function toggleBuddyChat() {
  const chatWindow = document.getElementById('buddy-chat-window');
  if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
    chatWindow.style.display = 'flex'; 
  } else {
    chatWindow.style.display = 'none'; 
  }
}

async function sendBuddyMessage() {
  const inputEl = document.getElementById('buddy-input');
  const message = inputEl.value.trim();
  
  if (!message) return;

  const chatHistory = document.getElementById('buddy-chat-history');
  
  const userMsgHtml = `<div style="background: #e2e8f0; color: var(--text-main); padding: 8px; border-radius: 10px; align-self: flex-end; max-width: 80%; margin-bottom: 5px;">${message}</div>`;
  chatHistory.insertAdjacentHTML('beforeend', userMsgHtml);
  
  inputEl.value = '';
  chatHistory.scrollTop = chatHistory.scrollHeight;

  const typingId = 'typing-' + Date.now();
  const typingHtml = `<div id="${typingId}" style="background: var(--primary); color: white; padding: 8px; border-radius: 10px; align-self: flex-start; max-width: 80%; opacity: 0.7; margin-bottom: 5px;">กำลังพิมพ์... ⏳</div>`;
  chatHistory.insertAdjacentHTML('beforeend', typingHtml);
  chatHistory.scrollTop = chatHistory.scrollHeight;

  try {
    const systemPrompt = `คุณคือ 'คู่หูผจญภัย' ในระบบ LMS Hero Edition หน้าที่ของคุณคือเป็นผู้ช่วยระดมสมองและชี้แนะนักเรียนประถม 
    กฎเหล็กของคุณคือ:
    1. ห้ามบอกคำตอบของใบงานหรือเขียนโค้ดให้ตรงๆ เด็ดขาด
    2. ให้ใช้วิธีตั้งคำถามกลับเพื่อให้ฮีโร่ (นักเรียน) ได้คิดวิเคราะห์เอง
    3. ใช้ภาษาที่เป็นมิตร สดใส ให้กำลังใจ และเรียกนักเรียนว่า "ฮีโร่"`;

    const promptText = `${systemPrompt}\n\nข้อความจากฮีโร่: ${message}`;

    // TODO: เรียก AI จาก Backend แทน
    document.getElementById(typingId).remove();
    chatHistory.insertAdjacentHTML('beforeend', `<div class="chat-msg chat-bot" style="background:#fee2e2; color:#ef4444;">ขออภัยฮีโร่! ตอนนี้ระบบผู้ช่วยกำลังปรับปรุงความปลอดภัยอยู่จ้า 🛠️</div>`);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return;

    const data = await response.json();
    document.getElementById(typingId).remove();

    if (!response.ok) { 
      throw new Error(data.error ? data.error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ"); 
    }

    const reply = data.candidates[0].content.parts[0].text;
    const formattedReply = reply.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    
    const aiMsgHtml = `<div style="background: var(--primary); color: white; padding: 8px; border-radius: 10px; align-self: flex-start; max-width: 80%; line-height: 1.5; margin-bottom: 5px;">${formattedReply}</div>`;
    chatHistory.insertAdjacentHTML('beforeend', aiMsgHtml);

  } catch (error) {
    console.error("Chat API Error:", error);
    if(document.getElementById(typingId)) document.getElementById(typingId).remove();
    const errorMsgHtml = `<div style="background: var(--bg-red); color: var(--text-red); padding: 8px; border-radius: 10px; align-self: flex-start; max-width: 80%; margin-bottom: 5px;">❌ ขออภัยครับ พลังเวทมนตร์ขัดข้อง กรุณาลองใหม่อีกครั้งนะครับ</div>`;
    chatHistory.insertAdjacentHTML('beforeend', errorMsgHtml);
  }
  
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function acceptCookies() {
    localStorage.setItem('lms_cookie_consent', 'true');
    if (document.getElementById('cookie-consent')) {
        document.getElementById('cookie-consent').style.display = 'none';
    }
}

// ==========================================
// 🚀 16. รันคำสั่งอัตโนมัติตอนเปิดเว็บ (Auto Load)
// ==========================================
(function initSystem() {
  db.ref('settings').once('value').then(snap => {
    const s = snap.val();
    if (s) {
      if (s.logoUrl) {
        const lobbyLogo = document.getElementById('main-lobby-logo');
        const adminLogo = document.getElementById('admin-logo-preview');
        if (lobbyLogo) lobbyLogo.src = s.logoUrl;
        if (adminLogo) adminLogo.src = s.logoUrl;
      }
      if (s.lobbyTitle) {
        const titleEl = document.getElementById('main-lobby-title');
        const adminTitleEl = document.getElementById('admin-lobby-title');
        if (titleEl) titleEl.innerText = s.lobbyTitle;
        if (adminTitleEl) adminTitleEl.value = s.lobbyTitle;
      }
      if (s.primaryColor) {
        document.documentElement.style.setProperty('--primary', s.primaryColor);
        const colorPicker = document.getElementById('admin-primary-color');
        if (colorPicker) colorPicker.value = s.primaryColor;
      }
    }
  });

  if (localStorage.getItem('lms-theme') === 'dark') { 
    document.body.classList.add('dark-mode'); 
    const btn = document.getElementById('theme-toggle'); 
    if (btn) btn.innerText = '☀️'; 
  }

  // แสดง Cookie Consent Banner ถ้ายังไม่เคยกดยอมรับ
  if (!localStorage.getItem('lms_cookie_consent')) {
      const cc = document.getElementById('cookie-consent');
      if (cc) cc.style.display = 'flex';
  }

  // เช็ค Auto Login สำหรับนักเรียน
  const savedStudentQuery = localStorage.getItem('lms_student_query');
  const savedStudentIsSid = localStorage.getItem('lms_student_isSid') === 'true';
  if (savedStudentQuery) {
      setTimeout(() => executeSearchStudentData(savedStudentQuery, savedStudentIsSid), 500);
  }

  // เช็ค Auto Login สำหรับครู (Firebase Auth)
  auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser && !savedStudentQuery) {
          try {
              const snap = await db.ref(`users/${firebaseUser.uid}`).once('value');
              const userData = snap.val();
              if (userData) {
                  user = { 
                      status: 'success', 
                      role: userData.role, 
                      name: userData.name, 
                      uid: firebaseUser.uid, 
                      username: firebaseUser.uid 
                  };
                  if(user.role === 'superadmin' || user.role === 'admin') { 
                      if(typeof loadAdminDashboard === 'function') loadAdminDashboard(); 
                      switchView('v-admin'); 
                  } else { 
                      if(typeof loadClasses === 'function') loadClasses();
                      switchView('v-teacher'); 
                  }
              }
          } catch (e) {
              console.error("Auto login teacher failed", e);
          }
      }
  });
  
  if(db) { 
    db.ref('system_settings').once('value').then(snap => { 
      const settings = snap.val(); 
      if(settings) { 
        if(settings.title) document.getElementById('main-lobby-title').innerText = settings.title;
        if(settings.footer && document.getElementById('sys-footer-text')) document.getElementById('sys-footer-text').innerText = settings.footer;
        
        // โหลดชื่อปุ่มจากฐานข้อมูล
        if(settings.btnSearch && document.getElementById('btn-search-text')) document.getElementById('btn-search-text').innerText = settings.btnSearch;
        if(settings.btnStudent && document.getElementById('btn-student-login-text')) document.getElementById('btn-student-login-text').innerText = settings.btnStudent;
        if(settings.btnStaff && document.getElementById('btn-staff-login-text')) document.getElementById('btn-staff-login-text').innerText = settings.btnStaff;
        if(settings.btnCalendar && document.getElementById('btn-calendar-text')) document.getElementById('btn-calendar-text').innerText = settings.btnCalendar;

        if(settings.btnTools && document.getElementById('btn-tools-text')) document.getElementById('btn-tools-text').innerText = settings.btnTools;
        if(settings.btnSeating && document.getElementById('btn-seating-text')) document.getElementById('btn-seating-text').innerText = settings.btnSeating;
        if(settings.btnTimeline && document.getElementById('btn-timeline-text')) document.getElementById('btn-timeline-text').innerText = settings.btnTimeline;
        if(settings.btnAttendance && document.getElementById('btn-attendance-text')) document.getElementById('btn-attendance-text').innerText = settings.btnAttendance;
        if(settings.btnAssignments && document.getElementById('btn-assignments-text')) document.getElementById('btn-assignments-text').innerText = settings.btnAssignments;
        if(settings.btnExams && document.getElementById('btn-exams-text')) document.getElementById('btn-exams-text').innerText = settings.btnExams;

        if(settings.btnExcel && document.getElementById('btn-excel-text')) document.getElementById('btn-excel-text').innerText = settings.btnExcel;
        if(settings.btnCert && document.getElementById('btn-cert-text')) document.getElementById('btn-cert-text').innerText = settings.btnCert;
        if(settings.btnAddStudent && document.getElementById('btn-add-student-text')) document.getElementById('btn-add-student-text').innerText = settings.btnAddStudent;
        if(settings.btnManageStudent && document.getElementById('btn-manage-student-text')) document.getElementById('btn-manage-student-text').innerText = settings.btnManageStudent;
        if(settings.btnHeroPoints && document.getElementById('btn-hero-points-text')) document.getElementById('btn-hero-points-text').innerText = settings.btnHeroPoints;
      } 
    }); 
  }
})();
// ==========================================
// 📷 ระบบเช็คชื่อด้วยการพิมพ์เลขที่ และเปิดกล้อง (สแกนใบหน้า AI จริง)
// ==========================================

function processBarcode(val, el) {
    if (!val) return;
    const student = students.find(s => s.number.toString() === val.trim());
    
    if (student) {
        const group = document.querySelector(`.at-group[data-sid="${student.id}"]`);
        if (group) {
            group.querySelectorAll('.at-btn').forEach(b => b.classList.remove('active'));
            const btnMa = group.querySelector('.at-btn[data-val="มา"]');
            if (btnMa) btnMa.classList.add('active');
            showT(`เช็คชื่อเลขที่ ${val} (${student.name}) เรียบร้อย!`);
        }
    } else { showT(`❌ ไม่พบนักเรียนเลขที่ ${val} ในห้องนี้`, true); }
    
    if(el) { el.value = ''; el.focus(); }
}

// ตัวแปรสำหรับระบบ Face API
let faceModelsLoaded = false;
let currentRegSid = null;
let faceStream = null;
let regVideoStream = null;
let recognitionInterval = null;
let faceMatcher = null;
let lastScannedNumber = null;
let scanTimeout = null;

// โหลดโมเดลสมองกล AI จาก CDN
async function loadFaceModels() {
    if (faceModelsLoaded) return true;
    try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        faceModelsLoaded = true;
        return true;
    } catch (e) {
        console.error("Model load error:", e);
        return false;
    }
}

// ----------------------------------------------------
// ส่วนที่ 1: การลงทะเบียนใบหน้า (Registration)
// ----------------------------------------------------
async function openFaceRegister(sid, name) {
    currentRegSid = sid;
    document.getElementById('face-reg-name').innerText = name;
    document.getElementById('face-reg-status').innerText = 'กำลังเปิดกล้องและโหลด AI... ⏳';
    document.getElementById('face-reg-status').style.color = 'var(--text-orange)';
    document.getElementById('btn-capture-face').disabled = true;
    openModal('m-face-register');

    try {
        regVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById('face-reg-video').srcObject = regVideoStream;

        const loaded = await loadFaceModels();
        if (loaded) {
            document.getElementById('face-reg-status').innerText = '✅ พร้อมแล้ว! มองกล้องแล้วกดบันทึก';
            document.getElementById('face-reg-status').style.color = 'var(--text-green)';
            document.getElementById('btn-capture-face').disabled = false;
        } else {
            document.getElementById('face-reg-status').innerText = '❌ โหลด AI ล้มเหลว';
            document.getElementById('face-reg-status').style.color = 'var(--text-red)';
        }
    } catch (err) {
        document.getElementById('face-reg-status').innerText = '❌ ไม่สามารถเข้าถึงกล้องได้';
    }
}

function closeFaceRegister() {
    if (regVideoStream) {
        regVideoStream.getTracks().forEach(track => track.stop());
        regVideoStream = null;
    }
    closeModal('m-face-register');
}

async function captureAndSaveFace() {
    const video = document.getElementById('face-reg-video');
    document.getElementById('face-reg-status').innerText = 'กำลังสแกนใบหน้า... อย่านิ่งๆ นะครับ 🤖';
    document.getElementById('face-reg-status').style.color = 'var(--primary)';
    document.getElementById('btn-capture-face').disabled = true;

    // ตรวจจับใบหน้าและดึงลายนิ้วมือใบหน้า (Descriptor)
    const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

    if (!detection) {
        document.getElementById('face-reg-status').innerText = '❌ ไม่พบใบหน้า หรือหน้าไม่ชัด กรุณาลองใหม่';
        document.getElementById('face-reg-status').style.color = 'var(--text-red)';
        document.getElementById('btn-capture-face').disabled = false;
        return;
    }

    // บันทึกลง Firebase
    const descriptorArray = Array.from(detection.descriptor);
    showL();
    try {
        await db.ref(`students/${cid}/${currentRegSid}`).update({
            hasFaceData: true,
            faceDescriptor: descriptorArray
        });
        
        // อัปเดตข้อมูลในตัวแปรทันที
        const st = students.find(s => s.id === currentRegSid);
        if(st) { st.hasFaceData = true; st.faceDescriptor = descriptorArray; }

        hideL();
        closeFaceRegister();
        showT('บันทึกข้อมูลใบหน้าสำเร็จ! 📸');
        openBulkEditStudents(); // รีเฟรชตาราง
    } catch(e) { handleFail(e); }
}

// ----------------------------------------------------
// ส่วนที่ 2: การสแกนเข้าเรียน (Recognition)
// ----------------------------------------------------
async function startFaceScanner() {
    const video = document.getElementById('face-video');
    const container = document.getElementById('face-scanner-container');
    const btnStart = document.getElementById('btn-start-face');

    showL();
    const loaded = await loadFaceModels();
    if(!loaded) { hideL(); return showT('โหลดสมองกล AI ล้มเหลว', true); }

    // เตรียมข้อมูลใบหน้าที่เคยบันทึกไว้ในห้องนี้
    const labeledDescriptors = [];
    students.forEach(s => {
        if(s.hasFaceData && s.faceDescriptor) {
            // แปลง Array กลับเป็น Float32Array ที่ AI รู้จัก
            const desc = new Float32Array(s.faceDescriptor);
            // ผูกตัวเลขใบหน้าเข้ากับ "เลขที่" ของนักเรียน
            labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(s.number.toString(), [desc]));
        }
    });

    if(labeledDescriptors.length === 0) {
        hideL();
        return showT('ยังไม่มีนักเรียนคนไหนบันทึกใบหน้าเลย! (ไปที่เมนูจัดการ นร. ก่อนครับ)', true);
    }

    // สร้างตัวเปรียบเทียบ (0.5 คือความเข้มงวด ยิ่งน้อยยิ่งต้องเป๊ะ)
    faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);

    try {
        faceStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = faceStream;

        container.style.display = 'block';
        btnStart.style.display = 'none';

        video.onplay = () => {
            hideL();
            showT('📸 ระบบพร้อมสแกนแล้ว! ให้นักเรียนมองกล้องได้เลย');
            
            // วนลูปสแกนทุกๆ 1 วินาที
            recognitionInterval = setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
                if(detections.length > 0) {
                    detections.forEach(det => {
                        const bestMatch = faceMatcher.findBestMatch(det.descriptor);
                        // ถ้าเจอคนที่ความเหมือนผ่านเกณฑ์
                        if(bestMatch.label !== 'unknown') {
                            processFaceDetection(bestMatch.label);
                        }
                    });
                }
            }, 1000);
        };
    } catch (err) {
        hideL(); showT('ไม่สามารถเข้าถึงกล้องได้', true);
    }
}

function processFaceDetection(numberStr) {
    // กันไม่ให้ระบบเช็คชื่อคนเดิมซ้ำๆ รัวๆ
    if(lastScannedNumber === numberStr) return; 

    lastScannedNumber = numberStr;
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => { lastScannedNumber = null; }, 5000); // พัก 5 วินาทีก่อนสแกนคนเดิมซ้ำได้

    processBarcode(numberStr, null);
}

function stopFaceScanner() {
    const container = document.getElementById('face-scanner-container');
    const btnStart = document.getElementById('btn-start-face');
    
    if (faceStream) {
        faceStream.getTracks().forEach(track => track.stop());
        faceStream = null;
    }
    if (recognitionInterval) {
        clearInterval(recognitionInterval);
    }
    
    container.style.display = 'none';
    btnStart.style.display = 'block';
}

function simulateFaceDetect() {
    const unassigned = students.filter(s => {
        const group = document.querySelector(`.at-group[data-sid="${s.id}"]`);
        return group && !group.querySelector('.at-btn.active');
    });

    if (unassigned.length > 0) {
        const randomStudent = unassigned[Math.floor(Math.random() * unassigned.length)];
        processBarcode(randomStudent.number.toString(), document.getElementById('barcode-scanner'));
        showT(`🤖 AI (จำลอง) สแกนพบ: ${randomStudent.name}`);
    } else { showT('นักเรียนทุกคนถูกเช็คชื่อหมดแล้ว!', true); }
}
// ฟังก์ชันใหม่: สำหรับให้ครูลบงานที่เด็กส่งมาผิด เพื่อให้เด็กส่งใหม่ได้
async function deleteSubmission(assignId, studentId, studentName) {
  if(!confirm(`🚨 คุณแน่ใจหรือไม่ที่จะลบไฟล์งานของ "${studentName}" ?\n\n(เมื่อลบแล้ว สถานะของนักเรียนจะกลับเป็น "ยังไม่ส่ง" และนักเรียนสามารถอัปโหลดไฟล์ส่งใหม่ได้)`)) {
    return;
  }

  showL();
  try {
    // ลบข้อมูลลิงก์ไฟล์ออกจากฐานข้อมูล submissions ของภารกิจนี้
    await db.ref(`submissions/${cid}/${assignId}/${studentId}`).remove();
    
    hideL();
    showT(`ลบงานของ ${studentName} เรียบร้อยแล้ว`);
    
    // โหลดหน้าต่างให้คะแนนใหม่ เพื่ออัปเดตสถานะปุ่มต่างๆ แบบ Real-time
    const maxScore = document.getElementById('score-table').dataset.max;
    const title = document.getElementById('score-table').dataset.title;
    openScoreEditor(assignId, title, maxScore);
    
  } catch (error) {
    handleFail(error);
  }
}
// ==========================================
// 🩹 ฟังก์ชันที่หายไป (กู้คืนระบบเปลี่ยนไอคอน & เพิ่มนักเรียน)
// ==========================================

// ฟังก์ชันสำหรับเปลี่ยนไอคอนห้องเรียน
function setEmoji(inputId, emoji) { 
    const inputEl = document.getElementById(inputId);
    if (inputEl) {
        inputEl.value = emoji; 
        // ลูกเล่นกระพริบสีเขียวเพื่อให้รู้ว่ากดเปลี่ยนไอคอนติดแล้ว
        inputEl.style.backgroundColor = '#d1fae5';
        setTimeout(() => inputEl.style.backgroundColor = 'var(--bg)', 300);
    }
}

// ฟังก์ชันสำหรับหน้าต่างเพิ่มนักเรียน 1 คน
function saveSingleStudent() { 
    showT('กรุณาใช้ปุ่ม "+ เพิ่ม นร. Excel" จะสะดวกและไวกว่าครับ'); 
    closeModal('m-add-single-stud'); 
}

// ฟังก์ชันสำหรับหน้าต่างแก้ไขนักเรียน
function saveEditStudent() {
    showT('กรุณาใช้ปุ่ม "📝 จัดการ นร." จะสะดวกกว่าครับ'); 
    closeModal('m-edit-student');
}
// ==========================================
// 🌟 ระบบให้รางวัล / หักคะแนน (แบบแก้ไขรายการและคะแนนได้ 100%)
// ==========================================

const defaultRewards = [
    { desc: 'มาตรงเวลาและพร้อมเรียน', pts: 5 },
    { desc: 'มีทัศนคติเชิงบวกและขยัน', pts: 5 },
    { desc: 'ตอบคำถามเมื่อถูกเรียก', pts: 5 },
    { desc: 'ช่วยเหลือเพื่อน / ครู', pts: 5 },
    { desc: 'ตั้งใจฟังในขณะที่คนอื่นพูด', pts: 5 }
];

const defaultPenalties = [
    { desc: 'คุยเสียงดังรบกวนเพื่อน', pts: -5 },
    { desc: 'มาสาย', pts: -10 },
    { desc: 'ไม่ส่งงานตามกำหนด', pts: -10 },
    { desc: 'เล่นโทรศัพท์ในเวลาเรียน', pts: -10 }
];

async function openRewardModal(sid, type) {
    const student = students.find(s => s.id === sid);
    if (!student) return;

    document.getElementById('reward-target-sid').value = sid;
    document.getElementById('reward-type').value = type;
    document.getElementById('reward-target-name').innerText = `นักเรียน: ${student.name} (เลขที่ ${student.number})`;
    
    const titleEl = document.getElementById('reward-modal-title');
    titleEl.innerText = type === 'reward' ? '🌟 เลือกรางวัล' : '💥 ใช้พลัง (หักแต้ม)';
    titleEl.style.color = type === 'reward' ? '#10b981' : '#3b82f6';
    
    document.getElementById('custom-reward-desc').value = '';
    document.getElementById('custom-reward-pts').value = type === 'reward' ? '10' : '-10';

    showL();
    try {
        const snap = await db.ref(`classrooms/${cid}/rewardTemplates/${type}`).once('value');
        let customItems = snap.val();
        
        if (customItems === null) {
            const defaults = type === 'reward' ? defaultRewards : defaultPenalties;
            customItems = {};
            for (let i = 0; i < defaults.length; i++) {
                const newRef = db.ref(`classrooms/${cid}/rewardTemplates/${type}`).push();
                await newRef.set({ desc: defaults[i].desc, pts: defaults[i].pts });
                customItems[newRef.key] = { desc: defaults[i].desc, pts: defaults[i].pts };
            }
        }

        let items = [];
        Object.keys(customItems).forEach(key => {
            items.push({ id: key, desc: customItems[key].desc, pts: customItems[key].pts });
        });

        renderRewardList(items, type);
        hideL();
        openModal('m-reward-picker');
    } catch (e) { handleFail(e); }
}

function renderRewardList(items, type) {
    const list = document.getElementById('reward-list');
    let html = '';

    items.forEach(item => {
        const displayPts = type === 'reward' ? `+${item.pts}` : `${item.pts}`;
        const ptsColor = type === 'reward' ? '#10b981' : '#ef4444';
        
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:10px; cursor:pointer; transition:0.2s;" 
             onclick="applyReward('${item.desc}', ${item.pts})"
             onmouseover="this.style.borderColor='${ptsColor}'; this.style.transform='translateY(-2px)';" 
             onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='translateY(0)';">
            <span style="font-weight:600; color:var(--text-main); font-size:0.95rem;">${item.desc}</span>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold; color:${ptsColor}; font-size:1.1rem; margin-right: 10px;">${displayPts}</span>
                <button class="btn-sm btn-outline" style="padding:4px 8px; border:none; color:var(--primary);" title="แก้ไขรายการ" onclick="event.stopPropagation(); editCustomReward('${item.id}', '${item.desc}', ${item.pts})">✏️</button>
                <button class="btn-sm btn-outline" style="padding:4px 8px; border:none; color:var(--text-red);" title="ลบรายการ" onclick="event.stopPropagation(); deleteCustomReward('${item.id}')">🗑️</button>
            </div>
        </div>`;
    });
    
    if(items.length === 0) html = '<p style="text-align:center; color:var(--text-muted);">ไม่มีรายการ</p>';
    list.innerHTML = html;
}

async function saveCustomReward() {
    const type = document.getElementById('reward-type').value;
    const desc = document.getElementById('custom-reward-desc').value.trim();
    const pts = parseInt(document.getElementById('custom-reward-pts').value);

    if(!desc || isNaN(pts)) return showT('กรุณากรอกคำอธิบายและคะแนน', true);
    
    showL();
    try {
        await db.ref(`classrooms/${cid}/rewardTemplates/${type}`).push({ desc: desc, pts: pts });
        hideL(); showT('เพิ่มรายการใหม่สำเร็จ');
        openRewardModal(document.getElementById('reward-target-sid').value, type);
    } catch(e) { handleFail(e); }
}

async function editCustomReward(itemId, oldDesc, oldPts) {
    const type = document.getElementById('reward-type').value;
    
    const { value: formValues } = await Swal.fire({
        title: '✏️ แก้ไขรายการ',
        html: `
            <div style="text-align: left; margin-top: 10px;">
                <label style="font-size:0.9rem; font-weight:bold;">คำอธิบาย:</label>
                <input id="swal-edit-desc" class="swal2-input" value="${oldDesc}" style="margin-top: 5px; margin-bottom: 15px;">
                <label style="font-size:0.9rem; font-weight:bold;">คะแนน:</label>
                <input id="swal-edit-pts" type="number" class="swal2-input" value="${oldPts}" style="margin-top: 5px; width: 100%;">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '💾 บันทึก',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            return [
                document.getElementById('swal-edit-desc').value,
                document.getElementById('swal-edit-pts').value
            ]
        }
    });

    if (formValues) {
        const newDesc = formValues[0].trim();
        const newPts = parseInt(formValues[1]);
        if (!newDesc || isNaN(newPts)) return showT('ข้อมูลไม่ถูกต้อง', true);

        showL();
        try {
            await db.ref(`classrooms/${cid}/rewardTemplates/${type}/${itemId}`).update({
                desc: newDesc,
                pts: newPts
            });
            hideL();
            showT('แก้ไขรายการสำเร็จ');
            openRewardModal(document.getElementById('reward-target-sid').value, type);
        } catch(e) { handleFail(e); }
    }
}

async function deleteCustomReward(itemId) {
    if(!confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return;
    const type = document.getElementById('reward-type').value;
    showL();
    try {
        await db.ref(`classrooms/${cid}/rewardTemplates/${type}/${itemId}`).remove();
        hideL();
        openRewardModal(document.getElementById('reward-target-sid').value, type);
    } catch(e) { handleFail(e); }
}

async function applyReward(desc, pts) {
    const sid = document.getElementById('reward-target-sid').value;
    if(!sid) return;

    showL();
    try {
        const sRef = db.ref(`students/${cid}/${sid}/points`);
        const snap = await sRef.once('value');
        let currentPts = snap.val() || 0;
        await sRef.set(currentPts + pts);
        
        const stSnap = await db.ref(`students/${cid}`).once('value');
        students = Object.keys(stSnap.val()||{}).map(id => ({ id, ...stSnap.val()[id] })).sort((a,b) => a.number - b.number);
        
        hideL();
        closeModal('m-reward-picker');
        
        const sign = pts >= 0 ? '+' : '';
        showT(`${sign}${pts} แต้ม: ${desc}`); 
        
        openManageStudents(); 
    } catch(e) { handleFail(e); }
}

// ==========================================
// 📥 ฟังก์ชันนำเข้า/คัดลอกข้อสอบจากห้องอื่น
// ==========================================
async function importExamFromOtherClass() {
    if (!cid) return showT('กรุณาเข้าห้องเรียนก่อนทำรายการ', true);

    showL();
    try {
        const examSnap = await db.ref('exams').once('value');
        const allExams = examSnap.val() || {};
        
        // 💡 แก้ไขบั๊ก: เปลี่ยนจาก classes เป็น classrooms ให้ตรงกับฐานข้อมูลจริง
        const classSnap = await db.ref('classrooms').once('value');
        const classData = classSnap.val() || {};

        let optionsHtml = '';
        
        for (let targetCid in allExams) {
            if (targetCid === cid) continue; 
            
            // 💡 กรองเอาเฉพาะ "ห้องเรียนที่ยังมีอยู่จริง" (ข้ามห้องที่ถูกลบไปแล้ว)
            if (!classData[targetCid]) continue; 
            
            let cName = classData[targetCid].name;
            
            for (let eId in allExams[targetCid]) {
                let ex = allExams[targetCid][eId];
                optionsHtml += `<option value="${targetCid}|${eId}">[ห้อง ${cName}] - ${ex.title}</option>`;
            }
        }

        hideL();

        if (!optionsHtml) {
            return Swal.fire('อ๊ะ!', 'คุณครูยังไม่มีข้อสอบในห้องเรียนอื่นๆ ให้คัดลอกเลยครับ', 'info');
        }

        const { value: selectedExam } = await Swal.fire({
            title: '📥 นำเข้าข้อสอบ',
            html: `<p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:10px;">เลือกชุดข้อสอบจากห้องอื่น เพื่อนำมาใช้ในห้องนี้</p>
                   <select id="swal-exam-select" style="width:100%; padding:10px; border-radius:8px; border:2px solid var(--border-color); outline:none; font-family:inherit;">
                      <option value="">-- คลิกเพื่อเลือกข้อสอบ --</option>
                      ${optionsHtml}
                   </select>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '📦 คัดลอกมาห้องนี้',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const val = document.getElementById('swal-exam-select').value;
                if (!val) Swal.showValidationMessage('กรุณาเลือกชุดข้อสอบที่ต้องการคัดลอกครับ');
                return val;
            }
        });

        if (selectedExam) {
            showL();
            const [sourceCid, sourceEid] = selectedExam.split('|');
            const examToCopy = allExams[sourceCid][sourceEid];
            
            // 💡 นำคำว่า " (คัดลอก)" ออกตามที่คุณครูต้องการ
            examToCopy.updatedAt = firebase.database.ServerValue.TIMESTAMP;
            
            await db.ref(`exams/${cid}`).push(examToCopy);
            
            hideL();
            Swal.fire({
                icon: 'success',
                title: 'คัดลอกสำเร็จ!',
                text: 'ข้อสอบถูกนำเข้ามาในห้องนี้เรียบร้อยแล้วครับ',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                if (typeof loadExamsList === 'function') loadExamsList();
            });
        }

    } catch (e) {
        handleFail(e);
    }
}
// ==========================================
// 📥 ฟังก์ชันนำเข้า/คัดลอก "ภารกิจ (งาน)" จากห้องอื่น
// ==========================================
async function importAssignmentFromOtherClass() {
    if (!cid) return showT('กรุณาเข้าห้องเรียนก่อนทำรายการ', true);

    showL();
    try {
        const assignSnap = await db.ref('assignments').once('value');
        const allAssignments = assignSnap.val() || {};
        
        // 💡 แก้ไขบั๊ก: เปลี่ยนจาก classes เป็น classrooms
        const classSnap = await db.ref('classrooms').once('value');
        const classData = classSnap.val() || {};

        let optionsHtml = '';
        
        for (let targetCid in allAssignments) {
            if (targetCid === cid) continue; 
            
            // 💡 กรองเอาเฉพาะ "ห้องเรียนที่ยังมีอยู่จริง" เท่านั้น
            if (!classData[targetCid]) continue; 
            
            let cName = classData[targetCid].name;
            
            for (let aId in allAssignments[targetCid]) {
                let task = allAssignments[targetCid][aId];
                optionsHtml += `<option value="${targetCid}|${aId}">[ห้อง ${cName}] - ${task.title}</option>`;
            }
        }

        hideL();

        if (!optionsHtml) {
            return Swal.fire('อ๊ะ!', 'คุณครูยังไม่มีภารกิจ/งาน ในห้องเรียนอื่นๆ ให้คัดลอกเลยครับ', 'info');
        }

        const { value: selectedTask } = await Swal.fire({
            title: '📥 นำเข้าภารกิจ (งาน)',
            html: `<p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:10px;">เลือกภารกิจจากห้องอื่น เพื่อนำมามอบหมายในห้องนี้</p>
                   <select id="swal-task-select" style="width:100%; padding:10px; border-radius:8px; border:2px solid var(--border-color); outline:none; font-family:inherit;">
                      <option value="">-- คลิกเพื่อเลือกภารกิจ --</option>
                      ${optionsHtml}
                   </select>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '📦 คัดลอกมาห้องนี้',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const val = document.getElementById('swal-task-select').value;
                if (!val) Swal.showValidationMessage('กรุณาเลือกภารกิจที่ต้องการคัดลอกครับ');
                return val;
            }
        });

        if (selectedTask) {
            showL();
            const [sourceCid, sourceAid] = selectedTask.split('|');
            const taskToCopy = allAssignments[sourceCid][sourceAid];
            
            // 💡 นำคำว่า " (คัดลอก)" ออกตามที่คุณครูต้องการ
            taskToCopy.createdAt = firebase.database.ServerValue.TIMESTAMP; 
            
            await db.ref(`assignments/${cid}`).push(taskToCopy);
            
            hideL();
            Swal.fire({
                icon: 'success',
                title: 'คัดลอกสำเร็จ!',
                text: 'ภารกิจถูกนำเข้ามาในห้องนี้เรียบร้อยแล้วครับ',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                const titleText = document.getElementById('det-title').innerText;
                const emoji = titleText.split(' ')[0];
                const name = titleText.substring(emoji.length).trim();
                openClass(cid, name, emoji); 
            });
        }

    } catch (e) {
        handleFail(e);
    }
}
// ==========================================
// 📅 ระบบตารางสอนกระดานดำ & ลากวาง (Drag & Drop)
// ==========================================

let ttPeriods = 6; 
const ttDays = [
    { name: 'จันทร์', color: '#fca5a5' }, // แดงอ่อน
    { name: 'อังคาร', color: '#fbcfe8' }, // ชมพู
    { name: 'พุธ',    color: '#86efac' }, // เขียว
    { name: 'พฤหัสบดี', color: '#fdba74' }, // ส้ม
    { name: 'ศุกร์',  color: '#93c5fd' }  // ฟ้า
];

async function openTimetable() {
    showL();
    try {
        // 1. โหลดห้องเรียนของครูคนนี้มาทำเป็นป้ายให้ลาก
        const snap = await db.ref('classrooms').once('value');
        const allRooms = snap.val() || {};
        let myClasses = [];
        Object.keys(allRooms).forEach(id => {
            if (allRooms[id].teacher === user.username) {
                myClasses.push({ id, name: allRooms[id].name });
            }
        });

        let poolHtml = '';
        myClasses.forEach(c => {
            poolHtml += `<div class="tt-item tt-template" draggable="true" ondragstart="ttDrag(event)" data-cid="${c.id}" data-name="${c.name}">🏫 ${c.name}</div>`;
        });
        if(myClasses.length === 0) poolHtml = '<p style="color:var(--text-muted);">ยังไม่มีห้องเรียน กรุณาสร้างห้องเรียนก่อนครับ</p>';
        document.getElementById('tt-class-pool').innerHTML = poolHtml;

        // 2. โหลดตารางที่เคยบันทึกไว้
        const ttSnap = await db.ref(`users/${user.uid}/timetable`).once('value');
        const ttData = ttSnap.val() || { periods: 6, schedule: {} };
        ttPeriods = ttData.periods || 6;

        renderTimetableGrid(ttData.schedule || {});
        hideL();
        switchView('v-timetable');
    } catch(e) { handleFail(e); }
}

function renderTimetableGrid(scheduleData) {
    let html = `<div style="display:grid; grid-template-columns: 120px repeat(${ttPeriods}, 1fr); gap:10px;">`;
    
    // แถวหัวข้อ (คาบเรียน)
    html += `<div class="tt-header" style="background:#ef4444; color:white;">วัน / เวลา</div>`;
    for(let i=1; i<=ttPeriods; i++) {
        html += `<div class="tt-header" style="background:#facc15; color:#854d0e;">คาบที่ ${i}</div>`;
    }

    // วาดช่องตารางแต่ละวัน
    ttDays.forEach((day, dIdx) => {
        html += `<div class="tt-header" style="background:${day.color}; color:#333;">วัน${day.name}</div>`;
        for(let p=1; p<=ttPeriods; p++) {
            const slotId = `tt-${dIdx}-${p}`;
            html += `<div class="tt-slot" id="${slotId}" ondrop="ttDrop(event)" ondragover="ttAllowDrop(event)" ondragleave="ttDragLeave(event)">`;
            
            // ใส่ห้องเรียนที่เคยเซฟไว้
            if (scheduleData[slotId]) {
                scheduleData[slotId].forEach(item => {
                    html += `<div class="tt-item" id="tt-item-${Date.now()}-${Math.random()}" draggable="true" ondragstart="ttDrag(event)" data-cid="${item.cid}" data-name="${item.name}">${item.name} <span class="tt-delete" onclick="this.parentElement.remove()">✖</span></div>`;
                });
            }
            html += `</div>`;
        }
    });

    html += `</div>`;
    document.getElementById('tt-board').innerHTML = html;
}

function addTimetablePeriod() {
    let currentSchedule = getTimetableData();
    ttPeriods++;
    renderTimetableGrid(currentSchedule);
}

// --- ฟังก์ชัน Drag & Drop สำหรับตารางสอน ---
function ttDrag(ev) { 
    ev.dataTransfer.setData("text", ev.target.id || ev.target.dataset.name); 
    ev.dataTransfer.setData("isTemplate", ev.target.classList.contains('tt-template')); 
    ev.dataTransfer.setData("cid", ev.target.dataset.cid); 
    ev.dataTransfer.setData("name", ev.target.dataset.name); 
}
function ttAllowDrop(ev) { 
    ev.preventDefault(); 
    let target = ev.target;
    if (target.classList.contains('tt-item')) target = target.parentElement;
    if (target.classList.contains('tt-slot')) target.classList.add('drag-over');
}
function ttDragLeave(ev) {
    if (ev.target.classList.contains('tt-slot')) ev.target.classList.remove('drag-over');
}
function ttDrop(ev) {
    ev.preventDefault();
    let target = ev.target;
    
    // ถ้าปล่อยทับป้ายห้องเรียน ให้เด้งไปเข้าช่องกริดแทน
    if (target.classList.contains('tt-item')) target = target.parentElement; 
    if (target.classList.contains('tt-slot')) target.classList.remove('drag-over');
    if (!target.classList.contains('tt-slot')) return;

    const isTemplate = ev.dataTransfer.getData("isTemplate") === 'true';
    
    if (isTemplate) {
        // โคลนป้ายใหม่ (ทำให้ลากห้องเดิมซ้ำได้หลายคาบ)
        const cid = ev.dataTransfer.getData("cid");
        const name = ev.dataTransfer.getData("name");
        const newId = 'tt-item-' + Date.now();
        const cloneHtml = `<div class="tt-item" id="${newId}" draggable="true" ondragstart="ttDrag(event)" data-cid="${cid}" data-name="${name}">${name} <span class="tt-delete" onclick="this.parentElement.remove()">✖</span></div>`;
        target.insertAdjacentHTML('beforeend', cloneHtml);
    } else {
        // ย้ายป้ายที่มีอยู่แล้วไปช่องอื่น
        const draggedId = ev.dataTransfer.getData("text");
        const draggedEl = document.getElementById(draggedId);
        if (draggedEl) target.appendChild(draggedEl);
    }
}

function getTimetableData() {
    let schedule = {};
    ttDays.forEach((day, dIdx) => {
        for(let p=1; p<=ttPeriods; p++) {
            const slotId = `tt-${dIdx}-${p}`;
            const slot = document.getElementById(slotId);
            if (slot) {
                const items = slot.querySelectorAll('.tt-item');
                if (items.length > 0) {
                    schedule[slotId] = Array.from(items).map(el => ({ cid: el.dataset.cid, name: el.dataset.name }));
                }
            }
        }
    });
    return schedule;
}

async function saveTimetable() {
    showL();
    try {
        const data = { periods: ttPeriods, schedule: getTimetableData() };
        await db.ref(`users/${user.uid}/timetable`).set(data);
        hideL();
        showT('บันทึกตารางสอนกระดานดำสำเร็จ! 💾');
    } catch (e) { handleFail(e); }
}

// 🎯 อัปเกรดฟังก์ชันโหลดห้องเรียนให้ "แจ้งเตือนเช็คชื่อ" จากตารางสอนกระดานดำ!
async function loadClasses() { 
  showL(); 
  try {
    const [snap, ttSnap, atSnap] = await Promise.all([
        db.ref('classrooms').once('value'),
        db.ref(`users/${user.uid}/timetable`).once('value'),
        db.ref('attendance').once('value')
    ]);

    const allRooms = snap.val() || {}; 
    const timetable = ttSnap.val() || { schedule: {} };
    const allAttendance = atSnap.val() || {};
    let rooms = [];
    
    Object.keys(allRooms).forEach(id => {
      if (user.role === 'admin' || user.role === 'superadmin' || allRooms[id].teacher === user.username) { 
        rooms.push({ id: id, ...allRooms[id] }); 
      }
    });
    rooms.sort((a, b) => a.name.localeCompare(b.name, 'th', { numeric: true }));
    
    // หาว่าวันนี้สอนห้องไหนบ้าง (จากตารางสอน)
    const d = new Date();
    let todayIndex = d.getDay() - 1; // 0=จันทร์, 1=อังคาร ... 4=ศุกร์
    const todayDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    let myClassesToday = new Set();
    if (todayIndex >= 0 && todayIndex <= 4) {
        Object.keys(timetable.schedule).forEach(slotId => {
            if (slotId.startsWith(`tt-${todayIndex}-`)) {
                timetable.schedule[slotId].forEach(item => myClassesToday.add(item.cid));
            }
        });
    }

    let pendingClasses = [];
    const list = document.getElementById('class-list'); 
    let html = '';
    
    rooms.forEach(r => {
      let isWarning = false;
      // ถ้าวันนี้มีสอนห้องนี้ และยังไม่ได้เช็คชื่อ -> แจ้งเตือน!
      if (myClassesToday.has(r.id)) {
          const todayRecord = allAttendance[r.id] && allAttendance[r.id][todayDateStr];
          if (!todayRecord) {
              pendingClasses.push(r.name);
              isWarning = true; 
          }
      }

      const borderStyle = isWarning ? 'border: 2px solid var(--border-red); box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);' : 'border: 2px solid var(--border-color);';

      html += `
        <div class="class-card" style="position: relative; padding-bottom: 15px; ${borderStyle}">
          ${isWarning ? `<div style="position:absolute; top:-12px; right:-10px; background:var(--text-red); color:white; padding:6px 12px; border-radius:20px; font-size:0.85rem; font-weight:bold; animation: pulse-alert 1.5s infinite; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">🚨 ลืมเช็คชื่อ!</div>` : ''}
          <div onclick="openClass('${r.id}','${r.name}','${r.emoji}')" style="cursor: pointer; padding-bottom: 15px;">
            <div style="font-size:3.5rem;">${r.emoji || '🏫'}</div>
            <h3 style="margin:0;">${r.name}</h3>
          </div>
          <div style="display:flex; gap:5px; justify-content:center; padding-top: 15px; border-top: 1px dashed var(--border-color); flex-wrap:wrap;">
            <button class="btn-sm btn-outline" onclick="event.stopPropagation(); openEditClass('${r.id}', '${r.name}', '${r.emoji}')">✏️ แก้ไข</button>
            <button class="btn-sm btn-red" onclick="event.stopPropagation(); deleteClass('${r.id}')">🗑️ ลบ</button>
          </div>
        </div>
      `;
    });
    
    list.innerHTML = html || '<p style="text-align:center; grid-column:1/-1;">ไม่มีห้องเรียน</p>'; 

    // ป้ายเตือนใหญ่ด้านบน
    let alertBox = document.getElementById('teacher-alerts-container');
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'teacher-alerts-container';
        list.parentNode.insertBefore(alertBox, list);
    }

    if (pendingClasses.length > 0) {
        alertBox.innerHTML = `
            <div class="card" style="background:var(--bg-red); border-left:6px solid var(--border-red); padding:20px; margin-bottom:25px; display:flex; align-items:center; gap:15px; box-shadow:0 5px 15px rgba(239, 68, 68, 0.2);">
                <span style="font-size:3rem;">⏰</span>
                <div>
                    <h3 style="color:var(--text-red); margin:0 0 5px 0;">แจ้งเตือนงานค้างประจำวัน!</h3>
                    <p style="color:var(--text-red); margin:0; font-size:1.05rem;">ดูจากตารางสอน วันนี้คุณมีสอน แต่ยังไม่ได้เช็คชื่อห้อง: <b style="background:white; padding:2px 8px; border-radius:6px;">${Array.from(new Set(pendingClasses)).join(', ')}</b></p>
                </div>
            </div>
        `;
    } else { alertBox.innerHTML = ''; }
    
    hideL();
  } catch(err) { handleFail(err); }
}
