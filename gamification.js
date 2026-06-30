// ==========================================
// 🎮 4. ระบบ Gamification (ระบบวิวัฒนาการ 6 ระดับ ด้วยแต้มพลังฮีโร่ 🌟)
// ==========================================

// 💡 ฝัง CSS แอนิเมชันสุดอลังการเข้าไปในเว็บโดยอัตโนมัติ (รองรับ 6 ระดับ)
if (!document.getElementById('gami-epic-styles')) {
    const style = document.createElement('style');
    style.id = 'gami-epic-styles';
    style.innerHTML = `
        @keyframes float-gami { 0% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } 100% { transform: translateY(0px) scale(1); } }
        @keyframes glow-gami { 0% { filter: drop-shadow(0 0 10px rgba(255,215,0,0.5)); } 50% { filter: drop-shadow(0 0 30px rgba(255,215,0,0.9)) drop-shadow(0 0 50px rgba(255,255,255,0.6)); } 100% { filter: drop-shadow(0 0 10px rgba(255,215,0,0.5)); } }
        @keyframes shine-bar { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .evo-bar-bg { width: 100%; max-width: 250px; height: 16px; background: rgba(0,0,0,0.3); border-radius: 20px; margin: 15px auto; border: 2px solid rgba(255,255,255,0.4); overflow: hidden; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5); }
        .evo-bar-fill { height: 100%; border-radius: 20px; background: linear-gradient(90deg, #fbbf24, #fffbeb, #f59e0b); background-size: 200% auto; animation: shine-bar 2s linear infinite; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
        .stage-0 { animation: float-gami 4s ease-in-out infinite; }
        .stage-1 { animation: float-gami 3.5s ease-in-out infinite; filter: drop-shadow(0 5px 10px rgba(255,255,255,0.3)); }
        .stage-2 { animation: float-gami 3s ease-in-out infinite; filter: drop-shadow(0 5px 15px rgba(255,255,255,0.5)); }
        .stage-3 { animation: float-gami 2.5s ease-in-out infinite, glow-gami 4s infinite; }
        .stage-4 { animation: float-gami 2s ease-in-out infinite, glow-gami 2.5s infinite; transform: scale(1.1); }
        .stage-5 { animation: float-gami 1.5s ease-in-out infinite, glow-gami 1.5s infinite; transform: scale(1.25); }
    `;
    document.head.appendChild(style);
}

// 💡 4.1 กำหนดชุดข้อมูลวิวัฒนาการ 6 ขั้น (0, 20, 40, 60, 80, 100)
const gamificationAssets = {
  tree: {
    bg: 'linear-gradient(135deg, #059669, #10b981, #047857)', 
    stages: [
      { min: 0, icon: '🌱', name: 'เมล็ดพันธุ์', desc: 'รดน้ำด้วยพลังฮีโร่...' },
      { min: 20, icon: '🪴', name: 'ต้นกล้าแห่งความหวัง', desc: 'ยอดเยี่ยม! ใบเริ่มผลิแล้ว' },
      { min: 40, icon: '🌿', name: 'ต้นไม้เล็ก', desc: 'ลำต้นเริ่มแข็งแรง!' },
      { min: 60, icon: '🌳', name: 'พฤกษาแห่งปัญญา', desc: 'เติบโตแข็งแกร่ง แผ่กิ่งก้านสาขา' },
      { min: 80, icon: '🌸', name: 'ต้นไม้ผลิดอก', desc: 'ดอกไม้แห่งความพยายามเบ่งบาน!' },
      { min: 100, icon: '🍎🌳', name: 'ต้นไม้ทองคำระดับตำนาน', desc: 'สุดยอดฮีโร่! ผลผลิตแห่งความสำเร็จ' }
    ]
  },
  pet: {
    bg: 'linear-gradient(135deg, #d97706, #f59e0b, #b45309)',
    stages: [
      { min: 0, icon: '🥚', name: 'ไข่ปริศนา', desc: 'ฟักไข่ด้วยแต้มความดี...' },
      { min: 20, icon: '🐣', name: 'เบบี้มังกร', desc: 'เปลือกไข่เริ่มร้าวแล้ว!' },
      { min: 40, icon: '🐲', name: 'มังกรน้อย', desc: 'ลืมตาดูโลกแล้ว! น่ารักจัง' },
      { min: 60, icon: '🐉', name: 'มังกรวัยรุ่น', desc: 'มีปีกบินได้แล้ว! แข็งแกร่งขึ้น' },
      { min: 80, icon: '🔥', name: 'มังกรเพลิง', desc: 'พ่นไฟได้แล้ว! ทรงพลังมาก' },
      { min: 100, icon: '👑🐉', name: 'ราชันย์มังกรสวรรค์', desc: 'สัตว์เลี้ยงคู่กายระดับตำนาน!' }
    ]
  },
  rpg: {
    bg: 'linear-gradient(135deg, #1f2937, #374151, #111827)',
    stages: [
      { min: 0, icon: '🛡️', name: 'ทหารฝึกหัด', desc: 'สะสมแต้มเพื่อก้าวเป็นฮีโร่...' },
      { min: 20, icon: '🗡️', name: 'นักดาบฝึกหัด', desc: 'ได้รับดาบไม้ เริ่มต้นการเดินทาง!' },
      { min: 40, icon: '⚔️', name: 'นักดาบผู้กล้า', desc: 'ได้รับดาบเหล็กกล้า พร้อมลุย!' },
      { min: 60, icon: '🛡️⚔️', name: 'อัศวินเกราะเหล็ก', desc: 'สวมเกราะเต็มยศ พลังป้องกันเพิ่มขึ้น!' },
      { min: 80, icon: '⚡', name: 'อัศวินเวทมนตร์', desc: 'ผสานพลังเวทและดาบ ทรงพลังสุดๆ!' },
      { min: 100, icon: '👑', name: 'ราชาแห่งผู้กล้า', desc: 'ผู้พิชิตทุกภารกิจ!' }
    ]
  },
  fairy: {
    bg: 'linear-gradient(135deg, #db2777, #ec4899, #be185d)',
    stages: [
      { min: 0, icon: '🪄', name: 'คทาฝึกหัด', desc: 'รวบรวมแต้มละอองเวทมนตร์...' },
      { min: 20, icon: '✨', name: 'ละอองแสง', desc: 'พลังเวทเริ่มก่อตัวเป็นรูปร่าง!' },
      { min: 40, icon: '🧚‍♂️', name: 'ภูตน้อย', desc: 'ภูตน้อยตื่นจากการหลับใหล!' },
      { min: 60, icon: '🦋', name: 'ภูตปีกสีรุ้ง', desc: 'ปีกสยายสวยงาม บินได้สูงขึ้น!' },
      { min: 80, icon: '🧚‍♀️', name: 'นางฟ้าพิทักษ์', desc: 'ร่ายมนตร์แห่งปัญญาช่วยเหลือเพื่อนๆ!' },
      { min: 100, icon: '👑🧚‍♀️✨', name: 'ราชินีแดนเนรมิต', desc: 'พลังเวทมนตร์ขั้นสูงสุด!' }
    ]
  }
};

// 💡 4.2 วาดหน้าจอและคำนวณหลอดวิวัฒนาการด้วย "พลังฮีโร่"
function renderDashGamification() {
  const themeSelector = document.getElementById('dash-theme-selector');
  if (!themeSelector) return;
  
  const theme = themeSelector.value;
  const dashIcon = document.getElementById('dash-icon');
  const dashNextLevel = document.getElementById('dash-next-level');
  const heroHeader = document.querySelector('.hero-header'); 

  const currentPoints = lastSearchRes ? (parseFloat(lastSearchRes.points) || 0) : 0;
  const asset = gamificationAssets[theme];

  if (asset) {
      if (heroHeader) heroHeader.style.background = asset.bg; 

      // หาระดับร่างปัจจุบัน
      let currentStageIdx = 0;
      for (let i = asset.stages.length - 1; i >= 0; i--) {
        if (currentPoints >= asset.stages[i].min) { currentStageIdx = i; break; }
      }
      
      const stage = asset.stages[currentStageIdx];
      const nextStage = asset.stages[currentStageIdx + 1];

      // อัปเดตไอคอน และใส่คลาสแอนิเมชัน (stage-0 ถึง stage-5)
      dashIcon.innerText = stage.icon;
      dashIcon.className = \`stage-\${currentStageIdx}\`; 

      // คำนวณเปอร์เซ็นต์วิวัฒนาการ
      let evoHtml = '';
      if (nextStage) {
          const pointsNeeded = nextStage.min - stage.min;
          const pointsEarned = currentPoints - stage.min;
          const percent = Math.floor((pointsEarned / pointsNeeded) * 100);
          
          evoHtml = \`
            <div style="margin-top:15px;">
              <span style="font-size:0.9rem; font-weight:bold; color:#fffbeb; text-shadow:1px 1px 2px rgba(0,0,0,0.5);">
                🚀 พัฒนาร่างต่อไปในอีก: <b style="color:#fbbf24;">\${nextStage.min - currentPoints} แต้ม</b>
              </span>
              <div class="evo-bar-bg">
                <div class="evo-bar-fill" style="width: \${percent}%;"></div>
              </div>
              <span style="font-size:0.8rem; opacity:0.8;">ร่างต่อไป: \${nextStage.name} \${nextStage.icon}</span>
            </div>
          \`;
      } else {
          evoHtml = \`
            <div style="margin-top:20px; animation: glow-gami 2s infinite;">
              <span style="font-size:1.1rem; font-weight:bold; color:#fbbf24; text-shadow:0 0 10px #fbbf24;">
                🌟 วิวัฒนาการขั้นสูงสุดแล้ว! 🌟
              </span>
            </div>
          \`;
      }

      dashNextLevel.innerHTML = \`
        <strong style="font-size:1.3rem; color:white; text-shadow: 1px 1px 3px rgba(0,0,0,0.4); display:block; margin-bottom:5px;">
          ร่างปัจจุบัน: \${stage.name}
        </strong>
        <span style="opacity:0.9;">\${stage.desc}</span>
        \${evoHtml}
      \`;
  }
}
