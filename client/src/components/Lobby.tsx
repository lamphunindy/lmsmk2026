import React from 'react';

interface LobbyProps {
  onNavigate: (view: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="card w-full max-w-[550px] text-center p-12">
        <div className="text-6xl mb-2">🏫</div>
        <h1 className="text-3xl font-bold mb-8 text-textMain">LMS HERO EDITION</h1>
        
        <div className="bg-bg p-8 rounded-2xl mb-8 border border-border">
          <h3 className="text-primary font-semibold mb-5 text-xl">👨‍🎓 ค้นหาผลการเรียน (ด่วน)</h3>
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="พิมพ์ชื่อ เลขที่ หรือเลขประจำตัว..." 
              className="w-full text-center p-4 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="btn btn-outline w-full p-4 text-lg">🔍 ค้นหา</button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            className="btn btn-primary flex-1 p-4 bg-green-600 hover:bg-green-700 whitespace-nowrap text-lg"
            onClick={() => onNavigate('login-student')}
          >
            🦸‍♂️ เข้าสู่ระบบ (นักเรียน)
          </button>
          <button 
            className="btn btn-dark flex-1 p-4 whitespace-nowrap text-lg"
            onClick={() => onNavigate('login-staff')}
          >
            🔐 บุคลากร (ครู/แอดมิน)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
