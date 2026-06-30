// 🤖 13. ระบบ AI วิเคราะห์ผู้เรียน (Gemini)
// ==========================================
async function analyzeStudentWithAI(sid) {
  if (!cid) return showT('ไม่พบห้องเรียน', true);
  const student = students.find(s => s.id === sid);
  if (!student) return showT('ไม่พบข้อมูลนักเรียน', true);

  document.getElementById('ai-student-name').innerText = `กำลังวิเคราะห์: ${student.name} (เลขที่ ${student.number})`;
  document.getElementById('ai-analysis-result').innerHTML = '<div style="text-align:center; padding:20px;"><div class="spinner" style="margin: 0 auto 10px auto; border-color: rgba(99,102,241,0.3); border-top-color: var(--primary);"></div><span style="color:var(--primary); font-weight:bold;">คู่หู AI กำลังรวบรวมข้อมูลและประมวลผล... 🪄</span></div>';
  openModal('m-ai-analytics');

  try {
    const [asSnap, scSnap, atSnap] = await Promise.all([ db.ref(`assignments/${cid}`).once('value'), db.ref(`scores`).once('value'), db.ref(`attendance/${cid}`).once('value') ]);
    const asObj = asSnap.val() || {}; const scObj = scSnap.val() || {}; const atObj = atSnap.val() || {};
    let totalScore = 0; let maxScore = 0; let missingTasks = []; let scoreDetails = [];

    Object.keys(asObj).forEach(aid => {
      const task = asObj[aid]; const score = (scObj[aid] && scObj[aid][sid] !== undefined) ? scObj[aid][sid] : '-';
      maxScore += parseFloat(task.maxScore || 0);
      if (score === '-' || score === '') { missingTasks.push(task.title); } else { totalScore += parseFloat(score); scoreDetails.push(`${task.title} (ได้ ${score}/${task.maxScore})`); }
    });

    let stats = { "มา": 0, "สาย": 0, "ขาด": 0, "ลา": 0, "ป่วย": 0 };
    Object.values(atObj).forEach(day => { if (day[sid]) stats[day[sid]]++; });

    const promptText = `
    คุณคือผู้ช่วยครู AI (LMS Hero Edition) วิเคราะห์ข้อมูลนักเรียนประถม
    ข้อมูลนักเรียน: ${student.name}
    การเข้าเรียน: มา ${stats["มา"]} ครั้ง, ขาด ${stats["ขาด"]} ครั้ง, สาย ${stats["สาย"]} ครั้ง, ลา/ป่วย ${stats["ลา"] + stats["ป่วย"]} ครั้ง
    คะแนนรวม: ${totalScore} จากคะแนนเต็ม ${maxScore}
    คะแนนรายวิชา: ${scoreDetails.length > 0 ? scoreDetails.join(', ') : 'ยังไม่มีคะแนน'}
    งานที่ค้างส่ง: ${missingTasks.length > 0 ? missingTasks.join(', ') : 'ไม่มีงานค้าง'}

    โปรดเขียนบทวิเคราะห์สั้นๆ (ไม่เกิน 4-5 บรรทัด) เป็นภาษาไทย เป็นมิตรและให้กำลังใจครู โดยระบุ:
    1. จุดเด่นของเด็กคนนี้
    2. จุดอ่อนหรือเรื่องที่ต้องติดตาม
    3. คำแนะนำสั้นๆ ที่ครูควรนำไปปรับใช้
    `;
    // TODO: เรียก AI จาก Backend เพื่อความปลอดภัย
    // await fetch('/api/ai/chat', ...);
    document.getElementById('ai-analysis-result').innerHTML = '<span style="color:red;">ระบบ AI กำลังปรับปรุง (ย้ายไปประมวลผลบนเซิร์ฟเวอร์เพื่อความปลอดภัย)</span>';
    return;

    const data = await response.json();
    if (!response.ok) { throw new Error(data.error ? data.error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ API ของ Google"); }

    const reply = data.candidates[0].content.parts[0].text;
    const formattedReply = reply.replace(/\*\*(.*?)\*\*/g, '<b style="color:var(--primary);">$1</b>').replace(/\n/g, '<br>');
    document.getElementById('ai-analysis-result').innerHTML = formattedReply;
  } catch (error) {
    console.error("AI Error:", error);
    document.getElementById('ai-analysis-result').innerHTML = `<span style="color:var(--text-red); font-weight:bold;">❌ พลังเวทมนตร์ขัดข้อง:</span><br><span style="font-size:0.95rem; color:var(--text-main);">${error.message}</span>`;
  }
}

// ==========================================
// 📊 14. กราฟเรดาร์สถิติฮีโร่ (Spider Chart)
// ==========================================
function openSpiderChart(sid) {
  const student = students.find(s => s.id === sid);
  if (!student) return;

  document.getElementById('spider-student-name').innerText = `อัศวิน: ${student.name}`;
  openModal('m-spider-chart');

  const ctx = document.getElementById('heroSpiderCanvas').getContext('2d');
  if (window.heroRadarChart) { window.heroRadarChart.destroy(); }

  const heroPoints = student.points || 0;
  const stats = [ heroPoints, Math.floor(Math.random() * 40) + 60, Math.floor(Math.random() * 30) + 70, Math.floor(Math.random() * 50) + 50, Math.floor(Math.random() * 40) + 60 ];

  window.heroRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['พลังสะสม', 'ความรับผิดชอบ', 'การเข้าเรียน', 'ทีมเวิร์ค', 'คะแนนสอบ'],
      datasets: [{ label: 'สถิติพลัง', data: stats, backgroundColor: 'rgba(5, 150, 105, 0.2)', borderColor: 'rgba(5, 150, 105, 1)', pointBackgroundColor: 'rgba(99, 102, 241, 1)', borderWidth: 2 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { r: { angleLines: { color: 'rgba(0, 0, 0, 0.1)' }, grid: { color: 'rgba(0, 0, 0, 0.1)' }, pointLabels: { font: { size: 13, family: 'Kanit' }, color: '#475569' }, ticks: { display: false, min: 0, max: 100 } } },
      plugins: { legend: { display: false } }
    }
  });
}

// ==========================================
// 👁️ 15. ระบบตัวนับผู้เข้าชม (Visitor Counter)
// ==========================================
async function initVisitorCounter() {
  try {
    const counterRef = db.ref('system_settings/visitorCount');
    if (!sessionStorage.getItem('hasVisitedLMS')) {
      await counterRef.transaction((currentCount) => { return (currentCount || 0) + 1; });
      sessionStorage.setItem('hasVisitedLMS', 'true');
    }
    counterRef.on('value', (snap) => {
      const count = snap.val() || 0; const display = document.getElementById('visitor-count-text');
      if (display) { display.innerHTML = `👁️ ผู้เข้าชมทั้งหมด: <b>${count.toLocaleString()}</b> ครั้ง`; }
    });
  } catch(e) { console.error("Counter Error:", e); }
}
setTimeout(() => { initVisitorCounter(); }, 1000);


// ==========================================
