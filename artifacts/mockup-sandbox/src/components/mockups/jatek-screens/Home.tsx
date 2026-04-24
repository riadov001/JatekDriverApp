import React, { useState } from "react";
import { 
  Home as HomeIcon, 
  Map as MapIcon, 
  Wallet as WalletIcon, 
  User as UserIcon,
  Navigation,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";

export function Home() {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="w-full h-full bg-[#FFFFFF] font-sans flex flex-col relative" style={{ width: 390, height: 844 }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4 flex justify-between items-center bg-[#FFFFFF] z-10">
        <div className="bg-[#E91E8C] px-3 py-1 rounded-full">
          <span className="text-white font-black tracking-wider text-xs">JATEK</span>
        </div>
        <div className="text-[#1A1A1A] font-semibold">
          Bonjour Ahmed
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-6 no-scrollbar">
        {/* Toggle Status Card */}
        <div className="bg-[#F8F8F8] rounded-[16px] p-6 mb-6 flex flex-col items-center justify-center border border-[#EEEEEE] shadow-sm">
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`w-32 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isOnline ? "bg-[#E91E8C]" : "bg-[#757575]"
            }`}
            style={{ borderRadius: 24 }}
          >
            <span className="text-white font-bold text-sm">
              {isOnline ? "En ligne" : "Hors ligne"}
            </span>
          </button>
          <h2 className="text-[#1A1A1A] text-xl font-bold mt-4">
            {isOnline ? "Vous êtes en ligne" : "Vous êtes hors ligne"}
          </h2>
          <p className="text-[#757575] text-sm mt-1">
            {isOnline ? "Recherche de courses..." : "Passez en ligne pour recevoir des courses"}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 bg-[#F8F8F8] rounded-[16px] p-4 flex flex-col items-center border border-[#EEEEEE]">
            <span className="text-[#00B4D8] font-bold text-2xl mb-1">8</span>
            <span className="text-[#757575] text-xs font-medium">Livraisons</span>
          </div>
          <div className="flex-1 bg-[#F8F8F8] rounded-[16px] p-4 flex flex-col items-center border border-[#EEEEEE]">
            <span className="text-[#9BA617] font-bold text-2xl mb-1">247<span className="text-sm ml-1">DH</span></span>
            <span className="text-[#757575] text-xs font-medium">Gains</span>
          </div>
          <div className="flex-1 bg-[#F8F8F8] rounded-[16px] p-4 flex flex-col items-center border border-[#EEEEEE]">
            <span className="text-[#E91E8C] font-bold text-2xl mb-1">32<span className="text-sm ml-1">DH</span></span>
            <span className="text-[#757575] text-xs font-medium">Pourboires</span>
          </div>
        </div>

        {/* Courses disponibles */}
        {isOnline && (
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-[#1A1A1A] font-bold text-lg">Courses disponibles</h3>
              <span className="text-[#E91E8C] text-sm font-semibold">Voir tout</span>
            </div>

            <div className="space-y-4">
              {/* Order Card 1 */}
              <div className="bg-[#FFFFFF] border border-[#EEEEEE] rounded-[16px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-[#1A1A1A] font-bold text-lg">KFC - Maarif</h4>
                    <div className="flex items-center text-[#757575] text-sm mt-1">
                      <Clock size={14} className="mr-1.5" />
                      <span>Est. 15-20 min</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#9BA617] font-bold text-xl">25 DH</div>
                  </div>
                </div>

                <div className="relative pl-6 mb-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#EEEEEE]">
                  <div className="relative mb-4">
                    <div className="absolute -left-[27px] top-0.5 w-[8px] h-[8px] rounded-full bg-[#1A1A1A] border-2 border-white ring-2 ring-[#1A1A1A]"></div>
                    <p className="text-[#1A1A1A] text-sm font-medium">Boulevard Al Massira Al Khadra</p>
                    <p className="text-[#757575] text-xs mt-0.5">Retrait</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[27px] top-0.5 w-[8px] h-[8px] rounded-sm bg-[#E91E8C] border-2 border-white ring-2 ring-[#E91E8C]"></div>
                    <p className="text-[#1A1A1A] text-sm font-medium">Résidence Les Fleurs, Racine</p>
                    <p className="text-[#757575] text-xs mt-0.5">Livraison</p>
                  </div>
                </div>

                <button className="w-full bg-[#E91E8C] text-white font-bold py-3.5 rounded-full flex items-center justify-center transition-opacity hover:opacity-90 active:scale-[0.98]">
                  Accepter la course
                </button>
              </div>

              {/* Order Card 2 */}
              <div className="bg-[#FFFFFF] border border-[#EEEEEE] rounded-[16px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-[#1A1A1A] font-bold text-lg">Tacos de Lyon</h4>
                    <div className="flex items-center text-[#757575] text-sm mt-1">
                      <Clock size={14} className="mr-1.5" />
                      <span>Est. 10-15 min</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#9BA617] font-bold text-xl">18 DH</div>
                  </div>
                </div>

                <div className="relative pl-6 mb-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#EEEEEE]">
                  <div className="relative mb-4">
                    <div className="absolute -left-[27px] top-0.5 w-[8px] h-[8px] rounded-full bg-[#1A1A1A] border-2 border-white ring-2 ring-[#1A1A1A]"></div>
                    <p className="text-[#1A1A1A] text-sm font-medium">Rue Bourgogne</p>
                    <p className="text-[#757575] text-xs mt-0.5">Retrait</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[27px] top-0.5 w-[8px] h-[8px] rounded-sm bg-[#E91E8C] border-2 border-white ring-2 ring-[#E91E8C]"></div>
                    <p className="text-[#1A1A1A] text-sm font-medium">Quartier Gauthier</p>
                    <p className="text-[#757575] text-xs mt-0.5">Livraison</p>
                  </div>
                </div>

                <button className="w-full bg-[#E91E8C] text-white font-bold py-3.5 rounded-full flex items-center justify-center transition-opacity hover:opacity-90 active:scale-[0.98]">
                  Accepter la course
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="absolute bottom-0 w-full bg-[#FFFFFF] border-t border-[#EEEEEE] px-6 py-4 flex justify-between items-center pb-8">
        <div className="flex flex-col items-center gap-1">
          <HomeIcon size={24} color="#E91E8C" />
          <span className="text-[#E91E8C] text-[10px] font-bold">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50">
          <MapIcon size={24} color="#757575" />
          <span className="text-[#757575] text-[10px] font-medium">Courses</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50">
          <WalletIcon size={24} color="#757575" />
          <span className="text-[#757575] text-[10px] font-medium">Gains</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50">
          <UserIcon size={24} color="#757575" />
          <span className="text-[#757575] text-[10px] font-medium">Profil</span>
        </div>
      </div>
    </div>
  );
}

export default Home;
