import React, { useState } from 'react';
import { Home, List, DollarSign, User, Store, ChevronRight } from 'lucide-react';

export function Orders() {
  const [activeTab, setActiveTab] = useState('En cours');

  return (
    <div style={{ width: '390px', height: '844px', backgroundColor: '#FFFFFF', fontFamily: 'Inter, sans-serif', color: '#1A1A1A' }} className="relative mx-auto border border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="pt-14 px-6 pb-4 bg-white z-10 shadow-sm relative">
        <h1 className="text-[22px] font-bold tracking-tight">Mes Courses</h1>
        <p className="text-[14px] mt-1" style={{ color: '#757575' }}>24 avril 2026</p>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
        {['Toutes', 'En cours', 'Terminées'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap`}
            style={{
              backgroundColor: activeTab === tab ? '#E91E8C' : '#F8F8F8',
              color: activeTab === tab ? '#FFFFFF' : '#757575',
              border: `1px solid ${activeTab === tab ? '#E91E8C' : '#EEEEEE'}`
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 flex flex-col gap-4">
        {/* Active Order */}
        <div style={{ backgroundColor: '#F8F8F8', borderColor: '#EEEEEE', borderLeftColor: '#E91E8C', borderLeftWidth: '4px' }} className="rounded-[16px] p-4 shadow-sm border flex flex-col gap-3 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#00B4D8' }}>
                <Store size={20} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="font-bold text-[16px]">KFC Oasis</h3>
                <p className="text-[13px]" style={{ color: '#757575' }}>Client: Youssef B.</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ backgroundColor: 'rgba(233, 30, 140, 0.1)', color: '#E91E8C' }}>
              En cours
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-2 pt-3 border-t" style={{ borderColor: '#EEEEEE' }}>
            <div>
              <p className="text-[12px]" style={{ color: '#757575' }}>Il y a 5 min</p>
              <button className="text-[13px] font-semibold flex items-center gap-1 mt-1" style={{ color: '#00B4D8' }}>
                Voir détails <ChevronRight size={14} />
              </button>
            </div>
            <div className="text-[18px] font-bold" style={{ color: '#9BA617' }}>
              62 DH
            </div>
          </div>
        </div>

        {/* Completed Order 1 */}
        <div style={{ backgroundColor: '#F8F8F8', borderColor: '#EEEEEE', borderLeftColor: '#9BA617', borderLeftWidth: '4px' }} className="rounded-[16px] p-4 shadow-sm border flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#00B4D8' }}>
                <Store size={20} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="font-bold text-[16px]">Tacos de Lyon</h3>
                <p className="text-[13px]" style={{ color: '#757575' }}>Client: Sarah M.</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ backgroundColor: 'rgba(155, 166, 23, 0.1)', color: '#9BA617' }}>
              Livrée
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-2 pt-3 border-t" style={{ borderColor: '#EEEEEE' }}>
            <div>
              <p className="text-[12px]" style={{ color: '#757575' }}>Hier à 19:45</p>
              <button className="text-[13px] font-semibold flex items-center gap-1 mt-1" style={{ color: '#00B4D8' }}>
                Voir détails <ChevronRight size={14} />
              </button>
            </div>
            <div className="text-[18px] font-bold" style={{ color: '#9BA617' }}>
              45 DH
            </div>
          </div>
        </div>

        {/* Completed Order 2 */}
        <div style={{ backgroundColor: '#F8F8F8', borderColor: '#EEEEEE', borderLeftColor: '#9BA617', borderLeftWidth: '4px' }} className="rounded-[16px] p-4 shadow-sm border flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#00B4D8' }}>
                <Store size={20} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="font-bold text-[16px]">Pizza Luigi</h3>
                <p className="text-[13px]" style={{ color: '#757575' }}>Client: Karim T.</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-[12px] font-bold" style={{ backgroundColor: 'rgba(155, 166, 23, 0.1)', color: '#9BA617' }}>
              Livrée
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-2 pt-3 border-t" style={{ borderColor: '#EEEEEE' }}>
            <div>
              <p className="text-[12px]" style={{ color: '#757575' }}>22 avril à 13:15</p>
              <button className="text-[13px] font-semibold flex items-center gap-1 mt-1" style={{ color: '#00B4D8' }}>
                Voir détails <ChevronRight size={14} />
              </button>
            </div>
            <div className="text-[18px] font-bold" style={{ color: '#9BA617' }}>
              58 DH
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t flex items-center justify-around px-2 pb-5 pt-3" style={{ borderColor: '#EEEEEE' }}>
        <button className="flex flex-col items-center gap-1 w-16" style={{ color: '#757575' }}>
          <Home size={24} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 w-16" style={{ color: '#E91E8C' }}>
          <List size={24} />
          <span className="text-[10px] font-medium">Courses</span>
        </button>
        <button className="flex flex-col items-center gap-1 w-16" style={{ color: '#757575' }}>
          <DollarSign size={24} />
          <span className="text-[10px] font-medium">Gains</span>
        </button>
        <button className="flex flex-col items-center gap-1 w-16" style={{ color: '#757575' }}>
          <User size={24} />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </div>
    </div>
  );
}
