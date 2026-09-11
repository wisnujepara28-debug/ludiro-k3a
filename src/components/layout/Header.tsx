import { Ship, Anchor, Navigation, Package, MapPin, BarChart3, LogOut, Database, UserCheck, Users, Radio } from 'lucide-react';
import type { UserSession } from '../../types/maritime';

interface HeaderProps {
  user: UserSession;
  activeTab: 'ships' | 'voyages' | 'cargo' | 'ports' | 'dashboard';
  onTabChange: (tab: 'ships' | 'voyages' | 'cargo' | 'ports' | 'dashboard') => void;
  onLogout: () => void;
  onlineCount?: number;
  isConnected?: boolean;
  onOpenOnlineModal?: () => void;
}

export function Header({
  user,
  activeTab,
  onTabChange,
  onLogout,
  onlineCount = 1,
  isConnected = true,
  onOpenOnlineModal,
}: HeaderProps) {
  const tabs = [
    { id: 'ships', label: 'Armada Kapal', icon: Ship, badgeCount: undefined },
    { id: 'voyages', label: 'Jadwal & Rute Pelayaran', icon: Navigation, badgeCount: undefined },
    { id: 'cargo', label: 'Manifes & B/L Kargo', icon: Package, badgeCount: undefined },
    { id: 'ports', label: 'Master Pelabuhan', icon: MapPin, badgeCount: undefined },
    { id: 'dashboard', label: 'Ringkasan & Audit Log', icon: BarChart3, badgeCount: undefined },
  ] as const;

  return (
    <header id="main-app-header" className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top utility strip */}
      <div className="bg-slate-900 text-slate-200 px-4 sm:px-8 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-sky-400">
            <Anchor className="w-3.5 h-3.5" />
            PT JAPARA MARITIM NUSANTARA
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">
            Sistem Informasi Manajemen Angkutan Laut Terpadu
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Online Real-Time Multi-User status */}
          <button
            id="top-online-status-pill"
            type="button"
            onClick={onOpenOnlineModal}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[11px] cursor-pointer transition-colors"
            title="Klik untuk membuka pusat pengguna online & siaran langsung"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Server Online Real-Time: <strong>{onlineCount} Pengguna Terhubung</strong></span>
          </button>

          {/* Persistence status banner */}
          <div
            id="db-persistence-status-pill"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-500/40 text-sky-300 text-[11px]"
            title="Data disimpan secara persisten di server backend database, bukan di localStorage browser"
          >
            <Database className="w-3 h-3 text-sky-400" />
            <span>Server Database Aktif</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-blue-800 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight flex items-center gap-1.5">
                JAPARA MARITIM
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-sky-100 text-sky-800">
                  NUSANTARA
                </span>
              </div>
              <div className="text-[11px] text-slate-500 leading-none">Logistik & Angkutan Laut Niaga</div>
            </div>
          </div>

          {/* User profile & action */}
          <div className="flex items-center gap-3">
            {/* Live Online Users Button */}
            <button
              id="header-online-users-btn"
              type="button"
              onClick={onOpenOnlineModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-900 transition-all cursor-pointer shadow-xs group"
              title="Buka daftar operator online & siaran pesan"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Users className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-emerald-950">
                {onlineCount} Online
              </span>
            </button>

            <div className="hidden md:flex flex-col text-right pl-2 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                {user.namaLengkap}
              </span>
              <span className="text-[11px] text-slate-500">
                {user.role} &bull; {user.divisi}
              </span>
            </div>

            <button
              id="logout-btn"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              title="Keluar dari sesi"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
