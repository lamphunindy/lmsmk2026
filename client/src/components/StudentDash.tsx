import React, { useEffect, useState } from 'react';

interface StudentDashProps {
  onNavigate: (view: string) => void;
}

const StudentDash: React.FC<StudentDashProps> = ({ onNavigate }) => {
  const [studentInfo] = useState<any>(null);
  const [heroPts] = useState(0);

  useEffect(() => {
    // get(ref(db, `students/${classId}/${stuId}`)) ...
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-[1200px]">
      <div className="flex justify-between items-center mb-4 bg-cardBg p-4 rounded-xl shadow-sm border border-border">
        <h2 className="text-xl font-bold text-textMain">ฐานทัพของฉัน</h2>
        <div className="flex gap-2">
          <button 
            className="btn btn-outline px-4 py-2 text-sm"
            onClick={() => onNavigate('portfolio')}
          >
            🌟 ดูแฟ้มผลงาน (Portfolio)
          </button>
          <button 
            className="btn px-4 py-2 text-sm border-2 border-danger text-danger hover:bg-danger hover:text-white rounded-lg transition-all"
            onClick={() => onNavigate('lobby')}
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div className="bg-cardBg p-8 rounded-xl shadow-md border border-border text-center mb-6">
        <div className="text-8xl mb-4">❓</div>
        <h1 className="text-3xl font-bold mb-2">{studentInfo?.name || 'ชื่อนักเรียน'}</h1>
        <p className="text-lg opacity-90 mb-4">ระดับ: โหลดข้อมูล...</p>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 dark:bg-gray-700">
          <div className="bg-primary h-4 rounded-full" style={{ width: '45%' }}></div>
        </div>
        
        <p className="text-lg mt-2">พลังฮีโร่: <b className="text-2xl">{heroPts}</b> แต้ม</p>
      </div>
    </div>
  );
};

export default StudentDash;
