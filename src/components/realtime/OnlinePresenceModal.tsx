import { useState, type FormEvent } from 'react';
import {
  Users,
  Radio,
  Wifi,
  Send,
  Clock,
  ShieldCheck,
  Globe,
  Sparkles,
  X,
  MessageSquare,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import type { OnlineUser, RealtimeEvent, UserSession } from '../../types/maritime';
import { api } from '../../services/api';

interface OnlinePresenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  recentBroadcasts: RealtimeEvent[];
  onBroadcastSent?: (message: string) => void;
}

export function OnlinePresenceModal({
  isOpen,
  onClose,
  currentUser,
  onlineUsers,
  isConnected,
  recentBroadcasts,
  onBroadcastSent,
}: OnlinePresenceModalProps) {
  const [broadcastText, setBroadcastText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim() || isSending) return;

    setIsSending(true);
    try {
      await api.realtime.broadcast(broadcastText.trim(), currentUser.namaLengkap);
      setBroadcastText('');
      setSendSuccess(true);
      if (onBroadcastSent) onBroadcastSent(broadcastText.trim());
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to broadcast:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 text-white p-5 flex items-center justify-between border-b border-sky-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Pusat Terhubung Real-Time & Multi-User</h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {isConnected ? 'LIVE CONNECTED' : 'RECONNECTING'}
                </span>
              </div>
              <p className="text-xs text-sky-200/70 mt-0.5">
                Server online terhubung langsung ke semua pengguna & staf yang sedang membuka sistem ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Status highlight strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-sky-50 border border-sky-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-sky-700 font-bold mb-1">
                <Users className="w-4 h-4 text-sky-600" />
                Pengguna Online
              </div>
              <div className="text-2xl font-black text-sky-950">{onlineUsers.length} Orang</div>
              <div className="text-[11px] text-sky-600/80 mt-0.5">Terhubung real-time di server</div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mb-1">
                <Wifi className="w-4 h-4 text-emerald-600" />
                Status Jaringan
              </div>
              <div className="text-sm font-bold text-emerald-950 flex items-center gap-1.5 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Sinkron Otomatis (Sub-detik)
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-1">Perubahan langsung tersebar</div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold mb-1">
                <Activity className="w-4 h-4 text-indigo-600" />
                Engine Sinkronisasi
              </div>
              <div className="text-xs font-bold text-indigo-950 mt-1">EventBus + File Database</div>
              <div className="text-[11px] text-indigo-600/80 mt-1">Tanpa batas jeda reload</div>
            </div>
          </div>

          {/* Form Kirim Siaran Langsung (Broadcast) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                Kirim Siaran Operasional (Muncul Langsung ke Semua Layar)
              </label>
              <span className="text-[11px] text-slate-500">Pengirim: {currentUser.namaLengkap}</span>
            </div>
            <form onSubmit={handleSendBroadcast} className="space-y-2">
              <div className="flex gap-2">
                <input
                  id="broadcast-input-field"
                  type="text"
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
                  placeholder="Contoh: KM. Samudera 01 telah selesai proses muat di Tanjung Priok..."
                  disabled={isSending}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={isSending || !broadcastText.trim()}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Menyiarkan...' : 'Siarkan'}</span>
                </button>
              </div>
              {sendSuccess && (
                <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-100/70 px-3 py-1 rounded-lg animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pesan siaran langsung terkirim ke seluruh layar operator online!</span>
                </div>
              )}
            </form>
          </div>

          {/* List of active online users */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                Daftar Pengguna Online Saat Ini ({onlineUsers.length})
              </h4>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Auto-refresh real-time
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto">
              {onlineUsers.map(u => {
                const isMe = u.id === currentUser.id || u.username === currentUser.username;
                return (
                  <div
                    key={u.id}
                    className={`p-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isMe ? 'bg-sky-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {u.namaLengkap.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">{u.namaLengkap}</span>
                          {isMe && (
                            <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-sky-600" />
                          <span>{u.role}</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="truncate max-w-[160px] sm:max-w-[240px]">{u.divisi}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Aktif Online
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {u.clientInfo || 'Terminal Web'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent broadcast history */}
          {recentBroadcasts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Siaran Terakhir yang Diterima
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {recentBroadcasts.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-slate-800 flex items-start gap-2"
                  >
                    <span className="text-amber-600 font-bold mt-0.5">📢</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950">{b.actor}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(b.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5 leading-relaxed">{b.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <span>Terhubung ke Server PT JAPARA MARITIM NUSANTARA</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
