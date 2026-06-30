// ==========================================
// 🛠️ 10. เครื่องมือครู (Tools - Full Options)
// ==========================================

// --- ระบบ Fullscreen ควบคุมการย่อขยายหน้าจอ ---
function toggleFullScreen(elementId) {
  const el = document.getElementById(elementId);
  if (!document.fullscreenElement) {
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(err => showT(`ไม่สามารถขยายจอได้: ${err.message}`, true));
      el.querySelector('.btn-fullscreen').innerText = '🔳 ย่อจอ';
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      el.querySelector('.btn-fullscreen').innerText = '🔲 เต็มจอ';
    }
  }
}
// ดักจับการกดปุ่ม ESC เพื่อคืนค่าข้อความปุ่ม
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
     document.querySelectorAll('.btn-fullscreen').forEach(btn => btn.innerText = '🔲 เต็มจอ');
  }
});

// --- 1. วงล้อสุ่มชื่อ (ของเดิม) ---
let availableStudents = []; let availableStudentsForRandom = []; let randomizerInterval = null;
function resetRandomizer() { resetRandomPool(); }
function resetRandomPool() {
    availableStudents = [...students];
    const display = document.getElementById('random-display');
    if (display) { display.innerText = "?"; display.style.color = "#ff4b5c"; }
    showT("รีเซ็ตรายชื่อเรียบร้อยแล้วครับ");
}
function startAdvancedRandom() {
    if (availableStudents.length === 0 && students.length > 0) availableStudents = [...students];
    if (students.length === 0) return alert("ไม่พบรายชื่อนักเรียนครับ");

    const display = document.getElementById('random-display');
    const removeCheck = document.getElementById('remove-after-spin');
    let count = 0;
    if(randomizerInterval) clearInterval(randomizerInterval);
    
    randomizerInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * availableStudents.length);
        if(display) { display.innerText = availableStudents[randomIndex].name; display.style.color = "#64748b"; }
        count++;

        if (count > 15) {
            clearInterval(randomizerInterval);
            const finalIndex = Math.floor(Math.random() * availableStudents.length);
            const winner = availableStudents[finalIndex];
            if(display) { display.innerText = `🎉 ${winner.name} 🎉`; display.style.color = "#6366f1"; }
            if (removeCheck && removeCheck.checked) availableStudents.splice(finalIndex, 1);
        }
    }, 80);
}

// --- 2. นาฬิกาจับเวลา (ของเดิม) ---
let countdown; let timeLeft = 0; let isPaused = false;
function startTimer() {
    if (!isPaused) {
        const mins = parseInt(document.getElementById('timer-min').value) || 0;
        const secs = parseInt(document.getElementById('timer-sec').value) || 0;
        timeLeft = (mins * 60) + secs;
    }
    if (timeLeft <= 0) return showT("กรุณาตั้งเวลาก่อนครับ", true);
    isPaused = false; clearInterval(countdown);
    countdown = setInterval(() => {
        timeLeft--; updateTimerDisplay();
        if (timeLeft <= 0) { clearInterval(countdown); if(typeof Swal !== 'undefined') Swal.fire('หมดเวลา!', '⏰ หมดเวลาที่กำหนดแล้ว', 'warning'); else alert("หมดเวลาแล้ว!"); }
    }, 1000);
}
function pauseTimer() { clearInterval(countdown); isPaused = true; }
function resetTimer() { clearInterval(countdown); isPaused = false; timeLeft = 0; document.getElementById('timer-display').innerText = "00:00"; }
function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60); const s = timeLeft % 60;
    if(document.getElementById('timer-display')) document.getElementById('timer-display').innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- 3. ระบบสุ่มจับกลุ่ม ---
function generateGroups() {
  if (!students || students.length === 0) return showT('ไม่พบรายชื่อนักเรียนในห้อง', true);
  
  let list = [...students];
  // สลับตำแหน่งรายชื่อ (Shuffle) แบบสุ่ม
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  const count = parseInt(document.getElementById('group-count').value) || 2;
  const type = document.getElementById('group-type').value;
  let groups = [];
  
  if (type === 'groups') {
    // แบ่งตามจำนวนคนต่อกลุ่ม
    for (let i = 0; i < list.length; i += count) groups.push(list.slice(i, i + count));
  } else {
    // แบ่งตามจำนวนกลุ่มรวม
    for (let i = 0; i < count; i++) groups.push([]);
    list.forEach((s, i) => groups[i % count].push(s));
  }

  let html = '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">';
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  groups.forEach((g, i) => {
    const color = colors[i % colors.length];
    html += `<div style="border-left:4px solid ${color}; background:white; padding:15px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
      <h4 style="color:${color}; margin:0 0 10px 0;">กลุ่มที่ ${i+1} (${g.length} คน)</h4>
      <p style="margin:0; font-size:1rem; color:#475569; line-height:1.6;">${g.map(s => s.name).join('<br>')}</p>
    </div>`;
  });
  html += '</div>';
  document.getElementById('group-display').innerHTML = html;
}

// --- 4. กระดานคะแนนทีม ---
let scoreTeams = [
   { id: 1, name: 'ทีม A', score: 0, color: '#ef4444' },
   { id: 2, name: 'ทีม B', score: 0, color: '#3b82f6' }
];

function renderScoreboard() {
   let html = '';
   scoreTeams.forEach((t, index) => {
      html += `<div class="score-box" style="border-top:4px solid ${t.color}">
         <h4 contenteditable="true" onblur="updateTeamName(${index}, this.innerText)" title="คลิกเพื่อพิมพ์แก้ชื่อทีมได้เลย">${t.name}</h4>
         <div class="score-val" id="team-score-${index}">${t.score}</div>
         <div style="display:flex; justify-content:center; gap:5px;">
           <button class="btn-sm btn-outline" style="flex:1;" onclick="changeTeamScore(${index}, -1)">-1</button>
           <button class="btn-sm btn-outline" style="flex:1;" onclick="changeTeamScore(${index}, 1)">+1</button>
           <button class="btn-sm btn-outline" style="flex:1;" onclick="changeTeamScore(${index}, 5)">+5</button>
         </div>
      </div>`;
   });
   const container = document.getElementById('scoreboard-teams');
   if(container) container.innerHTML = html;
}

function changeTeamScore(index, val) { 
    scoreTeams[index].score += val; 
    document.getElementById(`team-score-${index}`).innerText = scoreTeams[index].score; 
}
function updateTeamName(index, name) { scoreTeams[index].name = name; }
function addScoreTeam() {
   const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
   scoreTeams.push({ id: Date.now(), name: `ทีม ${String.fromCharCode(65 + scoreTeams.length)}`, score: 0, color: colors[scoreTeams.length % colors.length] });
   renderScoreboard();
}
function resetScoreboard() { 
    if(confirm('ต้องการล้างคะแนนทุกทีมเป็น 0 ใช่หรือไม่?')) {
        scoreTeams.forEach(t => t.score = 0); renderScoreboard(); 
    }
}
setTimeout(renderScoreboard, 1000); // เรียกใช้งานเพื่อสร้าง UI ตอนเปิดเว็บ

// --- 5. ลูกเต๋าจำลอง ---
const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
function renderDice() {
   const count = document.getElementById('dice-count').value;
   let html = '';
   for(let i=0; i<count; i++) html += `<div class="dice" id="dice-${i}">🎲</div>`;
   document.getElementById('dice-container').innerHTML = html;
}
function rollDice() {
   const count = document.getElementById('dice-count').value;
   for(let i=0; i<count; i++) {
      const diceEl = document.getElementById(`dice-${i}`);
      diceEl.classList.add('dice-rolling'); // ใส่ CSS หมุน
   }
   // หน่วงเวลาให้หยุดหมุนแล้วแสดงผลลัพธ์
   setTimeout(() => {
      for(let i=0; i<count; i++) {
         const diceEl = document.getElementById(`dice-${i}`);
         diceEl.classList.remove('dice-rolling');
         diceEl.innerText = diceFaces[Math.floor(Math.random() * 6)];
      }
   }, 500);
}

// --- 6. มิเตอร์วัดความดังเสียง (Noise Meter) ---
let audioContext; let analyser; let microphone; let noiseInterval; let isNoiseMeterRunning = false;
let noiseExceedCount = 0; 
let isCurrentlyExceeding = false; 

async function toggleNoiseMeter() {
   if (isNoiseMeterRunning) stopNoiseMeter();
   else startNoiseMeter();
}

async function startNoiseMeter() {
   try {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
       audioContext = new (window.AudioContext || window.webkitAudioContext)();
       analyser = audioContext.createAnalyser();
       microphone = audioContext.createMediaStreamSource(stream);
       
       analyser.smoothingTimeConstant = 0.8; 
       analyser.fftSize = 256;
       microphone.connect(analyser);
       
       isNoiseMeterRunning = true;
       noiseExceedCount = 0;
       isCurrentlyExceeding = false;
       if(document.getElementById('noise-exceed-count')) document.getElementById('noise-exceed-count').innerText = noiseExceedCount;
       
       const btn = document.getElementById('btn-noise-start');
       btn.innerText = '🛑 ปิดการวัดเสียง';
       btn.style.background = '#64748b';
       
       checkNoiseLevel();
   } catch (err) {
       showT('ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาอนุญาตบนเบราว์เซอร์', true);
   }
}

function stopNoiseMeter() {
   if (audioContext) audioContext.close();
   if (noiseInterval) cancelAnimationFrame(noiseInterval);
   isNoiseMeterRunning = false;
   
   const btn = document.getElementById('btn-noise-start');
   btn.innerText = '🎤 เปิดไมค์วัดเสียง';
   btn.style.background = '#10b981';
   
   if(document.getElementById('noise-number')) document.getElementById('noise-number').innerText = '0';
   if(document.getElementById('noise-bar')) document.getElementById('noise-bar').style.width = '0%';
   
   const emojiEl = document.getElementById('noise-emoji');
   if(emojiEl) { emojiEl.innerText = '😌'; emojiEl.style.transform = 'scale(1)'; }
}

function updateNoiseSettings(val) {
    const lineEl = document.getElementById('noise-threshold-line');
    if(lineEl) lineEl.style.left = val + '%';
}

let lastAlertTime = 0;
function playNoiseAlertSound() {
    const now = Date.now();
    if (now - lastAlertTime < 2000) return; 
    lastAlertTime = now;
    
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

function checkNoiseLevel() {
   if (!isNoiseMeterRunning) return;
   
   const array = new Uint8Array(analyser.frequencyBinCount);
   analyser.getByteFrequencyData(array);
   
   let values = 0;
   const length = array.length;
   for (let i = 0; i < length; i++) values += (array[i]);
   
   let average = values / length;
   
   let db = Math.round((average / 255) * 120); 
   if(db < 0) db = 0;
   if(db > 100) db = 100;

   const thresholdEl = document.getElementById('noise-threshold');
   const threshold = thresholdEl ? parseInt(thresholdEl.value) : 70;
   
   const numEl = document.getElementById('noise-number');
   const barEl = document.getElementById('noise-bar');
   const emojiEl = document.getElementById('noise-emoji'); 
   
   if(numEl) numEl.innerText = db;
   if(barEl) barEl.style.width = db + '%';
   
   if (db >= threshold) {
       if(numEl) numEl.style.color = '#ef4444'; 
       if(barEl) barEl.style.background = '#ef4444';
       
       if(emojiEl) { 
          emojiEl.innerText = '🤯'; 
          emojiEl.style.transform = `scale(1.3) rotate(${Math.random() * 20 - 10}deg)`; 
       }
       
       const container = document.getElementById('tool-noise');
       if (document.fullscreenElement && container) {
           container.style.background = 'rgba(239, 68, 68, 0.15)';
           setTimeout(() => container.style.background = 'var(--bg)', 100);
       }

       if (!isCurrentlyExceeding) {
           isCurrentlyExceeding = true;
           noiseExceedCount++;
           const countEl = document.getElementById('noise-exceed-count');
           if(countEl) {
               countEl.innerText = noiseExceedCount;
               countEl.style.transform = 'scale(1.6)';
               setTimeout(() => countEl.style.transform = 'scale(1)', 200);
           }
           
           const soundCheck = document.getElementById('noise-sound-alert');
           if (soundCheck && soundCheck.checked) {
               playNoiseAlertSound();
           }
       }
   } else {
       if (db < threshold - 5) {
           isCurrentlyExceeding = false;
       }

       if (db >= threshold - 15) {
           if(numEl) numEl.style.color = '#f59e0b'; 
           if(barEl) barEl.style.background = '#f59e0b';
           
           if(emojiEl) { 
              emojiEl.innerText = '😲'; 
              emojiEl.style.transform = 'scale(1.1)'; 
           }
       } else {
           if(numEl) numEl.style.color = '#10b981'; 
           if(barEl) barEl.style.background = '#4ade80'; 
           
           if(emojiEl) { 
              if (db < Math.max(10, threshold - 40)) {
                  emojiEl.innerText = '😴'; 
              } else {
                  emojiEl.innerText = '😊'; 
              }
              emojiEl.style.transform = 'scale(1)'; 
           }
       }
   }

   noiseInterval = requestAnimationFrame(checkNoiseLevel);
}
// ==========================================
// 🧑‍🎓 11. ระบบจัดการนักเรียน (Bulk Edit, พลังฮีโร่, Excel)
// ==========================================
function openManageStudents() {
  if(!cid) return;
  switchView('v-manage-students');
  const list = document.getElementById('manage-stud-list');
  let html = '';
  students.forEach(s => {
    const pts = s.points || 0;
    html += `<div class="list-item" style="padding: 15px; background:var(--card-bg); border-radius:10px; margin-bottom:10px; border:1px solid var(--border-color);">
                <div style="display:flex; align-items:center; gap:15px;">
                  <div style="width:45px; height:45px; background:var(--bg-blue); color:var(--text-blue); border-radius:50%; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:1.2rem;">${s.number}</div>
                  <div><h4 style="margin:0;">${s.name}</h4><small style="color:var(--text-muted); font-size:0.9rem;">พลังฮีโร่: <b>${pts}</b> แต้ม</small></div>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                  <button class="btn-sm btn-outline" style="border-color:#059669; color:#059669;" onclick="openSpiderChart('${s.id}')">📊 สถิติพลัง</button>
                  <button class="btn-sm btn-outline" style="border-color:var(--primary); color:var(--primary);" onclick="analyzeStudentWithAI('${s.id}')">🤖 วิเคราะห์ AI</button>
                  
                  <button class="btn-sm" style="background:#10b981; color:white; border:none; padding:6px 12px;" onclick="openRewardModal('${s.id}', 'reward')">+ ให้รางวัล</button>
                  <button class="btn-sm" style="background:#3b82f6; color:white; border:none; padding:6px 12px;" onclick="openRewardModal('${s.id}', 'penalty')">✨ ใช้พลัง</button>
                  <button class="btn-sm" style="background:#e2e8f0; color:var(--text-main); border:none; padding:6px 12px;" onclick="adjustManualPoints('${s.id}', '${s.name}')">ปรับคะแนน</button>
                </div>
             </div>`;
  });
  list.innerHTML = html;
}

async function updateHeroPoints(sid, pointChange) {
  try {
    const sRef = db.ref(`students/${cid}/${sid}/points`);
    const snap = await sRef.once('value');
    let currentPts = snap.val() || 0;
    await sRef.set(currentPts + pointChange);
    showT(`อัปเดตแต้มฮีโร่สำเร็จ`);
    const stSnap = await db.ref(`students/${cid}`).once('value');
    students = Object.keys(stSnap.val()||{}).map(id => ({ id, ...stSnap.val()[id] })).sort((a,b) => a.number - b.number);
    openManageStudents(); 
  } catch(e) { handleFail(e); }
}

async function giveBulkPoints() {
  const pts = parseInt(document.getElementById('bulk-pts-input').value) || 0;
  if(pts === 0) return showT('กรุณาระบุแต้มที่ต้องการแจก', true);
  showL();
  try {
    let updates = {}; students.forEach(s => { updates[`students/${cid}/${s.id}/points`] = (s.points || 0) + pts; });
    await db.ref().update(updates);
    hideL(); showT(`แจกเวทมนตร์ ${pts} แต้มให้ทุกคนสำเร็จ!`);
    const stSnap = await db.ref(`students/${cid}`).once('value');
    students = Object.keys(stSnap.val()||{}).map(id => ({ id, ...stSnap.val()[id] })).sort((a,b) => a.number - b.number);
    openManageStudents();
  } catch (e) { handleFail(e); }
}

function openBulkEditStudents() {
  if(!cid) return;
  switchView('v-bulk-edit-students');
  const table = document.getElementById('bulk-edit-table');
  
  // เพิ่ม <th>จัดการ</th> เข้าไปด้านหลังสุด
  let html = '<table><thead><tr><th>เลขที่</th><th>รหัสนักเรียน</th><th class="text-left">ชื่อ-นามสกุล</th><th>PIN (4 หลัก)</th><th>Face ID</th><th>จัดการ</th></tr></thead><tbody>';
  
  students.forEach(s => {
    const faceBadge = s.hasFaceData ? `<span style="background:var(--bg-green); color:var(--text-green); padding:4px 8px; border-radius:8px; font-size:0.8rem; display:inline-block; margin-bottom:5px;">✅ บันทึกแล้ว</span>` : `<span style="background:var(--bg-red); color:var(--text-red); padding:4px 8px; border-radius:8px; font-size:0.8rem; display:inline-block; margin-bottom:5px;">❌ ยังไม่บันทึก</span>`;
    
    html += `<tr>
      <td><input type="number" id="be-num-${s.id}" value="${s.number}" style="width:60px; text-align:center; padding:8px;"></td>
      <td><input type="text" id="be-stid-${s.id}" value="${s.studentId || ''}" style="width:100px; text-align:center; padding:8px;"></td>
      <td class="text-left"><input type="text" id="be-name-${s.id}" value="${s.name}" style="width:100%; min-width:180px; padding:8px;"></td>
      <td><input type="text" id="be-pin-${s.id}" value="${s.pin || ''}" style="width:70px; text-align:center; padding:8px;" maxlength="4"></td>
      <td style="text-align:center; min-width:100px;">${faceBadge}<br><button class="btn-sm btn-outline" style="padding:6px 10px; font-size:0.8rem;" onclick="openFaceRegister('${s.id}', '${s.name}')">📸 สแกนหน้า</button></td>
      <td style="text-align:center;"><button class="btn-sm btn-red" onclick="deleteStudent('${s.id}', '${s.name}')">🗑️ ลบ</button></td>
    </tr>`;
  });
  table.innerHTML = html + '</tbody></table>';
}
async function deleteStudent(sid, name) {
  // ถามเพื่อความแน่ใจก่อนลบ
  if(!confirm(`🚨 คำเตือน: คุณต้องการลบรายชื่อ "${name}" ออกจากห้องเรียนใช่หรือไม่?\n(ข้อมูลคะแนนต่างๆ ของนักเรียนคนนี้จะถูกลบไปด้วย)`)) {
    return;
  }
  
  showL();
  try {
    // ลบข้อมูลนักเรียนจากฐานข้อมูล Firebase
    await db.ref(`students/${cid}/${sid}`).remove();
    
    // อัปเดตข้อมูลตัวแปร students ในระบบใหม่
    const stSnap = await db.ref(`students/${cid}`).once('value');
    const stObj = stSnap.val() || {};
    students = Object.keys(stObj).map(id => ({ id: id, ...stObj[id] })).sort((a,b) => a.number - b.number);
    
    hideL();
    showT(`ลบนักเรียน "${name}" เรียบร้อยแล้ว`);
    
    // โหลดหน้าต่างจัดการนักเรียนใหม่เพื่อแสดงผลล่าสุด
    openBulkEditStudents(); 
  } catch (e) {
    handleFail(e);
  }
}

async function saveBulkEditStudents() {
  showL();
  let updates = {};
  students.forEach(s => {
    updates[`students/${cid}/${s.id}/number`] = parseInt(document.getElementById(`be-num-${s.id}`).value) || s.number;
    updates[`students/${cid}/${s.id}/studentId`] = document.getElementById(`be-stid-${s.id}`).value;
    updates[`students/${cid}/${s.id}/name`] = document.getElementById(`be-name-${s.id}`).value;
    updates[`students/${cid}/${s.id}/pin`] = document.getElementById(`be-pin-${s.id}`).value;
  });
  try {
    await db.ref().update(updates); hideL(); showT('บันทึกข้อมูลนักเรียนสำเร็จ');
    openClass(cid, document.getElementById('det-title').innerText.replace(/🏫|📚|💻|🔬|🎨|🎵|⚽|🚀|🦖|🧸|⭐|💡/g, '').trim(), '');
  } catch(e) { handleFail(e); }
}

function openImportExcel() { openModal('m-stud'); }
async function saveStBulk() {
  const txt = document.getElementById('stt').value.trim();
  if(!txt) return showT('กรุณาวางข้อมูลจาก Excel ก่อน', true);
  if(!cid) return showT('ไม่พบห้องเรียน', true);
  
  showL();
  const lines = txt.split('\n'); 
  let updates = {};
  let hasData = false;

  lines.forEach(line => {
    if(!line.trim()) return; 

    // 1. ลองแยกด้วย Tab ก่อน (มาตรฐานคัดลอกจาก Excel)
    let cols = line.split('\t').map(c => c.trim()).filter(c => c !== '');

    // 2. ถ้าไม่มี Tab เลย ให้ใช้การเคาะเว้นวรรค (Space) หั่นทุกคำออกจากกัน
    if (cols.length === 1) {
        cols = line.trim().split(/\s+/); 
    }

    if (cols.length >= 2) {
      let num = NaN;
      let name = '';
      let stId = '';
      let pin = '1234';

      // 🎯 ดักจับ: กรณีแบบเต็มแต่ใช้ Space (ตัวแรกเป็นรหัส, ตัวสองเป็นเลขที่)
      if (cols.length >= 4 && !isNaN(parseInt(cols[0])) && !isNaN(parseInt(cols[1]))) {
         stId = cols[0]; // รหัสนักเรียน
         num = parseInt(cols[1]); // เลขที่

         // เช็คตัวสุดท้ายว่าเป็น PIN ไหม (มักเป็นเลข 4 หลัก)
         let lastItem = cols[cols.length - 1];
         if(lastItem.length >= 4 && !isNaN(parseInt(lastItem))) {
             pin = lastItem;
             // ชื่อคือส่วนตรงกลางทั้งหมดมาต่อกัน
             name = cols.slice(2, cols.length - 1).join(' ');
         } else {
             name = cols.slice(2).join(' ');
         }
      } 
      // กรณีแบบเต็มแต่ใช้ Tab (มี 4 คอลัมน์ขึ้นไป)
      else if (line.includes('\t') && cols.length >= 4) {
         stId = cols[0]; 
         num = parseInt(cols[1]); 
         name = cols[2] + ' ' + (cols[3] || ''); 
         if(cols.length >= 6) pin = cols[5] || '1234';
      }
      // กรณีแบบย่อ (ตัวแรกเป็นเลขที่, ที่เหลือเป็นชื่อ)
      else if (!isNaN(parseInt(cols[0]))) {
         num = parseInt(cols[0]);
         name = cols.slice(1).join(' '); 
      }

      // บันทึกเมื่อมีเลขที่และชื่อ
      if (!isNaN(num) && name) {
        const newSid = db.ref(`students/${cid}`).push().key;
        updates[`students/${cid}/${newSid}`] = { 
          number: num, 
          name: name, 
          studentId: stId, 
          pin: pin, 
          points: 0 
        };
        hasData = true;
      }
    }
  });

  if (!hasData) {
    hideL();
    return showT('รูปแบบข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', true);
  }

  try {
    await db.ref().update(updates); 
    hideL(); 
    closeModal('m-stud'); 
    document.getElementById('stt').value = ''; 
    showT(`นำเข้าข้อมูลนักเรียนสำเร็จ!`);
    
    // รีเฟรชหน้าห้องเรียน
    const currentTitle = document.getElementById('det-title').innerText.replace(/🏫|📚|💻|🔬|🎨|🎵|⚽|🚀|🦖|🧸|⭐|💡/g, '').trim();
    openClass(cid, currentTitle, ''); 
  } catch(e) { 
    handleFail(e); 
  }
}

async function saveAnnouncement() {
    const text = document.getElementById('class-announcement-input').value;
    showL();
    try {
        await db.ref(`announcements/${cid}`).set({ text, timestamp: firebase.database.ServerValue.TIMESTAMP });
        hideL();
        showT('บันทึกประกาศถึงนักเรียนเรียบร้อยแล้ว');
    } catch(e) { handleFail(e); }
}

function exportToExcel() {
  const table = document.getElementById('score-summary-table').querySelector('table');
  const attTable = document.getElementById('attendance-summary-table').querySelector('table');
  
  if (!table) {
    if (!students || students.length === 0) return showT('ไม่มีข้อมูลนักเรียน', true);
    let csvContent = "เลขที่,รหัสนักเรียน,ชื่อ-นามสกุล,พลังฮีโร่(คะแนน)\n";
    students.forEach(s => { csvContent += `${s.number},${s.studentId || ''},${s.name},${s.points || 0}\n`; });
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `ข้อมูลนักเรียน_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link); showT('ดาวน์โหลดไฟล์ CSV เรียบร้อย');
    return;
  }
  
  let csvContent = "";
  const rows = table.querySelectorAll('tr');
  const attRows = attTable ? attTable.querySelectorAll('tr') : [];

  rows.forEach((row, i) => {
    let rowData = [];
    const cols = row.querySelectorAll('th, td');
    cols.forEach(col => {
      let text = col.innerText.replace(/,/g, ' ').replace(/\n/g, ' ').trim();
      rowData.push(text);
    });

    if (attRows[i]) {
        const attCols = attRows[i].querySelectorAll('th, td');
        for (let j = 2; j < attCols.length; j++) {
            let text = attCols[j].innerText.replace(/,/g, ' ').replace(/\n/g, ' ').trim();
            rowData.push(text);
        }
    }
    csvContent += rowData.join(",") + "\n";
  });
  
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `สรุปคะแนนและเวลาเรียน_ปพ5_${Date.now()}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  showT('ดาวน์โหลดไฟล์ CSV เรียบร้อย');
}

/// ==========================================
// 🌟 ระบบใบประกาศ (Certificates) ปรับปรุงใหม่
// ==========================================

// 1. ฟังก์ชันอัปโหลดรูปพื้นหลัง
function handleCertBgUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => { 
      document.getElementById('cert-bg-url').value = e.target.result;
      updateCertPreview();
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function updateCertPreview() {
  const bg = document.getElementById('cert-bg-url').value;
  const box = document.getElementById('cert-preview-box');
  if(bg) box.style.backgroundImage = `url(${bg})`;
  document.getElementById('pv-desc').innerText = document.getElementById('cert-desc').value;
  document.getElementById('pv-title').style.color = document.getElementById('cert-title-color').value;
  document.getElementById('pv-name').style.color = document.getElementById('cert-name-color').value;
}

// 2. โหลดข้อมูลเมื่อเปิดหน้าแก้ไข
async function openCertEditor() {
  if (!cid) return;
  switchView('v-cert-editor');
  showL();
  try {
    const snap = await db.ref(`cert_settings/${cid}`).once('value');
    const settings = snap.val() || {};
    
    document.getElementById('cert-bg-url').value = settings.bgUrl || '';
    document.getElementById('cert-desc').value = settings.description || 'ได้ผ่านเกณฑ์ยอดเยี่ยม';
    
    // คืนค่าข้อความหลักที่เคยแก้ไข
    if(document.getElementById('pv-title')) document.getElementById('pv-title').innerText = settings.titleText || 'เกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า';
    if(document.getElementById('pv-desc')) document.getElementById('pv-desc').innerText = settings.description || 'ได้ผ่านเกณฑ์ยอดเยี่ยม';
    
    document.getElementById('cert-title-color').value = settings.titleColor || '#000000';
    document.getElementById('cert-name-color').value = settings.nameColor || '#00008b';
    
    // ล้างข้อความอิสระของเก่า แล้วโหลดของที่บันทึกไว้
    document.querySelectorAll('.custom-text').forEach(el => el.remove());
    if (settings.customTexts) {
       settings.customTexts.forEach(ct => {
          const newText = document.createElement('div');
          newText.id = ct.id;
          newText.className = 'draggable-item custom-text';
          newText.style.position = 'absolute';
          newText.style.left = ct.x; newText.style.top = ct.y;
          newText.style.fontSize = ct.fontSize || '24px';
          newText.style.color = ct.color || '#000000';
          newText.style.cursor = 'move'; newText.style.whiteSpace = 'nowrap'; newText.style.fontWeight = 'bold';
          newText.innerText = ct.text;
          document.getElementById('cert-preview-box').appendChild(newText);
       });
    }

    // คืนค่าตำแหน่งการลากวาง
    if(settings.positions) {
      const p = settings.positions;
      if(document.getElementById('pv-title')) { document.getElementById('pv-title').style.left = p.titleX; document.getElementById('pv-title').style.top = p.titleY; }
      if(document.getElementById('pv-name')) { document.getElementById('pv-name').style.left = p.nameX; document.getElementById('pv-name').style.top = p.nameY; }
      if(document.getElementById('pv-desc')) { document.getElementById('pv-desc').style.left = p.descX; document.getElementById('pv-desc').style.top = p.descY; }
      if(document.getElementById('pv-sign')) { document.getElementById('pv-sign').style.left = p.signX; document.getElementById('pv-sign').style.top = p.signY; }
    }
    
    if(document.getElementById('pv-teacher-name')) document.getElementById('pv-teacher-name').innerText = `( ${user.name} )`;
    
    hideL(); updateCertPreview(); initCertDraggable();
  } catch (e) { handleFail(e); }
}

// 3. บันทึกข้อมูลและข้อความทั้งหมดลงฐานข้อมูล
async function saveCertSettings() {
  if (!cid) return showT('ไม่พบรหัสห้องเรียน', true);
  showL();
  
  const getPos = (id) => {
    const el = document.getElementById(id);
    return el ? { x: el.style.left || '0px', y: el.style.top || '0px' } : { x: '0px', y: '0px' };
  };

  // เก็บข้อมูลกล่องข้อความที่สร้างใหม่
  const customTexts = [];
  document.querySelectorAll('.custom-text').forEach(el => {
     customTexts.push({ id: el.id, text: el.innerText, x: el.style.left, y: el.style.top, color: el.style.color, fontSize: el.style.fontSize });
  });

  const settings = {
    bgUrl: document.getElementById('cert-bg-url').value,
    titleText: document.getElementById('pv-title').innerText,
    description: document.getElementById('pv-desc').innerText,
    titleColor: document.getElementById('cert-title-color').value,
    nameColor: document.getElementById('cert-name-color').value,
    positions: {
      titleX: getPos('pv-title').x, titleY: getPos('pv-title').y,
      nameX: getPos('pv-name').x, nameY: getPos('pv-name').y,
      descX: getPos('pv-desc').x, descY: getPos('pv-desc').y,
      signX: getPos('pv-sign').x, signY: getPos('pv-sign').y
    },
    customTexts: customTexts
  };

  try {
    await db.ref(`cert_settings/${cid}`).set(settings);
    hideL();
    Swal.fire('สำเร็จ!', 'บันทึกรูปแบบและข้อความเกียรติบัตรแล้ว', 'success');
  } catch (e) { handleFail(e); }
}

// 4. ฟังก์ชันสร้างข้อความใหม่ (+ เพิ่มข้อความใหม่)
function addCustomText() {
  const stage = document.getElementById('cert-preview-box');
  const id = 'custom-text-' + Date.now();
  const newText = document.createElement('div');
  newText.id = id;
  newText.className = 'draggable-item custom-text';
  newText.style.position = 'absolute';
  newText.style.left = '350px';
  newText.style.top = '100px';
  newText.style.fontSize = '24px';
  newText.style.fontWeight = 'bold';
  newText.style.color = document.getElementById('cert-title-color').value || '#000000'; // ดึงสีจากที่เลือกไว้มาใช้
  newText.style.cursor = 'move';
  newText.style.whiteSpace = 'nowrap';
  newText.innerText = 'พิมพ์ข้อความ...';

  stage.appendChild(newText);
  initCertDraggable(); // ทำให้ข้อความใหม่ลากและคลิกแก้ได้
}

// 5. ระบบ Drag & Drop และการแก้ไข/ลบข้อความ และลายเซ็น
let activeItem = null;
let isDragging = false; // 💡 เพิ่มตัวแปรนี้เพื่อเช็คว่าเรากดเมาส์ค้างอยู่หรือไม่
let offset = { x: 0, y: 0 };

function initCertDraggable() {
  const stage = document.getElementById('cert-preview-box');
  
  document.onkeydown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && activeItem && activeItem.classList.contains('custom-text')) {
       activeItem.remove();
       activeItem = null;
    }
  };

  document.querySelectorAll('.draggable-item').forEach(item => {
    
    item.onmouseenter = () => { 
        if(activeItem !== item) {
            item.style.outline = "2px dashed rgba(239, 68, 68, 0.5)"; 
            item.style.background = "rgba(255, 255, 255, 0.5)"; 
        }
    };
    item.onmouseleave = () => { 
        if(activeItem !== item) {
            item.style.outline = "none"; 
            item.style.background = "transparent"; 
        }
    };

    // เมื่อคลิกเมาส์
    item.onmousedown = (e) => {
      if(activeItem && activeItem !== item) {
          activeItem.style.outline = "none";
          activeItem.style.background = "transparent";
      }
      activeItem = item;
      isDragging = true; // 💡 สั่งให้เริ่มลากได้
      item.style.outline = "2px solid #ef4444"; 
      item.style.background = "rgba(255, 255, 255, 0.5)";
      
      const rect = item.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const scale = 0.6; 
      offset.x = (e.clientX - rect.left) / scale;
      offset.y = (e.clientY - rect.top) / scale;
      item.style.zIndex = 1000;
    };

    item.ondblclick = (e) => {
      if(item.id === 'pv-sign') {
          Swal.fire({
            title: '✍️ อัปโหลดลายเซ็น',
            text: 'เลือกไฟล์รูปลายเซ็น (แนะนำไฟล์ .PNG พื้นหลังโปร่งใส)',
            input: 'file',
            inputAttributes: { accept: 'image/*' },
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: '💾 ตกลง',
            cancelButtonText: 'ยกเลิก',
            denyButtonText: '🗑️ ลบลายเซ็นเดิม',
            denyButtonColor: '#ef4444'
          }).then((result) => {
            if (result.value) { 
              const reader = new FileReader();
              reader.onload = (e) => {
                  document.getElementById('pv-sign-img').src = e.target.result;
                  document.getElementById('pv-sign-img').style.display = 'inline-block';
              };
              reader.readAsDataURL(result.value);
            } else if (result.isDenied) { 
               document.getElementById('pv-sign-img').src = '';
               document.getElementById('pv-sign-img').style.display = 'none';
            }
          });
          return; 
      }

      if(item.id === 'pv-name') {
         Swal.fire('ดึงชื่ออัตโนมัติ', 'ชื่อนักเรียนระบบจะดึงมาใส่ให้อัตโนมัติตอนพิมพ์ครับ! จัดแค่ตำแหน่งก็พอครับ', 'info');
         return;
      }

      let isCustom = item.classList.contains('custom-text');
      let currentFontSize = parseInt(window.getComputedStyle(item).fontSize) || 24;
      
      let currentColor = item.style.color || '#000000';
      if (currentColor.startsWith('rgb')) {
          const rgb = currentColor.match(/\d+/g);
          currentColor = `#${Number(rgb[0]).toString(16).padStart(2,'0')}${Number(rgb[1]).toString(16).padStart(2,'0')}${Number(rgb[2]).toString(16).padStart(2,'0')}`;
      }

      Swal.fire({
        title: '✏️ ปรับแต่งข้อความ',
        html: `
          <div style="text-align:left; margin-top:10px;">
            <label style="font-weight:bold; font-size:0.9rem;">ข้อความ:</label>
            <input id="swal-edit-text" class="swal2-input" value="${item.innerText}" style="margin-top:5px; margin-bottom:15px; font-family:'Kanit';">
            <div style="display:flex; gap:15px; align-items:center;">
              <div style="flex:1;">
                <label style="font-weight:bold; font-size:0.9rem;">ขนาด (px):</label><br>
                <input type="number" id="swal-edit-size" class="swal2-input" value="${currentFontSize}" style="width:100%; margin-top:5px; text-align:center;">
              </div>
              <div style="flex:1;">
                <label style="font-weight:bold; font-size:0.9rem;">สีตัวอักษร:</label><br>
                <input type="color" id="swal-edit-color" value="${currentColor}" style="width:100%; height:50px; margin-top:5px; cursor:pointer; border-radius:8px;">
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        showDenyButton: isCustom, 
        confirmButtonText: '💾 บันทึก',
        cancelButtonText: 'ยกเลิก',
        denyButtonText: '🗑️ ลบข้อความนี้',
        denyButtonColor: '#ef4444',
        preConfirm: () => {
          return { text: document.getElementById('swal-edit-text').value, size: document.getElementById('swal-edit-size').value, color: document.getElementById('swal-edit-color').value }
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const vals = result.value;
          if (vals.text.trim() !== '') item.innerText = vals.text;
          item.style.fontSize = vals.size + 'px'; item.style.color = vals.color;
          
          if (item.id === 'pv-desc') document.getElementById('cert-desc').value = vals.text;
          if (item.id === 'pv-title') document.getElementById('cert-title-color').value = vals.color;
        } else if (result.isDenied && isCustom) {
          item.remove(); activeItem = null;
        }
      });
    };
  });

  // ขยับเมาส์
  document.onmousemove = (e) => {
    if (!activeItem || !isDragging) return; // 💡 ถ้าไม่ได้กดเมาส์ค้างไว้ ให้หยุดลากทันที
    const stageRect = stage.getBoundingClientRect();
    const scale = 0.6;
    activeItem.style.left = ((e.clientX - stageRect.left) / scale - offset.x) + 'px';
    activeItem.style.top = ((e.clientY - stageRect.top) / scale - offset.y) + 'px';
  };

  // 💡 ปล่อยเมาส์
  document.onmouseup = () => { 
      isDragging = false; // บอกระบบว่าเลิกกดเมาส์ค้างแล้ว
      if(activeItem) activeItem.style.zIndex = ''; 
  };
  
  // คลิกว่างๆ บนกระดาษเพื่อยกเลิกการเลือก (เอาเส้นขอบแดงออก)
  stage.onmousedown = (e) => {
      if(e.target === stage && activeItem) {
          activeItem.style.outline = "none"; 
          activeItem.style.background = "transparent"; 
          activeItem = null;
      }
  };
}

// ==========================================
