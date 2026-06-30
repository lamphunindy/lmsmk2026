import React from 'react';

interface LoginProps {
  role: 'student' | 'staff';
  onNavigate: (view: string) => void;
}

const Login: React.FC<LoginProps> = ({ role, onNavigate }) => {
  const isStudent = role === 'student';

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="card w-full max-w-[420px] text-center p-12">
        <div className="text-6xl mb-4">{isStudent ? '🦸‍♂️' : '🔐'}</div>
        <h2 className="text-2xl font-bold mb-2">
          {isStudent ? 'เข้าสู่ฐานทัพฮีโร่' : 'เข้าสู่ระบบบุคลากร'}
        </h2>
        <p className="text-textMuted mb-8">
          ({isStudent ? 'สำหรับนักเรียน' : 'ครูผู้สอน / ผู้ดูแลระบบ'})
        </p>
        
        <div className="mb-4">
          <input 
            type={isStudent ? "text" : "email"} 
            placeholder={isStudent ? "เลขประจำตัวนักเรียน" : "Email"} 
            className="w-full text-center p-4 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mb-6">
          <input 
            type="password" 
            placeholder={isStudent ? "รหัส PIN 4 หลัก" : "Password"} 
            className="w-full text-center p-4 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary tracking-widest"
          />
        </div>
        
        <button className={`btn w-full p-4 mb-4 ${isStudent ? 'btn-primary' : 'btn-dark'}`}>
          เข้าสู่ระบบ
        </button>
        <button 
          className="btn btn-outline w-full p-3 border-none hover:bg-gray-100 hover:text-textMain"
          onClick={() => onNavigate('lobby')}
        >
          ← กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
};

export default Login;
