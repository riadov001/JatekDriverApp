import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Login() {
  const [mode, setMode] = useState<'demo' | 'prod'>('demo');
  const [phone, setPhone] = useState('');

  return (
    <div className="w-[390px] h-[844px] bg-white flex flex-col font-['Inter'] relative overflow-hidden">
      {/* Top area */}
      <div className="flex flex-col items-center justify-center mt-24 mb-16">
        <div 
          className="rounded-full px-8 py-3 mb-2"
          style={{ backgroundColor: '#E91E8C' }}
        >
          <span className="text-white font-bold tracking-tight" style={{ fontSize: '48px', lineHeight: '1' }}>JATEK</span>
        </div>
        <span className="font-bold text-2xl tracking-widest uppercase" style={{ color: '#00B4D8' }}>
          Driver
        </span>
      </div>

      {/* Main Content */}
      <div className="px-6 flex-1 flex flex-col">
        <h1 className="text-[24px] font-bold mb-2 text-[#1A1A1A]">Bienvenue sur Jatek Driver</h1>
        <p className="text-[#757575] text-[15px] mb-8">
          Connectez-vous pour commencer vos livraisons
        </p>

        {/* Toggle Switch */}
        <div className="flex bg-[#F8F8F8] rounded-full p-1 mb-8 border border-[#EEEEEE]">
          <button
            onClick={() => setMode('demo')}
            className={`flex-1 py-3 rounded-full font-semibold transition-colors text-[15px]`}
            style={{
              backgroundColor: mode === 'demo' ? '#E91E8C' : 'transparent',
              color: mode === 'demo' ? '#FFFFFF' : '#757575',
            }}
          >
            Démo (OTP)
          </button>
          <button
            onClick={() => setMode('prod')}
            className={`flex-1 py-3 rounded-full font-semibold transition-colors text-[15px]`}
            style={{
              backgroundColor: mode === 'prod' ? '#E91E8C' : 'transparent',
              color: mode === 'prod' ? '#FFFFFF' : '#757575',
            }}
          >
            Production
          </button>
        </div>

        {/* Phone Input */}
        <div className="mb-auto">
          {mode === 'demo' && (
            <div className="flex items-center border-2 border-[#EEEEEE] rounded-[16px] focus-within:border-[#E91E8C] transition-colors bg-white overflow-hidden h-[56px]">
              <div className="flex items-center px-4 bg-[#F8F8F8] h-full border-r border-[#EEEEEE]">
                <span className="text-[20px] mr-2">🇲🇦</span>
                <span className="text-[#1A1A1A] font-semibold text-[16px]">+212</span>
                <ChevronDown className="w-4 h-4 ml-1 text-[#757575]" />
              </div>
              <input
                type="tel"
                placeholder="Numéro de téléphone"
                className="flex-1 h-full px-4 text-[16px] text-[#1A1A1A] font-medium focus:outline-none placeholder:text-[#757575] placeholder:font-normal"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pb-8 pt-4">
          <p className="text-center text-[#757575] text-[13px] mb-4 px-4 leading-tight">
            En continuant, vous acceptez les conditions d'utilisation et la politique de confidentialité de Jatek.
          </p>
          <button 
            className="w-full h-[56px] rounded-[24px] font-bold text-[18px] text-white flex items-center justify-center transition-opacity active:opacity-80"
            style={{ backgroundColor: '#E91E8C' }}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
