import React from "react";
import { 
  Home, 
  MapPin, 
  CreditCard, 
  User, 
  Truck, 
  Heart, 
  Map, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight
} from "lucide-react";

export function Earnings() {
  return (
    <div 
      className="flex flex-col mx-auto bg-[#FFFFFF] overflow-hidden relative" 
      style={{ width: 390, height: 844, fontFamily: "Inter, sans-serif" }}
    >
      {/* Status Bar Space */}
      <div className="h-12 w-full flex items-center justify-between px-6 pt-2 shrink-0">
        <span className="text-sm font-semibold text-[#1A1A1A]">9:41</span>
        <div className="flex gap-1.5 items-center">
          <div className="w-4 h-4 rounded-full bg-[#1A1A1A]" />
          <div className="w-4 h-4 rounded-full bg-[#1A1A1A]" />
          <div className="w-6 h-3 rounded-sm border border-[#1A1A1A] relative">
            <div className="absolute top-0.5 left-0.5 bottom-0.5 right-1 bg-[#1A1A1A] rounded-sm" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 py-4 shrink-0">
        <h1 className="text-[22px] font-bold text-[#1A1A1A]">Mes Gains</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        {/* Period Selector Pills */}
        <div className="px-6 flex gap-3 mb-6">
          <button className="px-5 py-2 rounded-full bg-[#E91E8C] text-white font-medium text-sm shadow-sm">
            Aujourd'hui
          </button>
          <button className="px-5 py-2 rounded-full bg-white border border-[#E91E8C] text-[#E91E8C] font-medium text-sm">
            Semaine
          </button>
          <button className="px-5 py-2 rounded-full bg-white border border-[#E91E8C] text-[#E91E8C] font-medium text-sm">
            Mois
          </button>
        </div>

        {/* Hero Earnings Card */}
        <div className="px-6 mb-8">
          <div 
            className="rounded-2xl p-6 shadow-md"
            style={{ background: "linear-gradient(135deg, #9BA617 0%, #6B7A0F 100%)" }}
          >
            <div className="text-white/90 text-sm font-medium mb-1">Aujourd'hui</div>
            <div className="text-[48px] font-bold text-white leading-tight mb-3">247 DH</div>
            <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
              <span>8 livraisons</span>
              <span>•</span>
              <span>32 DH pourboires</span>
            </div>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="px-6 mb-8">
          <h2 className="text-[18px] font-bold text-[#1A1A1A] mb-4">Détails</h2>
          <div className="space-y-3">
            {/* Base */}
            <div className="flex items-center justify-between bg-white p-4 rounded-[16px] border border-[#EEEEEE] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#00B4D8]/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#00B4D8]" />
                </div>
                <span className="font-semibold text-[#1A1A1A]">Livraisons de base</span>
              </div>
              <span className="font-bold text-[#9BA617]">183 DH</span>
            </div>

            {/* Tips */}
            <div className="flex items-center justify-between bg-white p-4 rounded-[16px] border border-[#EEEEEE] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#9BA617]/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#9BA617]" />
                </div>
                <span className="font-semibold text-[#1A1A1A]">Pourboires</span>
              </div>
              <span className="font-bold text-[#9BA617]">32 DH</span>
            </div>

            {/* Distance */}
            <div className="flex items-center justify-between bg-white p-4 rounded-[16px] border border-[#EEEEEE] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#E91E8C]/10 flex items-center justify-center">
                  <Map className="w-5 h-5 text-[#E91E8C]" />
                </div>
                <span className="font-semibold text-[#1A1A1A]">Bonus distance</span>
              </div>
              <span className="font-bold text-[#E91E8C]">22 DH</span>
            </div>

            {/* Promos */}
            <div className="flex items-center justify-between bg-white p-4 rounded-[16px] border border-[#EEEEEE] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#E91E8C]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#E91E8C]" />
                </div>
                <span className="font-semibold text-[#1A1A1A]">Promotions</span>
              </div>
              <span className="font-bold text-[#E91E8C]">10 DH</span>
            </div>
          </div>
        </div>

        {/* Payout History */}
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#1A1A1A]">Historique des paiements</h2>
            <ChevronRight className="w-5 h-5 text-[#757575]" />
          </div>
          
          <div className="flex items-center justify-between bg-white py-4 border-b border-[#EEEEEE]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E91E8C]/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#E91E8C]" />
              </div>
              <div>
                <div className="font-semibold text-[#1A1A1A]">Virement • 890 DH</div>
                <div className="text-sm text-[#757575] mt-0.5">Lun. 12 Juin, 09:30</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="absolute bottom-0 w-full h-[90px] bg-white border-t border-[#EEEEEE] flex justify-around items-start pt-4 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
        <div className="flex flex-col items-center gap-1.5 w-16">
          <Home className="w-6 h-6 text-[#757575]" />
          <span className="text-[11px] font-medium text-[#757575]">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 w-16">
          <MapPin className="w-6 h-6 text-[#757575]" />
          <span className="text-[11px] font-medium text-[#757575]">Courses</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 w-16">
          <CreditCard className="w-6 h-6 text-[#E91E8C]" />
          <span className="text-[11px] font-medium text-[#E91E8C]">Gains</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 w-16">
          <User className="w-6 h-6 text-[#757575]" />
          <span className="text-[11px] font-medium text-[#757575]">Profil</span>
        </div>
      </div>
    </div>
  );
}
