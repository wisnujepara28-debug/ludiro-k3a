import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserSession, Ship, Voyage, CargoItem, Port, AuditLog, OnlineUser, RealtimeEvent } from './types/maritime';
import { api } from './services/api';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/layout/Header';
import { ShipManagement } from './components/ships/ShipManagement';
import { VoyageManagement } from './components/voyages/VoyageManagement';
import { CargoManagement } from './components/cargo/CargoManagement';
import { PortManagement } from './components/ports/PortManagement';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { OnlinePresenceModal } from './components/realtime/OnlinePresenceModal';
import { ToastContainer, type ToastMessage } from './components/common/Toast';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'ships' | 'voyages' | 'cargo' | 'ports' | 'dashboard'>('ships');
  
  // Data state
  const [ships, setShips] = useState<Ship[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [cargoList, setCargoList] = useState<CargoItem[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  // Real-time online multi-user state
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState<boolean>(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<RealtimeEvent[]>([]);
  const lastSyncTimestampRef = useRef<number>(Date.now());
  
  // Loading state
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch all core maritime data from real server database
  const fetchAllData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [shipsRes, voyagesRes, cargoRes, portsRes, statsRes] = await Promise.all([
        api.ships.getAll(),
        api.voyages.getAll(),
        api.cargo.getAll(),
        api.ports.getAll(),
        api.stats.get(),
      ]);

      if (shipsRes.success) setShips(shipsRes.data);
      if (voyagesRes.success) setVoyages(voyagesRes.data);
      if (cargoRes.success) setCargoList(cargoRes.data);
      if (portsRes.success) setPorts(portsRes.data);
      if (statsRes.success && statsRes.data?.auditLogs) {
        setLogs(statsRes.data.auditLogs);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memuat data dari database persisten server.');
    } finally {
      setIsDataLoading(false);
    }
  }, [addToast]);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionRes = await api.auth.getCurrentUser();
        if (sessionRes.success && sessionRes.user) {
          setCurrentUser(sessionRes.user);
          await fetchAllData();
        }
      } catch (err) {
        // No active session, stay on login form
      } finally {
        setIsLoadingInitial(false);
      }
    };
    checkSession();
  }, [fetchAllData]);

  // Real-time server connection, live synchronization & presence heartbeat
  useEffect(() => {
    if (!currentUser) return;

    // Send initial heartbeat immediately
    api.presence.heartbeat(currentUser).then(res => {
      if (res && res.onlineUsers) setOnlineUsers(res.onlineUsers);
    }).catch(() => {});

    // Periodic presence heartbeat every 15 seconds
    const heartbeatTimer = setInterval(() => {
      api.presence.heartbeat(currentUser).then(res => {
        if (res && res.onlineUsers) setOnlineUsers(res.onlineUsers);
      }).catch(() => {});
    }, 15000);

    // Periodic safety synchronization poll every 12 seconds so even if SSE is temporarily paused by browser, all clients remain 100% updated
    const syncPollTimer = setInterval(() => {
      Promise.all([
        api.ships.getAll(),
        api.voyages.getAll(),
        api.cargo.getAll(),
        api.presence.getOnline(),
      ]).then(([sRes, vRes, cRes, pRes]) => {
        if (sRes.success) setShips(sRes.data);
        if (vRes.success) setVoyages(vRes.data);
        if (cRes.success) setCargoList(cRes.data);
        if (pRes.success && pRes.data) setOnlineUsers(pRes.data);
      }).catch(() => {});
    }, 12000);

    // Subscribe to real-time events via Server-Sent Events (SSE)
    const unsubscribe = api.realtime.subscribe(
      (event: RealtimeEvent) => {
        if (event.type === 'connected') {
          setIsRealtimeConnected(true);
          if (event.payload?.onlineUsers) {
            setOnlineUsers(event.payload.onlineUsers);
          }
        } else if (event.type === 'presence:sync') {
          if (Array.isArray(event.payload)) {
            setOnlineUsers(event.payload);
          }
        } else if (event.type === 'user:joined') {
          if (event.actor && event.actor !== currentUser.namaLengkap) {
            addToast('info', `🟢 ${event.actor} baru saja terhubung online.`);
          }
          api.presence.getOnline().then(r => r.data && setOnlineUsers(r.data)).catch(() => {});
        } else if (event.type === 'user:left') {
          api.presence.getOnline().then(r => r.data && setOnlineUsers(r.data)).catch(() => {});
        } else if (
          event.type.startsWith('ship:') ||
          event.type.startsWith('voyage:') ||
          event.type.startsWith('cargo:')
        ) {
          // Automatic instantaneous live data update across all logged-in devices!
          if (event.actor && event.actor !== currentUser.namaLengkap) {
            addToast('info', `[Sinkron Real-Time] ${event.message || 'Pembaruan data operasional masuk'}`);
          }
          fetchAllData();
        } else if (event.type === 'announcement:new') {
          setRecentBroadcasts(prev => [event, ...prev].slice(0, 15));
          addToast('warning', `📢 ${event.actor}: "${event.message}"`);
        }
      },
      (connected: boolean) => {
        setIsRealtimeConnected(connected);
      }
    );

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(syncPollTimer);
      unsubscribe();
    };
  }, [currentUser, fetchAllData, addToast]);

  // Login handler
  const handleLoginSuccess = async (user: UserSession) => {
    setCurrentUser(user);
    addToast('success', `Selamat datang kembali, ${user.namaLengkap} (${user.role})!`);
    await fetchAllData();
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await api.auth.logout();
      setCurrentUser(null);
      addToast('info', 'Anda telah keluar dari sesi sistem.');
    } catch (err: any) {
      addToast('error', 'Gagal logout dari server.');
    }
  };

  // CRUD Ships
  const handleCreateShip = async (data: Partial<Ship>) => {
    try {
      const res = await api.ships.create(data);
      if (res.success) {
        addToast('success', `Kapal ${data.namaKapal} berhasil didaftarkan ke armada!`);
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mendaftarkan kapal.');
      throw err;
    }
  };

  const handleUpdateShip = async (id: string, data: Partial<Ship>) => {
    try {
      const res = await api.ships.update(id, data);
      if (res.success) {
        addToast('success', `Data kapal ${data.namaKapal} berhasil diperbarui!`);
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memperbarui kapal.');
      throw err;
    }
  };

  const handleDeleteShip = async (id: string) => {
    try {
      const res = await api.ships.delete(id);
      if (res.success) {
        addToast('success', 'Kapal berhasil dihapus dari database.');
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menghapus kapal.');
      throw err;
    }
  };

  // CRUD Voyages
  const handleCreateVoyage = async (data: Partial<Voyage>) => {
    try {
      const res = await api.voyages.create(data);
      if (res.success) {
        addToast('success', `Jadwal pelayaran ${data.nomorVoyage} berhasil dibuat!`);
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal membuat jadwal pelayaran.');
      throw err;
    }
  };

  const handleUpdateVoyage = async (id: string, data: Partial<Voyage>) => {
    try {
      const res = await api.voyages.update(id, data);
      if (res.success) {
        addToast('success', `Jadwal pelayaran ${data.nomorVoyage} berhasil diperbarui!`);
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memperbarui jadwal.');
      throw err;
    }
  };

  const handleDeleteVoyage = async (id: string) => {
    try {
      const res = await api.voyages.delete(id);
      if (res.success) {
        addToast('success', 'Jadwal pelayaran berhasil dihapus.');
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menghapus pelayaran.');
      throw err;
    }
  };

  // CRUD Cargo
  const handleCreateCargo = async (data: Partial<CargoItem>) => {
    try {
      const res = await api.cargo.create(data);
      if (res.success) {
        addToast('success', `Manifes kargo B/L ${data.nomorBL} berhasil diterbitkan!`);
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menerbitkan manifes kargo.');
      throw err;
    }
  };

  const handleUpdateCargo = async (id: string, data: Partial<CargoItem>) => {
    try {
      const res = await api.cargo.update(id, data);
      if (res.success) {
        addToast('success', `Manifes kargo B/L ${data.nomorBL} berhasil diperbarui!`);
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memperbarui manifes.');
      throw err;
    }
  };

  const handleDeleteCargo = async (id: string) => {
    try {
      const res = await api.cargo.delete(id);
      if (res.success) {
        addToast('success', 'Manifes kargo berhasil dihapus.');
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menghapus manifes.');
      throw err;
    }
  };

  // CRUD Ports
  const handleCreatePort = async (data: Partial<Port>) => {
    try {
      const res = await api.ports.create(data);
      if (res.success) {
        addToast('success', `Pelabuhan ${data.namaPelabuhan} (${data.kodePelabuhan}) berhasil ditambahkan!`);
        await fetchAllData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menambahkan pelabuhan.');
      throw err;
    }
  };

  // Initial loading spinner
  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Menghubungkan ke Server Database Maritim...</p>
          <p className="text-xs text-slate-400">Memverifikasi status sesi dan konfigurasi persistensi</p>
        </div>
      </div>
    );
  }

  // Requirement 3: Harus ada form login sebagai tampilan default
  if (!currentUser) {
    return (
      <>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Header with Navigation & User Details */}
      <Header
        user={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onlineCount={onlineUsers.length > 0 ? onlineUsers.length : 1}
        isConnected={isRealtimeConnected}
        onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'ships' && (
          <ShipManagement
            ships={ships}
            isLoading={isDataLoading}
            onRefresh={fetchAllData}
            onCreateShip={handleCreateShip}
            onUpdateShip={handleUpdateShip}
            onDeleteShip={handleDeleteShip}
          />
        )}

        {activeTab === 'voyages' && (
          <VoyageManagement
            voyages={voyages}
            ships={ships}
            ports={ports}
            isLoading={isDataLoading}
            onRefresh={fetchAllData}
            onCreateVoyage={handleCreateVoyage}
            onUpdateVoyage={handleUpdateVoyage}
            onDeleteVoyage={handleDeleteVoyage}
          />
        )}

        {activeTab === 'cargo' && (
          <CargoManagement
            cargoList={cargoList}
            voyages={voyages}
            isLoading={isDataLoading}
            onRefresh={fetchAllData}
            onCreateCargo={handleCreateCargo}
            onUpdateCargo={handleUpdateCargo}
            onDeleteCargo={handleDeleteCargo}
          />
        )}

        {activeTab === 'ports' && (
          <PortManagement
            ports={ports}
            isLoading={isDataLoading}
            onRefresh={fetchAllData}
            onCreatePort={handleCreatePort}
          />
        )}

        {activeTab === 'dashboard' && (
          <OverviewDashboard
            ships={ships}
            voyages={voyages}
            cargoList={cargoList}
            logs={logs}
            onNavigateTab={tab => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} PT JAPARA MARITIM NUSANTARA Tbk. Hak Cipta Dilindungi.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Real Database Engine Active &bull; Zero localStorage</span>
          </div>
        </div>
      </footer>

      {/* Real-time Multi-User Online Presence & Broadcast Modal */}
      <OnlinePresenceModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        currentUser={currentUser}
        onlineUsers={onlineUsers.length > 0 ? onlineUsers : [{
          id: currentUser.id,
          username: currentUser.username,
          namaLengkap: currentUser.namaLengkap,
          role: currentUser.role,
          divisi: currentUser.divisi,
          connectedAt: currentUser.loginAt,
          lastActive: new Date().toISOString(),
          clientInfo: 'Terminal Web Pengguna',
        }]}
        isConnected={isRealtimeConnected}
        recentBroadcasts={recentBroadcasts}
        onBroadcastSent={() => {
          addToast('success', 'Siaran langsung operasional berhasil dikirim ke seluruh layar online.');
        }}
      />

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
