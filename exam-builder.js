// ==========================================
// 📝 9. ระบบจัดการข้อสอบ (Exam Builder)
// ==========================================
let currentEditExamId = null;
let currentQuestions = [];

function openExamBuilder(data = null) {
  currentEditExamId = null;
  currentQuestions = [];

  // เช็คก่อนว่ามีกล่องรับข้อมูลอยู่ไหม เพื่อป้องกัน Error
  if (document.getElementById('ex-title')) document.getElementById('ex-title').value = '';
  if (document.getElementById('ex-full-title')) document.getElementById('ex-full-title').value = '';
  if (document.getElementById('ex-max-score')) document.getElementById('ex-max-score').value = '';
  if (document.getElementById('ex-show-score')) document.getElementById('ex-show-score').checked = true;
  if (document.getElementById('ex-show-answer')) document.getElementById('ex-show-answer').checked = true;
  if (document.getElementById('ex-random-q')) document.getElementById('ex-random-q').checked = false;
  if (document.getElementById('ex-random-opt')) document.getElementById('ex-random-opt').checked = false;
  if (document.getElementById('ex-time-limit')) document.getElementById('ex-time-limit').value = '';
  if (document.getElementById('exam-questions-container')) document.getElementById('exam-questions-container').innerHTML = '';
  if (document.getElementById('question-container')) document.getElementById('question-container').innerHTML = 'ยังไม่มีคำถาม กดเพิ่มด้านล่างเลย!';
  if (document.getElementById('builder-title')) document.getElementById('builder-title').innerText = 'สร้างข้อสอบใหม่';
  
  switchView('v-exam-builder');
}

// 💡 1. ฟังก์ชันจัดการรูปลง "คำถาม"
let currentUploadQuestionId = null;
function triggerExamImageUpload(qId) {
    currentUploadQuestionId = qId;
    let input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => processExamImageUpload(e.target);
    input.click();
}
function processExamImageUpload(input) {
    if (input.files && input.files[0]) {
        if (input.files[0].size > 2 * 1024 * 1024) return showT('ไฟล์รูปใหญ่เกินไป (จำกัด 2MB)', true);
        showL();
        const reader = new FileReader();
        reader.onload = function(e) {
            const b64 = e.target.result; const qId = currentUploadQuestionId;
            document.getElementById(`img-preview-${qId}`).src = b64;
            document.getElementById(`img-preview-${qId}`).style.display = 'block';
            document.getElementById(`img-data-${qId}`).value = b64;
            document.getElementById(`btn-remove-img-${qId}`).style.display = 'inline-flex';
            hideL();
        };
        reader.readAsDataURL(input.files[0]);
    }
}
function removeExamImage(qId) {
    document.getElementById(`img-preview-${qId}`).src = '';
    document.getElementById(`img-preview-${qId}`).style.display = 'none';
    document.getElementById(`img-data-${qId}`).value = '';
    document.getElementById(`btn-remove-img-${qId}`).style.display = 'none';
}

// 💡 2. ฟังก์ชันจัดการรูปลง "ตัวเลือก (ช้อยส์)"
let currentUploadOption = { qId: null, optIndex: null };
function triggerOptionImageUpload(qId, optIndex) {
    currentUploadOption = { qId, optIndex };
    let input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => processOptionImageUpload(e.target);
    input.click();
}
function processOptionImageUpload(input) {
    if (input.files && input.files[0]) {
        if (input.files[0].size > 2 * 1024 * 1024) return showT('ไฟล์รูปใหญ่เกินไป (จำกัด 2MB)', true);
        showL();
        const reader = new FileReader();
        reader.onload = function(e) {
            const b64 = e.target.result; const { qId, optIndex } = currentUploadOption;
            document.getElementById(`opt-img-preview-${qId}-${optIndex}`).src = b64;
            document.getElementById(`opt-img-preview-${qId}-${optIndex}`).style.display = 'block';
            document.getElementById(`opt-img-data-${qId}-${optIndex}`).value = b64;
            document.getElementById(`btn-remove-opt-img-${qId}-${optIndex}`).style.display = 'inline-flex';
            hideL();
        };
        reader.readAsDataURL(input.files[0]);
    }
}
function removeOptionImage(qId, optIndex) {
    document.getElementById(`opt-img-preview-${qId}-${optIndex}`).src = '';
    document.getElementById(`opt-img-preview-${qId}-${optIndex}`).style.display = 'none';
    document.getElementById(`opt-img-data-${qId}-${optIndex}`).value = '';
    document.getElementById(`btn-remove-opt-img-${qId}-${optIndex}`).style.display = 'none';
}

// 💡 3. ฟังก์ชันสร้างกล่องข้อสอบ (แบบมีรูปทั้งคำถามและตัวเลือก)
function addQuestionUI(type, qData = null) {
  const container = document.getElementById('exam-questions-container');
  if(!container) return;
  const qId = 'q_' + Date.now() + Math.floor(Math.random() * 1000); 

  let scoreVal = qData && qData.score !== undefined ? qData.score : 1; 
  let textVal = qData ? qData.text : '';
  let imgVal = qData && qData.image ? qData.image : ''; 

  let imgHtml = `
    <div style="margin-top: 5px; margin-bottom: 15px;">
      <button type="button" class="btn-img-upload" onclick="triggerExamImageUpload('${qId}')">🖼️ แทรกรูปภาพในคำถาม</button>
      <button type="button" class="btn-img-upload" id="btn-remove-img-${qId}" style="display: ${imgVal ? 'inline-flex' : 'none'}; background: var(--bg-red); color: var(--text-red); border-color: var(--border-red);" onclick="removeExamImage('${qId}')">🗑️ ลบรูปคำถาม</button>
      <div style="margin-top: 10px;">
         <img id="img-preview-${qId}" class="exam-img-preview" src="${imgVal}" style="display: ${imgVal ? 'block' : 'none'};">
         <input type="hidden" class="q-image-data" id="img-data-${qId}" value="${imgVal}">
      </div>
    </div>
  `;

  let html = `<div class="card exam-q-card" id="${qId}" data-type="${type}">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center; flex-wrap:wrap; gap:10px;">
                  <h4 style="color:var(--primary); margin:0;">
                    ${type === 'mcq' ? '🔘 ข้อสอบแบบเลือกตอบ' : type === 'tf' ? '✅/❌ ข้อสอบถูก-ผิด' : '✍️ พิมพ์ตอบสั้นๆ'}
                  </h4>
                  <div style="display:flex; gap:10px; align-items:center;">
                    <label style="font-weight:600; font-size:0.9rem; color:var(--text-main);">⭐ คะแนน:</label>
                    <input type="number" class="q-score" value="${scoreVal}" min="0.5" step="0.5" style="width:70px; padding:6px; border-radius:6px; border:2px solid var(--border-color); text-align:center;">
                    <button type="button" class="btn-sm btn-red" style="border:none; cursor:pointer; padding:6px 12px;" onclick="document.getElementById('${qId}').remove()">🗑️ ลบข้อนี้</button>
                  </div>
                </div>
                <div class="form-group" style="margin-bottom: 5px;">
                  <textarea placeholder="พิมพ์คำถามที่นี่..." class="q-text" rows="2">${textVal}</textarea>
                </div>
                ${imgHtml}`;

  if (type === 'mcq') {
    let optVals = qData && qData.options ? qData.options : ['', '', '', ''];
    let optImgs = qData && qData.optionImages ? qData.optionImages : ['', '', '', ''];
    let correctIdx = qData && qData.correct !== undefined ? qData.correct : -1;
    html += `<div class="q-options">`;
    for(let i=0; i<4; i++){
      let isChecked = correctIdx === i ? 'checked' : '';
      let oImg = optImgs[i] || '';
      html += `
      <div class="exam-opt-row" style="flex-direction: column; align-items: flex-start; padding-bottom: 15px; border-bottom: 1px dashed var(--border-color);">
        <div style="display:flex; width: 100%; align-items: center; gap: 10px;">
            <input type="radio" name="ans_${qId}" value="${i+1}" ${isChecked}> 
            <input type="text" placeholder="พิมพ์ข้อความตัวเลือก ${i+1}" class="opt-text" value="${optVals[i]}" style="flex:1;">
        </div>
        <div style="margin-left: 28px; margin-top: 8px; display:flex; flex-direction:column; gap:5px;">
            <div style="display:flex; gap:10px;">
                <button type="button" class="btn-sm btn-outline" onclick="triggerOptionImageUpload('${qId}', ${i})" style="font-size:0.75rem;">🖼️ แทรกรูปช้อยส์ ${i+1}</button>
                <button type="button" class="btn-sm btn-red" id="btn-remove-opt-img-${qId}-${i}" style="display: ${oImg ? 'inline-flex' : 'none'}; font-size:0.75rem;" onclick="removeOptionImage('${qId}', ${i})">🗑️ ลบรูปช้อยส์</button>
            </div>
            <img id="opt-img-preview-${qId}-${i}" src="${oImg}" style="max-height: 100px; border-radius: 8px; display: ${oImg ? 'block' : 'none'}; border: 1px solid var(--border-color);">
            <input type="hidden" class="opt-img-data" id="opt-img-data-${qId}-${i}" value="${oImg}">
        </div>
      </div>`;
    }
    html += `</div><p style="color:var(--text-red); font-size:0.85rem; margin-top:5px;">* อย่าลืมติ๊กวงกลมด้านหน้าเพื่อกำหนดข้อที่ถูกต้อง</p>`;
  } else if (type === 'tf') {
    let isTrueChecked = qData && qData.correct === true ? 'checked' : '';
    let isFalseChecked = qData && qData.correct === false ? 'checked' : '';
    html += `<div class="q-options" style="display:flex; gap:30px; padding: 10px; background: var(--bg); border-radius: 8px;">
               <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600;"><input type="radio" name="ans_${qId}" value="true" style="width:20px; height:20px;" ${isTrueChecked}> ✅ ประโยคนี้ถูกต้อง</label>
               <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600;"><input type="radio" name="ans_${qId}" value="false" style="width:20px; height:20px;" ${isFalseChecked}> ❌ ประโยคนี้ผิด</label>
             </div>`;
  } else if (type === 'short') {
    let ansVal = qData && qData.correct ? qData.correct : '';
    html += `<div class="form-group"><input type="text" placeholder="พิมพ์คีย์เวิร์ดเฉลยที่ถูกต้อง..." class="q-answer" value="${ansVal}"></div><p style="color:var(--text-muted); font-size:0.85rem;">* ระบบจะตรวจจับข้อความตรงกับคีย์เวิร์ดนี้</p>`;
  }

  html += `</div>`;
  container.insertAdjacentHTML('beforeend', html);
  closeModal('m-add-question');
}

// เผื่อปุ่มสร้างข้อสอบใช้ addQuestion ของเก่า
function addQuestion(type) {
    const typeMap = { multiple: 'mcq', truefalse: 'tf', short: 'short' };
    addQuestionUI(typeMap[type] || type);
}

// 💡 4. ฟังก์ชันบันทึกข้อสอบ (บันทึกรูปช้อยส์ด้วย)
async function saveExamData() {
  const titleInput = document.getElementById('ex-title') || document.getElementById('ex-full-title');
  const title = titleInput ? titleInput.value.trim() : '';
  if(!title) return showT('กรุณากรอกชื่อชุดข้อสอบด้วยครับ', true);
  if(!cid) return showT('ไม่พบรหัสห้องเรียน กรุณาเข้าห้องเรียนใหม่อีกครั้ง', true);

  const showScore = document.getElementById('ex-show-score') ? document.getElementById('ex-show-score').checked : true;
  const showAnswer = document.getElementById('ex-show-answer') ? document.getElementById('ex-show-answer').checked : true;
  const randomQ = document.getElementById('ex-random-q') ? document.getElementById('ex-random-q').checked : false;
  const randomOpt = document.getElementById('ex-random-opt') ? document.getElementById('ex-random-opt').checked : false;
  const timeLimit = document.getElementById('ex-time-limit') ? parseInt(document.getElementById('ex-time-limit').value) || 0 : 0;

  const qCards = document.querySelectorAll('.exam-q-card');
  if (qCards.length === 0) return showT('กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ', true);

  let questions = []; let hasError = false;

  qCards.forEach((card, index) => {
    const type = card.dataset.type;
    const qText = card.querySelector('.q-text').value.trim();
    const scoreVal = parseFloat(card.querySelector('.q-score').value) || 1; 
    const imgData = card.querySelector('.q-image-data').value; 
    
    if (!qText && !imgData) { showT(`กรุณากรอกคำถามหรือแทรกรูปในข้อที่ ${index + 1}`, true); hasError = true; return; }

    let qData = { type: type, text: qText, score: scoreVal, image: imgData }; 

    if (type === 'mcq') {
      const options = card.querySelectorAll('.opt-text');
      const optImgInputs = card.querySelectorAll('.opt-img-data'); // ดึงภาพตัวเลือก
      const radios = card.querySelectorAll('input[type="radio"]:checked');
      if (radios.length === 0) { showT(`กรุณาเลือกข้อที่ถูกต้องในข้อที่ ${index + 1}`, true); hasError = true; return; }
      
      qData.options = Array.from(options).map(opt => opt.value.trim());
      qData.optionImages = Array.from(optImgInputs).map(inp => inp.value); // บันทึกรูปตัวเลือก
      
      // เช็คว่าแต่ละตัวเลือก มีข้อความ หรือ รูปภาพ อย่างน้อย 1 อย่างหรือไม่
      for(let i=0; i<4; i++) {
         if(!qData.options[i] && !qData.optionImages[i]) {
             showT(`กรุณากรอกข้อความหรือใส่รูปในตัวเลือกที่ ${i+1} (ข้อ ${index + 1})`, true);
             hasError = true; return;
         }
      }

      qData.correct = parseInt(radios[0].value) - 1;
    } else if (type === 'tf') {
      const radios = card.querySelectorAll('input[type="radio"]:checked');
      if (radios.length === 0) { showT(`กรุณาเลือก ถูก/ผิด ในข้อที่ ${index + 1}`, true); hasError = true; return; }
      qData.correct = radios[0].value === 'true';
    } else if (type === 'short') {
      const ansText = card.querySelector('.q-answer').value.trim();
      if (!ansText && !imgData) { showT(`กรุณากรอกคีย์เวิร์ดเฉลยในข้อที่ ${index + 1}`, true); hasError = true; return; }
      qData.correct = ansText;
    }
    questions.push(qData);
  });

  if (hasError) return;

  showL();
  try {
    let examRef = currentEditExamId ? db.ref(`exams/${cid}/${currentEditExamId}`) : db.ref(`exams/${cid}`).push(); 
    await examRef.set({ title: title, settings: { showScore, showAnswer, randomQ, randomOpt, timeLimit }, questions: questions, updatedAt: firebase.database.ServerValue.TIMESTAMP });

    hideL();
    if(typeof Swal !== 'undefined') {
      Swal.fire({ icon: 'success', title: currentEditExamId ? 'บันทึกการแก้ไขสำเร็จ!' : 'สร้างข้อสอบสำเร็จ!', text: 'ข้อมูลเข้าสู่ฐานข้อมูลเรียบร้อยแล้ว' }).then(() => {
        currentEditExamId = null; switchView('v-exams'); loadExamsList(); 
      });
    } else {
        showT('บันทึกข้อมูลสำเร็จ'); switchView('v-exams'); loadExamsList(); 
    }
  } catch (error) { handleFail(error); }
}
async function loadExamsList() {
  if(!cid) return;
  showL();
  try {
    const snap = await db.ref(`exams/${cid}`).once('value');
    const examsObj = snap.val() || {};
    const list = document.getElementById('exam-list');
    
    let html = ''; const keys = Object.keys(examsObj);
    
    if(keys.length === 0) {
      html = '<p style="text-align:center; grid-column:1/-1;">ยังไม่มีชุดข้อสอบ กดสร้างข้อสอบใหม่ได้เลยครับ</p>';
    } else {
      keys.forEach(eid => {
        const ex = examsObj[eid];
        const qCount = ex.questions ? ex.questions.length : 0;
        html += `<div class="card" style="border-left: 5px solid var(--primary);"><h3 style="margin-bottom:10px;">📝 ${ex.title}</h3><p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:15px;">จำนวน ${qCount} ข้อ</p><div style="display:flex; gap:10px; margin-top:15px;"><button class="btn btn-primary" style="flex:1;" onclick="viewExamScores('${eid}', '${ex.title}')">📊 ดูคะแนน</button><button class="btn btn-outline" style="flex:1;" onclick="editExam('${eid}')">⚙️ แก้ไข</button><button class="btn btn-red" style="flex:1;" onclick="deleteExam('${eid}')">🗑️ ลบ</button></div></div>`;
      });
    }
    list.innerHTML = html; hideL();
  } catch (error) { handleFail(error); }
}

function deleteExam(examId) {
  if(confirm('คุณแน่ใจหรือไม่ว่าจะลบข้อสอบชุดนี้?')) {
    showL(); db.ref(`exams/${cid}/${examId}`).remove().then(() => { hideL(); showT('ลบข้อสอบเรียบร้อย'); loadExamsList(); }).catch(handleFail);
  }
}

async function editExam(examId) {
  showL();
  try {
    const snap = await db.ref(`exams/${cid}/${examId}`).once('value');
    const examData = snap.val();
    if(!examData) { hideL(); return showT('ไม่พบข้อมูลข้อสอบ', true); }

    currentEditExamId = examId; 
    document.getElementById('ex-title').value = examData.title || '';
    if(document.getElementById('ex-show-score')) document.getElementById('ex-show-score').checked = examData.settings?.showScore ?? true;
    if(document.getElementById('ex-show-answer')) document.getElementById('ex-show-answer').checked = examData.settings?.showAnswer ?? true;
    if(document.getElementById('ex-random-q')) document.getElementById('ex-random-q').checked = examData.settings?.randomQ ?? false;
    if(document.getElementById('ex-random-opt')) document.getElementById('ex-random-opt').checked = examData.settings?.randomOpt ?? false;
    if(document.getElementById('ex-time-limit')) document.getElementById('ex-time-limit').value = examData.settings?.timeLimit || '';
    
    if(document.getElementById('exam-questions-container')) document.getElementById('exam-questions-container').innerHTML = '';
    
    if(examData.questions) { examData.questions.forEach(q => { addQuestionUI(q.type, q); }); }

    document.getElementById('builder-title').innerText = 'แก้ไขข้อสอบ';
    hideL(); switchView('v-exam-builder'); 
  } catch(error) { handleFail(error); }
}

