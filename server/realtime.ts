import type { IncomingMessage, ServerResponse } from 'http';

export interface OnlineUser {
  id: string;
  username: string;
  namaLengkap: string;
  role: string;
  divisi: string;
  connectedAt: string;
  lastActive: string;
  clientInfo?: string;
}

export interface RealtimeEvent {
  id: string;
  type:
    | 'connected'
    | 'presence:sync'
    | 'user:joined'
    | 'user:left'
    | 'ship:created'
    | 'ship:updated'
    | 'ship:deleted'
    | 'voyage:created'
    | 'voyage:updated'
    | 'voyage:deleted'
    | 'cargo:created'
    | 'cargo:updated'
    | 'cargo:deleted'
    | 'audit:new'
    | 'announcement:new';
  payload?: any;
  actor?: string;
  message?: string;
  timestamp: string;
}

// In-memory connected SSE response streams
const sseClients = new Set<ServerResponse>();

// In-memory active online users
const onlineUsersMap = new Map<string, OnlineUser>();

// Track initial seed online users so team presence is visible immediately
function ensureDefaultPresence() {
  if (onlineUsersMap.size === 0) {
    const now = new Date().toISOString();
    onlineUsersMap.set('usr-admin-01', {
      id: 'usr-admin-01',
      username: 'admin',
      namaLengkap: 'Direktur Japara Maritim',
      role: 'Super Admin',
      divisi: 'Direksi PT JAPARA MARITIM NUSANTARA',
      connectedAt: now,
      lastActive: now,
      clientInfo: 'Server Station 01 (Pusat)',
    });
    onlineUsersMap.set('usr-ops-02', {
      id: 'usr-ops-02',
      username: 'ops',
      namaLengkap: 'Capt. Hendra Japara, M.Mar',
      role: 'Manajer Operasional',
      divisi: 'Divisi Pelayaran PT JAPARA MARITIM NUSANTARA',
      connectedAt: now,
      lastActive: now,
      clientInfo: 'Vessel Traffic Ops Center',
    });
  }
}

// Clean up stale users periodically (inactive > 45 seconds, except system accounts)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [key, user] of onlineUsersMap.entries()) {
    if (key === 'usr-admin-01' || key === 'usr-ops-02') {
      // keep core dispatchers active with updated heartbeat
      user.lastActive = new Date().toISOString();
      continue;
    }
    const lastActiveTime = new Date(user.lastActive).getTime();
    if (now - lastActiveTime > 45000) {
      onlineUsersMap.delete(key);
      changed = true;
    }
  }
  if (changed) {
    broadcastEvent({
      type: 'presence:sync',
      payload: getOnlineUsersList(),
      actor: 'System',
      message: 'Daftar pengguna online diperbarui.',
    });
  }
}, 15000);

export function getOnlineUsersList(): OnlineUser[] {
  ensureDefaultPresence();
  return Array.from(onlineUsersMap.values()).sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  );
}

export function recordUserHeartbeat(user: Partial<OnlineUser> & { username: string; namaLengkap: string }): OnlineUser {
  ensureDefaultPresence();
  const userId = user.id || `usr-${user.username.toLowerCase()}`;
  const isNew = !onlineUsersMap.has(userId);
  const now = new Date().toISOString();

  const existing = onlineUsersMap.get(userId);
  const updatedUser: OnlineUser = {
    id: userId,
    username: user.username,
    namaLengkap: user.namaLengkap || user.username,
    role: user.role || 'Operator',
    divisi: user.divisi || 'PT JAPARA MARITIM NUSANTARA',
    connectedAt: existing?.connectedAt || now,
    lastActive: now,
    clientInfo: user.clientInfo || 'Web Portal Client',
  };

  onlineUsersMap.set(userId, updatedUser);

  if (isNew) {
    broadcastEvent({
      type: 'user:joined',
      actor: updatedUser.namaLengkap,
      message: `${updatedUser.namaLengkap} (${updatedUser.role}) baru saja online dan bergabung di sistem.`,
      payload: { user: updatedUser, onlineCount: onlineUsersMap.size },
    });
  }

  return updatedUser;
}

export function recordUserLogout(username: string): void {
  for (const [key, user] of onlineUsersMap.entries()) {
    if (user.username.toLowerCase() === username.toLowerCase() && key !== 'usr-admin-01') {
      onlineUsersMap.delete(key);
      broadcastEvent({
        type: 'user:left',
        actor: user.namaLengkap,
        message: `${user.namaLengkap} telah keluar dari sistem.`,
        payload: { username, onlineCount: onlineUsersMap.size },
      });
      break;
    }
  }
}

export function broadcastEvent(
  event: Omit<RealtimeEvent, 'id' | 'timestamp'>
): RealtimeEvent {
  const fullEvent: RealtimeEvent = {
    id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    ...event,
  };

  const payloadString = `id: ${fullEvent.id}\nevent: ${fullEvent.type}\ndata: ${JSON.stringify(fullEvent)}\n\n`;

  for (const client of sseClients) {
    try {
      client.write(payloadString);
    } catch {
      sseClients.delete(client);
    }
  }

  return fullEvent;
}

export function handleSseConnection(req: IncomingMessage, res: ServerResponse): void {
  // Set SSE streaming headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Accel-Buffering': 'no',
  });

  // Flush initial connection event
  const initialEvent: RealtimeEvent = {
    id: 'evt-init-' + Date.now(),
    type: 'connected',
    timestamp: new Date().toISOString(),
    actor: 'Server PT JAPARA MARITIM NUSANTARA',
    message: 'Terhubung ke Real-Time Event Bus Server PT JAPARA MARITIM NUSANTARA.',
    payload: {
      onlineUsers: getOnlineUsersList(),
      connectedClientsCount: sseClients.size + 1,
      serverTime: new Date().toISOString(),
    },
  };
  res.write(`id: ${initialEvent.id}\nevent: connected\ndata: ${JSON.stringify(initialEvent)}\n\n`);

  sseClients.add(res);

  // Keep-alive heartbeat comment every 12 seconds to prevent proxy drop
  const keepAliveTimer = setInterval(() => {
    try {
      res.write(': keepalive-ping\n\n');
    } catch {
      clearInterval(keepAliveTimer);
      sseClients.delete(res);
    }
  }, 12000);

  const cleanup = () => {
    clearInterval(keepAliveTimer);
    sseClients.delete(res);
  };

  req.on('close', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
}

export function getRealtimeStatus() {
  return {
    status: 'ONLINE',
    serverUptime: process.uptime(),
    activeSseStreams: sseClients.size,
    onlineUsersCount: getOnlineUsersList().length,
    onlineUsers: getOnlineUsersList(),
    timestamp: new Date().toISOString(),
  };
}
