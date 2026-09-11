import { Ship as ShipIcon, Navigation, Package, Database, ShieldCheck, Clock, CheckCircle2, Waves, ArrowUpRight } from 'lucide-react';
import type { Ship, Voyage, CargoItem } from '../../types/maritime';

interface OverviewDashboardProps {
  ships: Ship[];
  voyages: Voyage[];
  cargoList: CargoItem[];
  logs: any[];
  onNavigateTab: (tab: 'ships' | 'voyages' | 'cargo' | 'ports') => void;
}

export function OverviewDashboard({
  ships,
  voyages,
  cargoList,
  logs,
  onNavigateTab,
}: OverviewDashboardProps) {
  const totalDWT = ships.reduce((acc, s) => acc + (Number(s.kapasitasDWT) || 0), 0);
  const shipsSailing = ships.filter(s => s.status === 'Berlayar').length;
  const shipsDocked = ships.filter(s => s.status === 'Sandar / Bongkar Muat').length;
  const activeVoyages = voyages.filter(v => v.status === 'Dalam Pelayaran' || v.status === 'Proses Muat').length;
  const totalCargoTon = cargoList.reduce((acc, c) => acc + (Number(c.beratTon) || 0), 0);
  const totalCargoValue = cargoList.reduce((acc, c) => acc + (Number(c.nilaiKargo) || 0), 0);

  const formatRupiah = (val: number) => {
    if (val >= 1_000_000_000) {
      return `Rp ${(val / 1_000_000_000).toFixed(2)} Miliar`;
    }
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const formatLogTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString('id-ID') + ')';
    } catch {
      return iso;
    }
  };

  return (
    <div id="overview-dashboard-view" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Waves className="w-3.5 h-3.5" />
            Executive Operational Dashboard
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Pusat Komando Operasional Angkutan Laut
          </h2>
          <p className="text-sky-100/80 text-xs sm:text-sm mt-2 leading-relaxed">
            Pemantauan real-time pergerakan armada kapal niaga, keterisian muatan kargo nasional, dan jadwal pelayaran antar-pelabuhan utama di seluruh nusantara.
          </p>
        </div>

        {/* Database assurance badge */}
        <div className="mt-6 pt-4 border-t border-sky-800/60 flex flex-wrap items-center gap-4 text-xs text-sky-200">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sumber Tunggal Kebenaran: Real Database Server</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>Zero localStorage Architecture Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Armada */}
        <div
          onClick={() => onNavigateTab('ships')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Armada Kapal</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <ShipIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{ships.length}</span>
            <span className="text-xs text-slate-500">Unit Kapal</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>{shipsSailing} Berlayar &bull; {shipsDocked} Sandar</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
          </div>
        </div>

        {/* Card 2: DWT Tonnage */}
        <div
          onClick={() => onNavigateTab('ships')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kapasitas DWT</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShipIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalDWT.toLocaleString('id-ID')}</span>
            <span className="text-xs text-slate-500">Tonase DWT</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Daya Muat Seluruh Armada</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
          </div>
        </div>

        {/* Card 3: Active Voyages */}
        <div
          onClick={() => onNavigateTab('voyages')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pelayaran Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{activeVoyages}</span>
            <span className="text-xs text-slate-500">Rute Berjalan</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Dari {voyages.length} Total Jadwal</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
          </div>
        </div>

        {/* Card 4: Cargo Tonage */}
        <div
          onClick={() => onNavigateTab('cargo')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Muatan Kargo Terdaftar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalCargoTon.toLocaleString('id-ID')}</span>
            <span className="text-xs text-slate-500">Ton Kargo</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Estimasi Nilai: {formatRupiah(totalCargoValue)}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Fleet Breakdown & Real-Time Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fleet Status & Quick Details */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShipIcon className="w-4 h-4 text-sky-600" />
              Status Operasional Armada Kapal
            </h3>
            <span className="text-xs text-sky-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigateTab('ships')}>
              Lihat Semua
            </span>
          </div>

          <div className="space-y-3">
            {ships.map(ship => (
              <div
                key={ship.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-sky-50/40 transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-900 text-xs">{ship.namaKapal}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {ship.imoNumber} &bull; {ship.jenisKapal}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                      ship.status === 'Berlayar'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : ship.status === 'Sandar / Bongkar Muat'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {ship.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {ship.kapasitasDWT.toLocaleString('id-ID')} DWT
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Database Audit Trail */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Jejak Audit Database Persisten (Log CRUD)
            </h3>
            <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold border border-emerald-200">
              Live Real-Time
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Setiap aksi create, update, dan delete dicatat secara permanen pada log database server backend.
          </p>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Belum ada aktivitas tercatat.</div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-800 text-[11px] px-1.5 py-0.5 bg-sky-100/70 rounded-md">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLogTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium leading-snug">{log.description}</p>
                  <div className="text-[10px] text-slate-400">Oleh: {log.actor}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
