// 🔍 6. ระบบค้นหานักเรียน & โหลด Dashboard (อัปเกรดระบบนับ Streak อัตโนมัติ)
// ==========================================
function doSearch() {
  const q = document.getElementById('name-search').value;
  if(!q) return showT('กรุณากรอกข้อมูล', true);
  executeSearchStudentData(q, false);
}

async function executeSearchStudentData(query, isSid = false) {
  showL();
  try {
    const snap = await db.ref('students').once('value');
    const dbObj = snap.val() || {}; let found = [];
    for(let cKey in dbObj){
      for(let sKey in dbObj[cKey]){
        let s = dbObj[cKey][sKey];
        if(isSid ? (sKey === query) : (s.studentId === query || s.name.includes(query) || s.number.toString() === query)){
          found.push({ id: sKey, cid: cKey, ...s });
        }
      }
    }
    
    if(found.length === 0) { hideL(); return showT('ไม่พบข้อมูลนักเรียน', true); }
    lastSearchRes = found[0]; 
    
    // บันทึกการเข้าสู่ระบบของนักเรียนลง LocalStorage
    localStorage.setItem('lms_student_query', query);
    localStorage.setItem('lms_student_isSid', isSid.toString());

    if (user && user.role === 'student') { 
       document.getElementById('dash-name').innerText = lastSearchRes.name;
       const pts = lastSearchRes.points || 0;
       document.getElementById('dash-pts').innerText = pts;
       
       let rank = "มือใหม่ (Novice)"; let exp = (pts % 10) * 10;
       if(pts >= 50) rank = "ฮีโร่ระดับตำนาน (Legendary)"; else if(pts >= 30) rank = "ฮีโร่ระดับสูง (Advanced)"; else if(pts >= 10) rank = "นักผจญภัย (Adventurer)";
       document.getElementById('dash-rank').innerText = `ระดับ: ${rank}`;
       document.getElementById('dash-exp').style.width = `${exp}%`;
       
       if(typeof renderDashGamification === 'function') renderDashGamification();

       hideL(); switchView('v-student-dash'); loadMissionLogbook();
    } else { 
       hideL(); const pinInput = document.getElementById('student-pin-input'); if(pinInput) pinInput.value = ''; openModal('m-pin'); 
    }
  } catch(e) { handleFail(e); }
}

function verifyPin() {
  const pin = document.getElementById('student-pin-input').value;
  if(pin === lastSearchRes.pin) { 
    closeModal('m-pin'); document.getElementById('res-title').innerText = `ข้อมูล: ${lastSearchRes.name}`;
    switchView('v-result'); renderStudentResult(lastSearchRes); 
  } else { showT('❌ PIN ไม่ถูกต้อง', true); }
}

// ==========================================
// 📚 โหลดภารกิจและข้อสอบในหน้า Dashboard นักเรียน (ระบบ Real-time อัปเดตอัตโนมัติ 100%)
// ==========================================
function loadMissionLogbook() {
  if (!lastSearchRes) return;
  const sid = lastSearchRes.id; const cid = lastSearchRes.cid;

  // 1. เคลียร์ตัวดักฟังเก่าออกก่อนเพื่อป้องกันการทำงานซ้ำซ้อน
  db.ref(`students/${cid}/${sid}`).off('value');
  db.ref(`scores`).off('value');
  db.ref(`submissions/${cid}`).off('value');
  db.ref(`exam_submissions/${cid}`).off('value');
  db.ref(`assignments/${cid}`).off('value');
  db.ref(`exams/${cid}`).off('value');
  db.ref(`attendance/${cid}`).off('value');

  // 🎯 2. ดักฟัง "คะแนนพลังฮีโร่" แบบ Real-time
  db.ref(`students/${cid}/${sid}`).on('value', (snap) => {
      if (snap.exists()) {
          const sData = snap.val();
          lastSearchRes.points = sData.points || 0; 
          
          const dashPts = document.getElementById('dash-pts');
          if(dashPts) dashPts.innerText = lastSearchRes.points;
          
          if(typeof renderDashGamification === 'function') renderDashGamification();
      }
  });

  // 🎯 3. ดักฟัง "งานค้าง และ สถานะคะแนน" แบบ Real-time
  async function updateStudentDashboardUI() {
    try {
      const [asSnap, subSnap, scSnap, exSnap, exSubSnap, atSnap, fbSnap, annSnap, stSnap] = await Promise.all([ 
          db.ref(`assignments/${cid}`).once('value'), 
          db.ref(`submissions/${cid}`).once('value'), 
          db.ref(`scores`).once('value'),
          db.ref(`exams/${cid}`).once('value'),
          db.ref(`exam_submissions/${cid}`).once('value'),
          db.ref(`attendance/${cid}`).once('value'),
          db.ref(`feedbacks`).once('value'),
          db.ref(`announcements/${cid}`).once('value'),
          db.ref(`students/${cid}`).once('value')
      ]);
      
      const assignments = asSnap.val() || {}; const submissions = subSnap.val() || {}; const scores = scSnap.val() || {};
      const exams = exSnap.val() || {}; const examSubs = exSubSnap.val() || {}; const atObj = atSnap.val() || {};
      const feedbacks = fbSnap.val() || {}; const annObj = annSnap.val() || {}; const studentsData = stSnap.val() || {};

      const annDiv = document.getElementById('dash-announcement');
      if (annDiv) {
        annDiv.innerHTML = (annObj.text && annObj.text.trim() !== '') 
          ? annObj.text.replace(/\n/g, '<br>') 
          : 'ยังไม่มีประกาศจากคุณครู';
      }

      const lbDiv = document.getElementById('dash-leaderboard');
      if (lbDiv) {
        const sortedStudents = Object.keys(studentsData)
          .map(id => ({ id, name: studentsData[id].name, points: studentsData[id].points || 0 }))
          .sort((a,b) => b.points - a.points)
          .slice(0, 5);
        if (sortedStudents.length > 0) {
          let lbHtml = '<div style="display:flex; flex-direction:column; gap:8px;">';
          const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
          sortedStudents.forEach((st, idx) => {
            lbHtml += `<div style="display:flex; justify-content:space-between; background:var(--card-bg); padding:8px 12px; border-radius:8px; border:1px solid var(--border-color);">
              <span>${medals[idx]} ${st.name}</span>
              <b style="color:var(--primary);">${st.points} แต้ม</b>
            </div>`;
          });
          lbHtml += '</div>';
          lbDiv.innerHTML = lbHtml;
        } else {
          lbDiv.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:0.9rem;">ยังไม่มีข้อมูลฮีโร่</p>';
        }
      }

      // 🎯 อัปเดตรายการในกล่องอัปโหลดงาน (Dropdown) แบบเรียลไทม์
      const selectTask = document.getElementById('upload-task-selector');
      if(selectTask) {
          const prevVal = selectTask.value;
          selectTask.innerHTML = '<option value="">-- เลือกภารกิจที่ต้องการส่ง (ถ้ามี) --</option>';
          Object.keys(assignments).forEach(aid => {
              selectTask.innerHTML += `<option value="${aid}">${assignments[aid].title}</option>`;
          });
          selectTask.value = prevVal;
      }

      let examHtml = ''; let taskHtml = ''; let hasTask = false; let hasExam = false; let totalScore = 0; let totalMax = 0;
      let missingCount = 0; let missingNames = [];
      
      // จัดการ ภารกิจทั่วไป (งานอัปโหลดไฟล์)
      Object.keys(assignments).forEach(aid => {
        const task = assignments[aid]; const isSubmitted = submissions[aid] && submissions[aid][sid] ? true : false; const myScore = (scores[aid] && scores[aid][sid]) ? scores[aid][sid] : null;
        if (task.maxScore) totalMax += parseFloat(task.maxScore);
        
        let statusText = isSubmitted ? '<span style="background:#fef3c7; color:#d97706; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">⏳ รอครูตรวจ</span>' : '<span style="background:#fee2e2; color:#ef4444; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">❌ ยังไม่ส่ง</span>';
        
        if (myScore !== null && myScore !== '-') {
          statusText = `<span style="background:#d1fae5; color:#059669; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">✅ ได้ &nbsp;${myScore} คะแนน</span>`;
          if(!isNaN(myScore)) totalScore += parseFloat(myScore);
        } else if (!isSubmitted) {
          missingCount++;
          missingNames.push(task.title);
        }
        
        // 🎯 สร้างปุ่มโหลดใบงาน (ถ้าครูใส่ลิงก์ไว้)
        const docLink = task.doc ? `<a href="${task.doc}" target="_blank" class="btn-sm btn-outline" style="margin-left:10px; text-decoration:none; display:inline-block; font-size:0.75rem; padding:4px 8px; border-color:var(--primary); color:var(--primary);">📥 โหลดใบงาน</a>` : '';
        const ytLink = task.youtube ? `<a href="${task.youtube}" target="_blank" class="btn-sm btn-outline" style="margin-left:10px; text-decoration:none; display:inline-block; font-size:0.75rem; padding:4px 8px; border-color:#ef4444; color:#ef4444;">📺 ดูคลิปสอน</a>` : '';
        
        const myFb = (feedbacks[aid] && feedbacks[aid][sid]) ? feedbacks[aid][sid] : null;
        let fbHtml = '';
        if (myFb) {
          fbHtml = `<div style="margin-top:10px; padding:8px; background:#f0f9ff; border-left:3px solid #0ea5e9; font-size:0.85rem; color:#0369a1; border-radius:4px;">💬 <b>คอมเมนต์จากครู:</b> ${myFb}</div>`;
        }

        const card = `<div style="background:var(--card-bg); padding:15px; border-radius:12px; border:1px solid var(--border-color); margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                            <div>
                                <h4 style="margin:0; color:var(--text-main); font-size:1rem; display:flex; align-items:center;">
                                    ${task.title} ${docLink} ${ytLink}
                               </h4>
                                <span style="font-size:0.85rem; color:var(--text-muted); display:block; margin-top:5px;">คะแนนเต็ม: ${task.maxScore || 0}</span>
                            </div>
                            <div style="text-align:right;">${statusText}</div>
                        </div>
                        ${fbHtml}
                      </div>`;
        taskHtml += card; hasTask = true; 
      });

      // จัดการ ข้อสอบ
      Object.keys(exams).forEach(eid => {
          const ex = exams[eid];
          const isTaken = examSubs[eid] && examSubs[eid][sid] ? true : false;
          let exMaxScore = 0;
          if(ex.questions) ex.questions.forEach(q => exMaxScore += (parseFloat(q.score) || 1));

          let exStatus = ''; let actionBtn = '';
          if (isTaken) {
              const myExScore = examSubs[eid][sid].score;
              exStatus = `<span style="background:#d1fae5; color:#059669; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">✅ สอบแล้ว ได้ ${myExScore}/${exMaxScore}</span>`;
              totalMax += exMaxScore;
              totalScore += parseFloat(myExScore);
          } else {
              exStatus = `<span style="background:#fee2e2; color:#ef4444; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">📝 รอทดสอบ</span>`;
              actionBtn = `<button class="btn-sm btn-primary" style="margin-top:8px; font-size:0.8rem; padding:6px 15px; border-radius:20px;" onclick="startTakeExam('${eid}')">เริ่มทำข้อสอบ 🚀</button>`;
          }

          examHtml += `<div style="background:var(--card-bg); padding:15px; border-radius:12px; border:2px solid var(--border-blue); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                          <div><h4 style="margin:0; color:var(--text-blue); font-size:1rem;">${ex.title}</h4><span style="font-size:0.85rem; color:var(--text-muted); display:block; margin-top:5px;">จำนวน ${ex.questions ? ex.questions.length : 0} ข้อ</span></div>
                          <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end;">${exStatus}${actionBtn}</div>
                       </div>`;
          hasExam = true;
      });
      
      // 🎯 คำนวณสถิติความมีวินัย (Streak) และประวัติเข้าเรียนให้ฝั่งนักเรียนแบบ Real-time
      const sortedDates = Object.keys(atObj).sort((a, b) => b.localeCompare(a));
      let streak = 0;
      let isStreakBroken = false;
      let attHtml = '';
      let totalCome = 0;

      sortedDates.forEach(date => {
          const status = atObj[date][sid];
          if (status) {
              attHtml += `<div style="display:flex; justify-content:space-between; padding:8px 10px; border-bottom:1px dashed var(--border-color); font-size:0.9rem;">
                            <span>📅 ${date}</span>
                            <span class="date-tag tag-${status}" style="margin:0; padding:2px 8px;">${status}</span>
                          </div>`;
              
              if ((status === 'มา' || status === 'สาย') && !isStreakBroken) {
                  streak++;
                  totalCome++;
              } else {
                  isStreakBroken = true;
              }
          }
      });

      if(document.getElementById('dash-streak')) document.getElementById('dash-streak').innerText = streak;
      if(document.getElementById('dash-att-list')) {
          document.getElementById('dash-att-list').innerHTML = attHtml || '<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:10px;">ไม่มีประวัติการเช็คชื่อ</p>';
      }

      const hintEl = document.getElementById('dash-streak-hint');
      if(hintEl) {
          if(streak >= 5) hintEl.innerText = "🔥 พลังความตั้งใจพลุ่งพล่าน! รักษาไว้นะฮีโร่!";
          else if(streak >= 1) hintEl.innerText = "✨ เริ่มต้นได้เยี่ยม! มาเรียนต่อเนื่องกันเถอะ";
          else hintEl.innerText = "🌱 พยายามเข้านะ! เริ่มต้นสะสมวันมาเรียนกันใหม่";
      }
      
      if(document.getElementById('dash-exam-list')) document.getElementById('dash-exam-list').innerHTML = hasExam ? examHtml : '<p style="text-align:center; color:var(--text-muted); font-size:0.9rem;">✨ ยังไม่มีภารกิจทดสอบในตอนนี้</p>';
      if(document.getElementById('dash-quest-list')) document.getElementById('dash-quest-list').innerHTML = hasTask ? taskHtml : '<p style="text-align:center; color:var(--text-muted); font-size:0.9rem;">✨ ยังไม่มีภารกิจค้างส่ง</p>';
      if(document.getElementById('dash-total')) document.getElementById('dash-total').innerText = `รวม: ${totalScore}/${totalMax}`;
      if(document.getElementById('dash-grade')) document.getElementById('dash-grade').innerText = getAutoGrade(totalScore, totalMax);

      const missingBox = document.getElementById('dash-missing-box');
      const missingText = document.getElementById('dash-missing-text');
      if (missingBox && missingText) {
          if (missingCount > 0) {
              missingBox.style.display = 'block';
              missingText.innerText = missingNames.join(', ');
          } else {
              missingBox.style.display = 'none';
          }
      }
    } catch(e) { console.error(e); }
  }

  db.ref(`scores`).on('value', updateStudentDashboardUI);
  db.ref(`submissions/${cid}`).on('value', updateStudentDashboardUI);
  db.ref(`exam_submissions/${cid}`).on('value', updateStudentDashboardUI);
  db.ref(`assignments/${cid}`).on('value', updateStudentDashboardUI);
  db.ref(`exams/${cid}`).on('value', updateStudentDashboardUI);
  db.ref(`attendance/${cid}`).on('value', updateStudentDashboardUI);
  
  updateStudentDashboardUI();
}

// ==========================================
// 📝 ระบบให้นักเรียนทำข้อสอบ
// ==========================================
let currentTakingExamId = null;
let currentExamData = null;

let zepQuestions = [];
let zepCurrentQIndex = 0;
let zepScore = 0;
let zepTimeLimit = 15;
let zepTimeLeft = 15;
let zepTimerInterval;
let zepIsAnswering = false;
let zepStudentAnswers = {};

async function startTakeExam(eid) {
  showL();
  try {
    const snap = await db.ref(`exams/${lastSearchRes.cid}/${eid}`).once('value');
    currentExamData = snap.val();
    if(!currentExamData || !currentExamData.questions) {
        hideL(); return showT('ไม่พบข้อสอบ', true);
    }
    currentTakingExamId = eid;

    zepQuestions = currentExamData.questions.map((q, idx) => ({...q, originalIndex: idx}));
    if(currentExamData.settings && currentExamData.settings.randomQ) {
        zepQuestions = zepQuestions.sort(() => Math.random() - 0.5);
    }

    zepCurrentQIndex = 0;
    zepScore = 0;
    zepStudentAnswers = {};
    zepTimeLimit = (currentExamData.settings && currentExamData.settings.timeLimit > 0) ? currentExamData.settings.timeLimit : 0;
    document.getElementById('zep-total-q').innerText = zepQuestions.length;
    document.getElementById('zep-score').innerText = zepScore;
    document.getElementById('zep-result-screen').style.display = 'none';

    hideL();
    switchView('v-take-exam');
    window.scrollTo(0,0);

    loadZepQuestion();
  } catch (e) { handleFail(e); }
}

function loadZepQuestion() {
  zepIsAnswering = false;
  
  const timerBar = document.getElementById('zep-timer-bar');
  const timerContainer = document.querySelector('.zep-timer-container');
  
  if (zepTimeLimit > 0) {
      zepTimeLeft = zepTimeLimit;
      timerContainer.style.display = 'block';
      timerBar.style.transition = 'none';
      timerBar.style.width = '100%';
      timerBar.style.backgroundColor = '#2ed573';
      void timerBar.offsetWidth;
      timerBar.style.transition = 'width 1s linear, background-color 0.3s';
  } else {
      timerContainer.style.display = 'none';
  }

  const qData = zepQuestions[zepCurrentQIndex];
  document.getElementById('zep-current-q').innerText = zepCurrentQIndex + 1;
  
  const qText = document.getElementById('zep-question-text');
  qText.style.animation = 'none';
  void qText.offsetWidth;
  qText.style.animation = 'zepBounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  
  let imgHtml = qData.image ? `<img src="${qData.image}" style="max-height:150px; border-radius:8px; margin-top:10px; display:block; margin-left:auto; margin-right:auto;">` : '';
  qText.innerHTML = qData.text + imgHtml;

  const avatar = document.getElementById('zep-avatar');
  avatar.style.left = '50%';
  avatar.style.bottom = '20px';
  avatar.style.transform = 'translateX(-50%)';
  avatar.innerText = ['🦊','🐰','🐻','🐼','🐯','🦁','🐸','🐵'][Math.floor(Math.random()*8)];

  const optsContainer = document.getElementById('zep-options-container');
  let html = '';

  if (qData.type === 'mcq') {
      const colors = ['zep-bg-red', 'zep-bg-blue', 'zep-bg-yellow', 'zep-bg-green'];
      let opts = qData.options.map((opt, idx) => ({ text: opt, idx: idx, img: qData.optionImages ? qData.optionImages[idx] : null }));
      if (currentExamData.settings && currentExamData.settings.randomOpt) {
          opts = opts.sort(() => Math.random() - 0.5);
      }
      opts.forEach((o, renderIdx) => {
          let optImgHtml = o.img ? `<img src="${o.img}" style="max-height:80px; border-radius:8px; display:block; margin-top:8px; margin-left:auto; margin-right:auto;">` : '';
          html += `<button class="zep-opt-card ${colors[renderIdx%4]}" onclick="selectZepOption(${o.idx}, this)">${o.text} ${optImgHtml}</button>`;
      });
  } else if (qData.type === 'tf') {
      html += `<button class="zep-opt-card zep-bg-green" onclick="selectZepOption(true, this)">✅ จริง</button>
               <button class="zep-opt-card zep-bg-red" onclick="selectZepOption(false, this)">❌ เท็จ</button>`;
  } else if (qData.type === 'short') {
      html += `<div class="zep-short-ans-container">
                 <input type="text" id="zep-short-input" class="zep-short-input" placeholder="พิมพ์คำตอบที่นี่..." autocomplete="off">
                 <button class="zep-submit-btn" onclick="submitZepShortAns()">ตอบเลย 🚀</button>
               </div>`;
  }
  
  optsContainer.innerHTML = html;

  clearInterval(zepTimerInterval);
  if (zepTimeLimit > 0) {
      zepTimerInterval = setInterval(() => {
        zepTimeLeft--;
        const pct = (zepTimeLeft / zepTimeLimit) * 100;
        timerBar.style.width = pct + '%';

        if (pct <= 30) { timerBar.style.backgroundColor = '#ff4757'; } 
        else if (pct <= 60) { timerBar.style.backgroundColor = '#ffa502'; }

        if (zepTimeLeft <= 0) {
          clearInterval(zepTimerInterval);
          handleZepTimeOut();
        }
      }, 1000);
  }
}

function selectZepOption(ansValue, btnElement) {
  if (zepIsAnswering) return;
  zepIsAnswering = true;
  clearInterval(zepTimerInterval);

  const avatar = document.getElementById('zep-avatar');
  if (btnElement) {
      const btnRect = btnElement.getBoundingClientRect();
      const stageRect = document.getElementById('zep-stage').getBoundingClientRect();
      const targetX = btnRect.left + (btnRect.width / 2) - stageRect.left;
      avatar.style.left = targetX + 'px';
      avatar.style.bottom = '-40px'; 
  }

  playZepSound('jump');

  setTimeout(() => {
    revealZepAnswer(ansValue);
  }, 600);
}

function submitZepShortAns() {
    const input = document.getElementById('zep-short-input');
    if(!input || input.value.trim() === '') return;
    selectZepOption(input.value.trim(), null);
}

function handleZepTimeOut() {
  zepIsAnswering = true;
  revealZepAnswer(null); 
}

function revealZepAnswer(studentAns) {
  const qData = zepQuestions[zepCurrentQIndex];
  const correctAns = qData.correct;
  zepStudentAnswers[qData.originalIndex] = studentAns;

  let isCorrect = false;
  if (studentAns !== null) {
      if (qData.type === 'short') {
          if (String(studentAns).toLowerCase() === String(correctAns).toLowerCase()) isCorrect = true;
      } else {
          if (studentAns === correctAns) isCorrect = true;
      }
  }

  const avatar = document.getElementById('zep-avatar');
  const btns = document.querySelectorAll('.zep-opt-card');
  
  if (qData.type === 'mcq' || qData.type === 'tf') {
      btns.forEach((btn, idx) => {
          btn.classList.add('disabled');
          
          let isThisCorrect = false;
          if(qData.type === 'mcq' && idx === correctAns) isThisCorrect = true;
          if(qData.type === 'tf') {
              if (correctAns === true && idx === 0) isThisCorrect = true;
              if (correctAns === false && idx === 1) isThisCorrect = true;
          }

          if (isThisCorrect) {
              btn.classList.add('correct-ans');
              btn.classList.remove('disabled');
          } else {
              btn.classList.add('wrong-ans');
          }
      });
  }

  if (isCorrect) {
    avatar.innerText = '🤩';
    avatar.style.transform = 'translateX(-50%) translateY(-30px) scale(1.2)';
    zepScore += parseFloat(qData.score || 1);
    document.getElementById('zep-score').innerText = zepScore;
    playZepSound('correct');
  } else {
    avatar.innerText = '😵';
    playZepSound('wrong');
  }

  setTimeout(() => {
    zepCurrentQIndex++;
    if (zepCurrentQIndex < zepQuestions.length) {
      loadZepQuestion();
    } else {
      showZepResult();
    }
  }, 2500);
}

function showZepResult() {
  const resultScreen = document.getElementById('zep-result-screen');
  resultScreen.style.display = 'flex';
  document.getElementById('zep-final-score').innerText = zepScore;
  const avatar = document.getElementById('zep-avatar');
  let exMaxScore = 0;
  zepQuestions.forEach(q => exMaxScore += parseFloat(q.score || 1));
  if(zepScore >= exMaxScore * 0.8) avatar.innerText = '👑';
}

async function finishZepExam() {
    showL();
    try {
        const sid = lastSearchRes.id; const cid = lastSearchRes.cid;
        await db.ref(`exam_submissions/${cid}/${currentTakingExamId}/${sid}`).set({
            answers: zepStudentAnswers, score: zepScore, timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        hideL();
        let msg = 'บันทึกคำตอบเรียบร้อยแล้ว';
        if(currentExamData.settings && currentExamData.settings.showScore) {
            msg = `คุณสอบได้คะแนน: ${zepScore} แต้ม! 🎉`;
        }
        await Swal.fire('ส่งข้อสอบสำเร็จ!', msg, 'success');
        switchView('v-student-dash');
        loadMissionLogbook();
    } catch(e) { handleFail(e); }
}

function quitZepExam() {
    Swal.fire({
        title: 'แน่ใจหรือไม่?', text: "หากออกจากห้องสอบตอนนี้ คะแนนจะไม่ถูกบันทึก!", icon: 'warning',
        showCancelButton: true, confirmButtonText: 'ออก', cancelButtonText: 'ทำต่อ'
    }).then((result) => {
        if (result.isConfirmed) {
            clearInterval(zepTimerInterval);
            switchView('v-student-dash');
        }
    });
}

function playZepSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'correct') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'jump') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    }
  } catch(e) {}
}

// ==========================================
// 📊 สรุปผลคะแนนแบบรายบุคคล (ระบบ Real-time อัปเดตอัตโนมัติ)
// ==========================================
function renderStudentResult(student) {
  if (!student) return;
  const cid = student.cid; const sid = student.id;
  
  // เคลียร์ตัวดักฟังเก่าออกก่อนป้องกันการซ้ำซ้อน
  db.ref(`scores`).off('value');
  db.ref(`submissions/${cid}`).off('value');
  db.ref(`exam_submissions/${cid}`).off('value');

  async function updateResultUI(isInitial = false) {
    if (isInitial) showL(); // แสดงอนิเมชั่นหมุนโหลดเฉพาะรอบแรกเท่านั้น หลังบ้านอัปเดตจะแอบซิงค์เงียบๆ
    try {
      const [asSnap, scSnap, atSnap, exSnap, subSnap, exSubSnap] = await Promise.all([ 
        db.ref(`assignments/${cid}`).once('value'), 
        db.ref(`scores`).once('value'), 
        db.ref(`attendance/${cid}`).once('value'), 
        db.ref(`exams/${cid}`).once('value'),
        db.ref(`submissions/${cid}`).once('value'),
        db.ref(`exam_submissions/${cid}`).once('value')
      ]);

      const asObj = asSnap.val() || {}; const scObj = scSnap.val() || {}; const atObj = atSnap.val() || {}; 
      const exObj = exSnap.val() || {}; const subObj = subSnap.val() || {}; const exSubObj = exSubSnap.val() || {};

      let totalScore = 0; let maxScore = 0; let missingWorks = [];
      let scoreHtml = '<table><thead><tr><th>ภารกิจ/งาน</th><th>คะแนนที่ได้</th><th>คะแนนเต็ม</th></tr></thead><tbody>';

      Object.keys(asObj).forEach(aid => {
        const task = asObj[aid]; const score = (scObj[aid] && scObj[aid][sid] !== undefined) ? scObj[aid][sid] : '-';
        const isSubmitted = subObj[aid] && subObj[aid][sid]; 
        maxScore += parseFloat(task.maxScore || 0);

        if (score === '-' || score === '') { 
            if (!isSubmitted) { missingWorks.push(task.title); scoreHtml += `<tr><td class="text-left">${task.title}</td><td style="color:var(--text-red); font-weight:bold;">❌ ค้างส่ง</td><td>${task.maxScore}</td></tr>`; } 
            else { scoreHtml += `<tr><td class="text-left">${task.title}</td><td style="color:var(--text-orange); font-weight:bold;">⏳ รอครูตรวจ</td><td>${task.maxScore}</td></tr>`; }
        } else { totalScore += parseFloat(score); scoreHtml += `<tr><td class="text-left">${task.title}</td><td style="color:var(--primary); font-weight:bold;">${score}</td><td>${task.maxScore}</td></tr>`; }
      });
      
      if(Object.keys(asObj).length === 0) scoreHtml += `<tr><td colspan="3">ยังไม่มีภารกิจในห้องเรียนนี้</td></tr>`;
      scoreHtml += '</tbody></table>';

      document.getElementById('res-scores').innerHTML = scoreHtml; 

      let stats = { "มา":0, "สาย":0, "ขาด":0, "ลา":0, "ป่วย":0 };
      let atHtml = '<table><thead><tr><th>วันที่</th><th>สถานะ</th></tr></thead><tbody>';
      const dates = Object.keys(atObj).sort((a,b) => b.localeCompare(a)); 
      dates.forEach(d => { const status = atObj[d][sid]; if (status) { stats[status]++; atHtml += `<tr><td>${d}</td><td><span class="date-tag tag-${status}">${status}</span></td></tr>`; } });
      if(dates.length === 0 || Object.values(stats).reduce((a,b)=>a+b,0) === 0) { atHtml += '<tr><td colspan="2">ไม่มีประวัติการเช็คชื่อ</td></tr>'; }
      atHtml += '</tbody></table>'; document.getElementById('res-at').innerHTML = atHtml;

      let exHtml = '<table><thead><tr><th>ชุดข้อสอบ</th><th>สถานะ</th><th>คะแนนที่ได้</th></tr></thead><tbody>';
      const exKeys = Object.keys(exObj);
      if(exKeys.length === 0) { 
          exHtml += '<tr><td colspan="3">ยังไม่มีการทดสอบ</td></tr>'; 
      } else { 
          exKeys.forEach(eid => { 
              const ex = exObj[eid];
              let exMax = 0; if(ex.questions) ex.questions.forEach(q => exMax += (parseFloat(q.score) || 1));
              maxScore += exMax; 

              if(exSubObj[eid] && exSubObj[eid][sid]) {
                  const exScore = exSubObj[eid][sid].score;
                  totalScore += parseFloat(exScore); 
                  exHtml += `<tr><td class="text-left">${ex.title}</td><td style="color:var(--text-green); font-weight:bold;">✅ สอบแล้ว</td><td style="color:var(--primary); font-weight:bold;">${exScore} / ${exMax}</td></tr>`;
              } else {
                  exHtml += `<tr><td class="text-left">${ex.title}</td><td style="color:var(--text-red); font-weight:bold;">❌ รอสอบ</td><td>- / ${exMax}</td></tr>`;
              }
          }); 
    }
    exHtml += '</tbody></table>'; 
    document.getElementById('res-exams').innerHTML = exHtml;

    document.getElementById('res-total').innerText = `รวม: ${totalScore} / ${maxScore}`; 
    document.getElementById('res-grade').innerText = getAutoGrade(totalScore, maxScore);

    const missingBox = document.getElementById('res-missing-box'); 
    const missingText = document.getElementById('res-missing-text');
    if (missingWorks.length > 0 && missingBox) { missingBox.style.display = 'block'; missingText.innerText = missingWorks.join(', '); } 
    else if (missingBox) { missingBox.style.display = 'none'; }

    if (chart1) chart1.destroy(); if (chart2) chart2.destroy();
    const ctx1 = document.getElementById('scoreChart');
    if(ctx1) { chart1 = new Chart(ctx1.getContext('2d'), { type: 'doughnut', data: { labels: ['คะแนนที่ได้', 'คะแนนที่หายไป'], datasets: [{ data: [totalScore, Math.max(0, maxScore - totalScore)], backgroundColor: ['#6366f1', '#e2e8f0'] }] }, options: { responsive: true, maintainAspectRatio: false } }); }
    const ctx2 = document.getElementById('attChart');
    if(ctx2) { chart2 = new Chart(ctx2.getContext('2d'), { type: 'pie', data: { labels: ['มา', 'สาย', 'ขาด', 'ลา', 'ป่วย'], datasets: [{ data: [stats['มา'], stats['สาย'], stats['ขาด'], stats['ลา'], stats['ป่วย']], backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'] }] }, options: { responsive: true, maintainAspectRatio: false } }); }
    
    if (isInitial) hideL();
  } catch (e) { handleFail(e); }
}

  // เรียกครั้งแรกพร้อม Spinner โหลด
  updateResultUI(true);

  // ผูกการติดตามการเปลี่ยนคะแนนและตรวจงาน
  db.ref(`scores`).on('value', () => updateResultUI(false));
  db.ref(`submissions/${cid}`).on('value', () => updateResultUI(false));
  db.ref(`exam_submissions/${cid}`).on('value', () => updateResultUI(false));
}

// ==========================================
// 📂 7. แฟ้มผลงาน (E-Portfolio) & อัปโหลดงาน
// ==========================================
function handleFileSelect(input) {
  if(input.files && input.files[0]) {
      currentUploadFile = input.files[0];
      document.getElementById('file-label').innerText = currentUploadFile.name;
      document.getElementById('btn-upload').style.display = 'block';
  }
}

async function uploadWork() { 
  if (!currentUploadFile) return showT('กรุณาเลือกไฟล์ก่อน', true);
  if (!lastSearchRes) return showT('ไม่พบข้อมูลนักเรียน', true);
  
  const selectTask = document.getElementById('upload-task-selector');
  const aid = selectTask.value;
  if (!aid) return showT('กรุณาเลือกภารกิจที่ต้องการส่ง', true);

  // 💡 ดึงชื่องาน นามสกุลไฟล์ และตั้งชื่อไฟล์ใหม่: ชื่องาน_เลขที่_ชื่อ
  const taskTitle = selectTask.options[selectTask.selectedIndex].text;
  const fileExt = currentUploadFile.name.split('.').pop();
  const fileName = `${taskTitle}_เลขที่${lastSearchRes.number}_${lastSearchRes.name}.${fileExt}`;

  const sid = lastSearchRes.id; const cid = lastSearchRes.cid;

  showL();
  document.getElementById('loading').innerHTML = '<div class="spinner"></div><b style="color:white; margin-top:10px;">กำลังส่งไฟล์พุ่งตรงเข้า Google Drive...</b>';

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Data = e.target.result.split(',')[1];
    try {
      const response = await fetch(GAS_UPLOAD_URL, { method: 'POST', redirect: 'follow', headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ base64: base64Data, fileName: fileName, mimeType: currentUploadFile.type }) });
      const result = await response.json();
      if(result.status === 'success') {
        await db.ref(`submissions/${cid}/${aid}/${sid}`).set({ url: result.fileUrl, fileName: fileName, timestamp: firebase.database.ServerValue.TIMESTAMP });
        document.getElementById('loading').innerHTML = '<div class="spinner"></div><b style="color:white; margin-top:10px;">กำลังประมวลผล...</b>';
        hideL(); showT('ส่งภารกิจลง Google Drive เรียบร้อย!');
        document.getElementById('btn-upload').style.display = 'none'; document.getElementById('file-label').innerText = 'คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวางที่นี่'; 
        currentUploadFile = null; document.getElementById('file-input').value = '';
      } else { throw new Error(result.message); }
    } catch(err) { document.getElementById('loading').innerHTML = '<div class="spinner"></div><b style="color:white; margin-top:10px;">กำลังประมวลผล...</b>'; handleFail(err); }
  };
  reader.readAsDataURL(currentUploadFile);
}
async function viewMyPortfolio() { 
  switchView('v-portfolio'); 
  if (!lastSearchRes) return showT('ไม่พบข้อมูลนักเรียน', true);
  const targetSid = lastSearchRes.id; const targetCid = lastSearchRes.cid;
  if (user && user.role === 'student') document.getElementById('btn-port-edit').style.display = 'inline-block'; else document.getElementById('btn-port-edit').style.display = 'none';

  showL();
  try {
    const snap = await db.ref(`students/${targetCid}/${targetSid}`).once('value');
    const studentData = snap.val() || {}; const port = studentData.portfolio || {};

    document.getElementById('port-name').innerText = studentData.name; document.getElementById('port-nickname').innerText = studentData.nickname ? `(${studentData.nickname})` : '';
    document.getElementById('port-bio').innerText = port.bio || 'ยังไม่มีข้อมูลแนะนำตัว...'; document.getElementById('port-edu').innerText = port.edu || 'ยังไม่ได้ระบุประวัติการศึกษา...';
    document.getElementById('port-img').src = port.img || 'https://cdn-icons-png.flaticon.com/512/1144/1144760.png'; document.getElementById('port-total-pts').innerText = studentData.points || 0;
    if(port.theme) previewPortTheme(port.theme);

    const worksContainer = document.getElementById('port-works-container');
    
    if (worksContainer) {
      if (port.pinnedWorks && Object.keys(port.pinnedWorks).length > 0) {
        // 💡 แก้ไข 1: เปลี่ยนจาก auto-fit เป็น auto-fill และเพิ่มขนาดขั้นต่ำเป็น 250px เพื่อไม่ให้รูปยืดกว้างเกินไปถ้ามีงานเดียว
        let worksHtml = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:15px;">';
        
        Object.keys(port.pinnedWorks).forEach(aid => { 
          const work = port.pinnedWorks[aid];
          
          let imgUrl = work.url;
          const match = imgUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || imgUrl.match(/id=([a-zA-Z0-9_-]+)/);
          if(match && match[1]) {
             imgUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800-h800`;
          }

          worksHtml += `
          <div style="background:var(--card-bg); border-radius:12px; border:1px solid var(--border-color); overflow:hidden; box-shadow:var(--shadow-soft); transition:transform 0.2s;">
            <a href="${work.url}" target="_blank" style="display:block; text-decoration:none;">
              <div style="width:100%; height:280px; background-color:#f8fafc; border-bottom:1px solid var(--border-color); position:relative; padding:5px; box-sizing:border-box;">
                <img src="${imgUrl}" alt="${work.title}" 
                     style="width:100%; height:100%; object-fit:contain; border-radius:4px;" 
                     onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/2912/2912134.png'; this.style.objectFit='contain'; this.style.padding='20px';">
              </div>
              <div style="padding:12px; text-align:center;">
                <h4 style="margin:0; color:var(--text-main); font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📌 ${work.title}</h4>
                <span style="font-size:0.8rem; color:var(--primary); margin-top:5px; display:block;">🔍 คลิกเพื่อดูไฟล์เต็ม</span>
              </div>
            </a>
          </div>`; 
        });
        
        worksHtml += '</div>'; 
        worksContainer.innerHTML = worksHtml;
      } else { 
        worksContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">ยังไม่ได้ปักหมุดผลงานเด่น</p>'; 
      }
    }

    const [asSnap, scSnap, exSnap, exSubSnap] = await Promise.all([ 
      db.ref(`assignments/${targetCid}`).once('value'), 
      db.ref(`scores`).once('value'),
      db.ref(`exams/${targetCid}`).once('value'),
      db.ref(`exam_submissions/${targetCid}`).once('value')
    ]);
    const asObj = asSnap.val() || {}; const scObj = scSnap.val() || {};
    const exObj = exSnap.val() || {}; const exSubObj = exSubSnap.val() || {};
    let totalScore = 0; let maxScore = 0;
    
    Object.keys(asObj).forEach(aid => { maxScore += parseFloat(asObj[aid].maxScore || 0); const score = (scObj[aid] && scObj[aid][targetSid] !== undefined) ? scObj[aid][targetSid] : '-'; if(score !== '-' && !isNaN(score)) totalScore += parseFloat(score); });
    
    Object.keys(exObj).forEach(eid => {
        let exMax = 0;
        if(exObj[eid].questions) exObj[eid].questions.forEach(q => exMax += (parseFloat(q.score) || 1));
        maxScore += exMax;
        if(exSubObj[eid] && exSubObj[eid][targetSid]) {
            totalScore += parseFloat(exSubObj[eid][targetSid].score);
        }
    });

    document.getElementById('port-total-score').innerText = totalScore; document.getElementById('port-avg-grade').innerText = getAutoGrade(totalScore, maxScore);
    hideL();
  } catch(e) { handleFail(e); }
}

function closePortfolio() { if (user && user.role === 'student') switchView('v-student-dash'); else switchView('v-detail'); }

async function openEditPortfolio() { 
  if (!user || user.role !== 'student' || !lastSearchRes) return;
  const targetSid = lastSearchRes.id; const targetCid = lastSearchRes.cid;
  showL();
  try {
    const snap = await db.ref(`students/${targetCid}/${targetSid}/portfolio`).once('value');
    const port = snap.val() || {};
    document.getElementById('ed-port-bio').value = port.bio || ''; document.getElementById('ed-port-edu').value = port.edu || '';
    document.getElementById('ed-port-theme').value = port.theme || 'minimal'; document.getElementById('ed-port-img').value = port.img || ''; 

    const [asSnap, subSnap] = await Promise.all([ db.ref(`assignments/${targetCid}`).once('value'), db.ref(`submissions/${targetCid}`).once('value') ]);
    const assignments = asSnap.val() || {}; const submissions = subSnap.val() || {}; const pinnedWorks = port.pinnedWorks || {}; 

    let workListHtml = '';
    Object.keys(assignments).forEach(aid => {
      const task = assignments[aid];
      if (submissions[aid] && submissions[aid][targetSid]) {
        const subData = submissions[aid][targetSid]; const isChecked = pinnedWorks[aid] ? 'checked' : '';
        workListHtml += `<label style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px dashed var(--border-color); cursor:pointer;"><input type="checkbox" class="pin-work-chk" value="${aid}" data-title="${task.title}" data-url="${subData.url}" ${isChecked} style="width:20px; height:20px; cursor:pointer;"><div style="flex:1;"><b style="color:var(--text-main); font-size:0.95rem;">${task.title}</b><br><a href="${subData.url}" target="_blank" style="font-size:0.8rem; color:var(--primary); text-decoration:none;">ดูไฟล์ที่ส่ง 🔗</a></div></label>`;
      }
    });

    const workContainer = document.getElementById('ed-port-work-list');
    if (workContainer) workContainer.innerHTML = workListHtml || '<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; margin-top:10px;">ยังไม่มีผลงานที่ส่งในระบบ</p>';
    hideL(); openModal('m-portfolio-edit');
  } catch(e) { handleFail(e); }
}

function uploadPortImg(input) { 
  if (input.files && input.files[0]) {
    const reader = new FileReader(); reader.onload = function(e) { document.getElementById('ed-port-img').value = e.target.result; showT('อัปโหลดรูปภาพสำเร็จ! (อย่าลืมกดบันทึก)'); }; reader.readAsDataURL(input.files[0]);
  }
}

async function saveMyPortfolio() { 
  if (!user || user.role !== 'student' || !lastSearchRes) return;
  const targetSid = lastSearchRes.id; const targetCid = lastSearchRes.cid;
  const bio = document.getElementById('ed-port-bio').value.trim(); const edu = document.getElementById('ed-port-edu').value.trim();
  const theme = document.getElementById('ed-port-theme').value; const imgBase64 = document.getElementById('ed-port-img').value;

  let pinnedWorks = {};
  document.querySelectorAll('.pin-work-chk:checked').forEach(chk => { pinnedWorks[chk.value] = { title: chk.dataset.title, url: chk.dataset.url }; });

  showL();
  try {
    await db.ref(`students/${targetCid}/${targetSid}/portfolio`).update({ bio: bio, edu: edu, theme: theme, img: imgBase64, pinnedWorks: Object.keys(pinnedWorks).length > 0 ? pinnedWorks : null });
    hideL(); closeModal('m-portfolio-edit'); showT('บันทึกแฟ้มสะสมผลงานสำเร็จ!'); viewMyPortfolio(); 
  } catch(e) { handleFail(e); }
}

function previewPortTheme(themeName) { document.getElementById('port-container').className = `theme-${themeName}`; }

function printPortfolio() {
    const buddy = document.getElementById('buddy-btn');
    if (buddy) buddy.style.display = 'none';
    document.body.classList.add('print-portfolio');
    window.print();
    setTimeout(() => { 
        document.body.classList.remove('print-portfolio');
        if (buddy && user && user.role !== 'admin' && user.role !== 'superadmin') buddy.style.display = 'flex'; 
    }, 1000);
}
