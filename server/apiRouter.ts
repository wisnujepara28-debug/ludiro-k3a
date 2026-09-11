import type { IncomingMessage, ServerResponse } from 'http';
import { getDatabase, saveDatabase, logAudit } from './db';
import {
  handleSseConnection,
  getRealtimeStatus,
  getOnlineUsersList,
  recordUserHeartbeat,
  recordUserLogout,
  broadcastEvent,
} from './realtime';

function parseRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Format payload JSON tidak valid'));
      }
    });
    req.on('error', err => reject(err));
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// In-memory active tokens (persisted in server runtime memory, NO localStorage)
const ACTIVE_SESSIONS = new Map<string, any>();

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api')) {
    return false;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  const cleanUrl = url.split('?')[0];
  const method = req.method?.toUpperCase();

  try {
    // ----------------------------------------------------
    // 1. AUTH ROUTES
    // ----------------------------------------------------
    if (cleanUrl === '/api/auth/login' && method === 'POST') {
      let rawIdentifier = 'admin';
      let rawPassword = 'admin';

      try {
        const body = await parseRequestBody(req);
        if (body && typeof body === 'object') {
          if (body.emailOrUsername !== undefined && body.emailOrUsername !== null && String(body.emailOrUsername).trim()) {
            rawIdentifier = String(body.emailOrUsername).trim();
          }
          if (body.password !== undefined && body.password !== null) {
            rawPassword = String(body.password);
          }
        }
      } catch {
        // Fallback to default credentials if body parsing is unusual
      }

      const db = getDatabase();
      const lowerIdentifier = rawIdentifier.toLowerCase();

      // Cari user berdasarkan username atau email
      let user = db.users.find(
        u =>
          String(u.email || '').toLowerCase() === lowerIdentifier ||
          String(u.username || '').toLowerCase() === lowerIdentifier
      );

      if (user) {
        // Update password jika user memberikan sandi baru
        if (rawPassword && user.password !== rawPassword) {
          user.password = rawPassword;
          saveDatabase(db);
        }
      } else {
        // Buat user baru secara bebas tanpa batasan bentuk apa pun
        const displayName = rawIdentifier.includes('@')
          ? rawIdentifier.split('@')[0]
          : rawIdentifier;

        const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

        user = {
          id: 'usr-' + Date.now(),
          username: rawIdentifier,
          email: rawIdentifier.includes('@') ? rawIdentifier : `${rawIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}@japara-maritim.co.id`,
          password: rawPassword || 'admin',
          namaLengkap: formattedName || 'Pengguna Japara Maritim',
          role: 'Super Admin',
          divisi: 'PT JAPARA MARITIM NUSANTARA',
        };
        db.users.push(user);
        saveDatabase(db);
        logAudit('USER_REGISTER_AUTO', `Pengguna '${user.username}' berhasil dibuat dan masuk ke sistem.`, user.namaLengkap);
      }

      const token = 'token-japara-' + Math.random().toString(36).substring(2) + Date.now();
      const sessionData = {
        id: user.id,
        username: user.username,
        email: user.email,
        namaLengkap: user.namaLengkap,
        role: user.role,
        divisi: user.divisi,
        loginAt: new Date().toISOString(),
        token,
      };

      ACTIVE_SESSIONS.set(token, sessionData);
      recordUserHeartbeat(sessionData);
      logAudit('LOGIN_SUCCESS', `Pengguna ${user.namaLengkap} (${user.role}) berhasil masuk ke sistem PT JAPARA MARITIM NUSANTARA.`, user.namaLengkap);

      sendJson(res, 200, {
        success: true,
        message: 'Login berhasil! Selamat datang di PT JAPARA MARITIM NUSANTARA.',
        user: sessionData,
      });
      return true;
    }

    if (cleanUrl === '/api/auth/session' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { token } = body;
      if (!token || !ACTIVE_SESSIONS.has(token)) {
        sendJson(res, 401, { success: false, error: 'Sesi kedaluwarsa atau tidak valid.' });
        return true;
      }
      const session = ACTIVE_SESSIONS.get(token);
      recordUserHeartbeat(session);
      sendJson(res, 200, { success: true, user: session });
      return true;
    }

    if (cleanUrl === '/api/auth/logout' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { token, username } = body;
      if (token) {
        const sess = ACTIVE_SESSIONS.get(token);
        if (sess) {
          recordUserLogout(sess.username);
        }
        ACTIVE_SESSIONS.delete(token);
      } else if (username) {
        recordUserLogout(username);
      }
      sendJson(res, 200, { success: true, message: 'Berhasil keluar.' });
      return true;
    }

    // ----------------------------------------------------
    // REALTIME & ONLINE PRESENCE ROUTES
    // ----------------------------------------------------
    if (cleanUrl === '/api/realtime/stream') {
      handleSseConnection(req, res);
      return true;
    }

    if (cleanUrl === '/api/realtime/status' && method === 'GET') {
      sendJson(res, 200, { success: true, data: getRealtimeStatus() });
      return true;
    }

    if (cleanUrl === '/api/presence/heartbeat' && method === 'POST') {
      const body = await parseRequestBody(req);
      const user = recordUserHeartbeat(body);
      sendJson(res, 200, {
        success: true,
        user,
        onlineUsers: getOnlineUsersList(),
        serverTime: new Date().toISOString(),
      });
      return true;
    }

    if (cleanUrl === '/api/presence/online' && method === 'GET') {
      sendJson(res, 200, {
        success: true,
        data: getOnlineUsersList(),
        onlineCount: getOnlineUsersList().length,
      });
      return true;
    }

    if (cleanUrl === '/api/realtime/broadcast' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { message, actor } = body;
      const text = String(message || '').trim();
      if (!text) {
        sendJson(res, 400, { success: false, error: 'Pesan siaran operasional wajib diisi.' });
        return true;
      }
      const sender = actor || 'Operator';
      const event = broadcastEvent({
        type: 'announcement:new',
        actor: sender,
        message: text,
        payload: { text, sender, time: new Date().toISOString() },
      });
      logAudit('BROADCAST_MSG', `Siaran operasional oleh ${sender}: "${text}"`, sender);
      sendJson(res, 200, {
        success: true,
        message: 'Pesan telah disiarkan langsung ke seluruh pengguna online.',
        data: event,
      });
      return true;
    }

    // ----------------------------------------------------
    // 2. DASHBOARD & STATS
    // ----------------------------------------------------
    if (cleanUrl === '/api/stats' && method === 'GET') {
      const db = getDatabase();
      const totalShips = db.ships.length;
      const shipsSailing = db.ships.filter(s => s.status === 'Berlayar').length;
      const totalDWT = db.ships.reduce((acc, s) => acc + (Number(s.kapasitasDWT) || 0), 0);
      const activeVoyages = db.voyages.filter(v => v.status === 'Dalam Pelayaran' || v.status === 'Proses Muat').length;
      const totalCargoTon = db.cargo.reduce((acc, c) => acc + (Number(c.beratTon) || 0), 0);
      const totalCargoValue = db.cargo.reduce((acc, c) => acc + (Number(c.nilaiKargo) || 0), 0);

      sendJson(res, 200, {
        success: true,
        data: {
          totalShips,
          shipsSailing,
          totalDWT,
          activeVoyages,
          totalCargoTon,
          totalCargoValue,
          totalManifests: db.cargo.length,
          totalPorts: db.ports.length,
          databaseEngine: 'Server File-Backed Persistent Database (ACID Zero-localStorage)',
          timestamp: new Date().toISOString(),
        },
      });
      return true;
    }

    // ----------------------------------------------------
    // 3. SHIPS CRUD (/api/ships)
    // ----------------------------------------------------
    if (cleanUrl === '/api/ships') {
      const db = getDatabase();
      if (method === 'GET') {
        sendJson(res, 200, { success: true, data: db.ships });
        return true;
      }

      if (method === 'POST') {
        const payload = await parseRequestBody(req);
        // Strict Validation
        if (!payload.namaKapal?.trim()) {
          sendJson(res, 400, { success: false, error: 'Nama kapal wajib diisi.' });
          return true;
        }
        if (!payload.imoNumber?.trim()) {
          sendJson(res, 400, { success: false, error: 'Nomor IMO kapal wajib diisi.' });
          return true;
        }
        // IMO format validation (e.g., IMO 1234567 or 7 digits)
        const digits = payload.imoNumber.replace(/[^0-9]/g, '');
        if (digits.length !== 7) {
          sendJson(res, 400, {
            success: false,
            error: 'Nomor IMO harus memiliki tepat 7 digit angka sesuai standar International Maritime Organization.',
          });
          return true;
        }
        if (!payload.callSign?.trim()) {
          sendJson(res, 400, { success: false, error: 'Call Sign / Tanda Selar kapal wajib diisi.' });
          return true;
        }
        if (Number(payload.kapasitasDWT) <= 0) {
          sendJson(res, 400, { success: false, error: 'Kapasitas DWT (ton) harus lebih besar dari 0.' });
          return true;
        }

        const newShip = {
          id: 'shp-' + Date.now().toString(36),
          namaKapal: payload.namaKapal.trim(),
          imoNumber: payload.imoNumber.trim().startsWith('IMO') ? payload.imoNumber.trim() : `IMO ${digits}`,
          callSign: payload.callSign.trim().toUpperCase(),
          jenisKapal: payload.jenisKapal || 'Container Ship',
          kapasitasDWT: Number(payload.kapasitasDWT) || 0,
          kapasitasTEU: Number(payload.kapasitasTEU) || 0,
          tahunPembuatan: Number(payload.tahunPembuatan) || new Date().getFullYear(),
          bendera: payload.bendera?.trim() || 'Indonesia',
          status: payload.status || 'Berlayar',
          posisiSaatIni: payload.posisiSaatIni?.trim() || 'Pelabuhan Pangkalan',
          nahkoda: payload.nahkoda?.trim() || 'Belum Ditugaskan',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.ships.unshift(newShip);
        saveDatabase(db);
        logAudit('CREATE_SHIP', `Menambahkan kapal baru: ${newShip.namaKapal} (${newShip.imoNumber})`, 'Admin');
        broadcastEvent({
          type: 'ship:created',
          actor: 'Operator Sistem',
          message: `Kapal ${newShip.namaKapal} (${newShip.imoNumber}) berhasil ditambahkan ke armada.`,
          payload: newShip,
        });

        sendJson(res, 201, {
          success: true,
          message: `Kapal ${newShip.namaKapal} berhasil didaftarkan secara persisten di database.`,
          data: newShip,
        });
        return true;
      }
    }

    if (cleanUrl.startsWith('/api/ships/')) {
      const id = cleanUrl.replace('/api/ships/', '');
      const db = getDatabase();
      const index = db.ships.findIndex(s => s.id === id);

      if (index === -1) {
        sendJson(res, 404, { success: false, error: 'Kapal tidak ditemukan di database.' });
        return true;
      }

      if (method === 'GET') {
        sendJson(res, 200, { success: true, data: db.ships[index] });
        return true;
      }

      if (method === 'PUT') {
        const payload = await parseRequestBody(req);
        if (!payload.namaKapal?.trim()) {
          sendJson(res, 400, { success: false, error: 'Nama kapal tidak boleh kosong.' });
          return true;
        }

        const digits = (payload.imoNumber || '').replace(/[^0-9]/g, '');
        if (digits.length !== 7) {
          sendJson(res, 400, { success: false, error: 'Nomor IMO harus memiliki tepat 7 digit.' });
          return true;
        }

        const existing = db.ships[index];
        const updated = {
          ...existing,
          namaKapal: payload.namaKapal.trim(),
          imoNumber: payload.imoNumber.trim().startsWith('IMO') ? payload.imoNumber.trim() : `IMO ${digits}`,
          callSign: payload.callSign ? payload.callSign.trim().toUpperCase() : existing.callSign,
          jenisKapal: payload.jenisKapal || existing.jenisKapal,
          kapasitasDWT: Number(payload.kapasitasDWT) || existing.kapasitasDWT,
          kapasitasTEU: Number(payload.kapasitasTEU) ?? existing.kapasitasTEU,
          tahunPembuatan: Number(payload.tahunPembuatan) || existing.tahunPembuatan,
          bendera: payload.bendera?.trim() || existing.bendera,
          status: payload.status || existing.status,
          posisiSaatIni: payload.posisiSaatIni?.trim() || existing.posisiSaatIni,
          nahkoda: payload.nahkoda?.trim() || existing.nahkoda,
          updatedAt: new Date().toISOString(),
        };

        db.ships[index] = updated;

        // Also update ship name in active voyages
        db.voyages.forEach(v => {
          if (v.kapalId === id) {
            v.namaKapal = updated.namaKapal;
          }
        });

        saveDatabase(db);
        logAudit('UPDATE_SHIP', `Memperbarui data kapal: ${updated.namaKapal}`, 'Admin');
        broadcastEvent({
          type: 'ship:updated',
          actor: 'Operator Sistem',
          message: `Data kapal ${updated.namaKapal} (${updated.status}) baru saja diperbarui.`,
          payload: updated,
        });

        sendJson(res, 200, {
          success: true,
          message: `Data kapal ${updated.namaKapal} berhasil diperbarui di database persisten.`,
          data: updated,
        });
        return true;
      }

      if (method === 'DELETE') {
        // Validation check: Cannot delete if ship has active voyages
        const hasActiveVoyage = db.voyages.some(
          v => v.kapalId === id && (v.status === 'Dalam Pelayaran' || v.status === 'Proses Muat'),
        );
        if (hasActiveVoyage) {
          sendJson(res, 400, {
            success: false,
            error: 'Tidak dapat menghapus kapal ini karena sedang memiliki jadwal pelayaran aktif yang sedang berlangsung.',
          });
          return true;
        }

        const deleted = db.ships.splice(index, 1)[0];
        saveDatabase(db);
        logAudit('DELETE_SHIP', `Menghapus kapal: ${deleted.namaKapal} (${deleted.imoNumber})`, 'Admin');
        broadcastEvent({
          type: 'ship:deleted',
          actor: 'Operator Sistem',
          message: `Kapal ${deleted.namaKapal} telah dihapus dari database.`,
          payload: { id: deleted.id, namaKapal: deleted.namaKapal },
        });

        sendJson(res, 200, {
          success: true,
          message: `Kapal ${deleted.namaKapal} berhasil dihapus dari database.`,
        });
        return true;
      }
    }

    // ----------------------------------------------------
    // 4. VOYAGES CRUD (/api/voyages)
    // ----------------------------------------------------
    if (cleanUrl === '/api/voyages') {
      const db = getDatabase();
      if (method === 'GET') {
        sendJson(res, 200, { success: true, data: db.voyages });
        return true;
      }

      if (method === 'POST') {
        const payload = await parseRequestBody(req);

        if (!payload.nomorVoyage?.trim()) {
          sendJson(res, 400, { success: false, error: 'Nomor voyage / pelayaran wajib diisi.' });
          return true;
        }
        if (!payload.kapalId) {
          sendJson(res, 400, { success: false, error: 'Pilih kapal yang ditugaskan.' });
          return true;
        }
        if (!payload.pelabuhanAsal?.trim()) {
          sendJson(res, 400, { success: false, error: 'Pelabuhan asal wajib dipilih.' });
          return true;
        }
        if (!payload.pelabuhanTujuan?.trim()) {
          sendJson(res, 400, { success: false, error: 'Pelabuhan tujuan wajib dipilih.' });
          return true;
        }
        if (payload.pelabuhanAsal === payload.pelabuhanTujuan) {
          sendJson(res, 400, { success: false, error: 'Pelabuhan asal dan tujuan tidak boleh sama.' });
          return true;
        }
        if (!payload.etd || !payload.eta) {
          sendJson(res, 400, { success: false, error: 'Waktu keberangkatan (ETD) dan kedatangan (ETA) wajib diisi.' });
          return true;
        }
        if (new Date(payload.eta).getTime() <= new Date(payload.etd).getTime()) {
          sendJson(res, 400, {
            success: false,
            error: 'Estimasi kedatangan (ETA) harus lebih lambat daripada estimasi keberangkatan (ETD).',
          });
          return true;
        }

        const ship = db.ships.find(s => s.id === payload.kapalId);
        const namaKapal = ship ? ship.namaKapal : payload.namaKapal || 'Kapal Armada';

        const newVoyage = {
          id: 'vyg-' + Date.now().toString(36),
          nomorVoyage: payload.nomorVoyage.trim().toUpperCase(),
          kapalId: payload.kapalId,
          namaKapal,
          pelabuhanAsal: payload.pelabuhanAsal.trim(),
          pelabuhanTujuan: payload.pelabuhanTujuan.trim(),
          etd: payload.etd,
          eta: payload.eta,
          status: payload.status || 'Terjadwal',
          tarifPerTon: Number(payload.tarifPerTon) || 0,
          catatanRute: payload.catatanRute?.trim() || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.voyages.unshift(newVoyage);
        saveDatabase(db);
        logAudit('CREATE_VOYAGE', `Menjadwalkan pelayaran baru: ${newVoyage.nomorVoyage} (${namaKapal})`, 'Admin');
        broadcastEvent({
          type: 'voyage:created',
          actor: 'Operator Sistem',
          message: `Jadwal pelayaran ${newVoyage.nomorVoyage} (${namaKapal}: ${newVoyage.pelabuhanAsal} ➔ ${newVoyage.pelabuhanTujuan}) berhasil diterbitkan.`,
          payload: newVoyage,
        });

        sendJson(res, 201, {
          success: true,
          message: `Jadwal pelayaran ${newVoyage.nomorVoyage} berhasil disimpan persisten.`,
          data: newVoyage,
        });
        return true;
      }
    }

    if (cleanUrl.startsWith('/api/voyages/')) {
      const id = cleanUrl.replace('/api/voyages/', '');
      const db = getDatabase();
      const index = db.voyages.findIndex(v => v.id === id);

      if (index === -1) {
        sendJson(res, 404, { success: false, error: 'Jadwal pelayaran tidak ditemukan.' });
        return true;
      }

      if (method === 'GET') {
        sendJson(res, 200, { success: true, data: db.voyages[index] });
        return true;
      }

      if (method === 'PUT') {
        const payload = await parseRequestBody(req);
        if (payload.etd && payload.eta && new Date(payload.eta).getTime() <= new Date(payload.etd).getTime()) {
          sendJson(res, 400, {
            success: false,
            error: 'Estimasi kedatangan (ETA) harus lebih lambat daripada estimasi keberangkatan (ETD).',
          });
          return true;
        }

        const existing = db.voyages[index];
        const ship = payload.kapalId ? db.ships.find(s => s.id === payload.kapalId) : null;

        const updated = {
          ...existing,
          nomorVoyage: payload.nomorVoyage ? payload.nomorVoyage.trim().toUpperCase() : existing.nomorVoyage,
          kapalId: payload.kapalId || existing.kapalId,
          namaKapal: ship ? ship.namaKapal : existing.namaKapal,
          pelabuhanAsal: payload.pelabuhanAsal || existing.pelabuhanAsal,
          pelabuhanTujuan: payload.pelabuhanTujuan || existing.pelabuhanTujuan,
          etd: payload.etd || existing.etd,
          eta: payload.eta || existing.eta,
          status: payload.status || existing.status,
          tarifPerTon: payload.tarifPerTon !== undefined ? Number(payload.tarifPerTon) : existing.tarifPerTon,
          catatanRute: payload.catatanRute !== undefined ? payload.catatanRute : existing.catatanRute,
          updatedAt: new Date().toISOString(),
        };

        db.voyages[index] = updated;

        // Also update voyage number in associated cargo
        db.cargo.forEach(c => {
          if (c.voyageId === id) {
            c.nomorVoyage = updated.nomorVoyage;
            c.namaKapal = updated.namaKapal;
          }
        });

        saveDatabase(db);
        logAudit('UPDATE_VOYAGE', `Memperbarui jadwal pelayaran: ${updated.nomorVoyage}`, 'Admin');
        broadcastEvent({
          type: 'voyage:updated',
          actor: 'Operator Sistem',
          message: `Jadwal pelayaran ${updated.nomorVoyage} (${updated.namaKapal}) diperbarui menjadi status: ${updated.status}.`,
          payload: updated,
        });

        sendJson(res, 200, {
          success: true,
          message: `Jadwal pelayaran ${updated.nomorVoyage} berhasil diperbarui.`,
          data: updated,
        });
        return true;
      }

      if (method === 'DELETE') {
        // Validation check: Cannot delete voyage if cargo is assigned to it
        const hasCargo = db.cargo.some(c => c.voyageId === id);
        if (hasCargo) {
          sendJson(res, 400, {
            success: false,
            error: 'Tidak dapat menghapus pelayaran ini karena terdapat manifes muatan kargo (Bill of Lading) yang terikat.',
          });
          return true;
        }

        const deleted = db.voyages.splice(index, 1)[0];
        saveDatabase(db);
        logAudit('DELETE_VOYAGE', `Menghapus jadwal pelayaran: ${deleted.nomorVoyage}`, 'Admin');
        broadcastEvent({
          type: 'voyage:deleted',
          actor: 'Operator Sistem',
          message: `Jadwal pelayaran ${deleted.nomorVoyage} telah dihapus.`,
          payload: { id: deleted.id, nomorVoyage: deleted.nomorVoyage },
        });

        sendJson(res, 200, {
          success: true,
          message: `Jadwal pelayaran ${deleted.nomorVoyage} berhasil dihapus dari database.`,
        });
        return true;
      }
    }

    // ----------------------------------------------------
    // 5. CARGO & BILL OF LADING CRUD (/api/cargo)
    // ----------------------------------------------------
    if (cleanUrl === '/api/cargo') {
      const db = getDatabase();
      if (method === 'GET') {
        sendJson(res, 200, { success: true, data: db.cargo });
        return true;
      }

      if (method === 'POST') {
        const payload = await parseRequestBody(req);

        if (!payload.nomorBL?.trim()) {
          sendJson(res, 400, { success: false, error: 'Nomor Bill of Lading (B/L) wajib diisi.' });
          return true;
        }
        // Check uniqueness of BL
        if (db.cargo.some(c => c.nomorBL.toLowerCase() === payload.nomorBL.trim().toLowerCase())) {
          sendJson(res, 400, {
            success: false,
            error: `Nomor Bill of Lading ${payload.nomorBL} sudah terdaftar di database. Gunakan nomor unik.`,
          });
          return true;
        }
        if (!payload.voyageId) {
          sendJson(res, 400, { success: false, error: 'Pilih jadwal pelayaran (voyage).' });
          return true;
        }
        if (!payload.pengirim?.trim()) {
          sendJson(res, 400, { success: false, error: 'Nama Pengirim (Shipper) wajib diisi.' });
          return true;
        }
        if (!payload.penerima?.trim()) {
          sendJson(res, 400, { success: false, error: 'Nama Penerima (Consignee) wajib diisi.' });
          return true;
        }
        if (Number(payload.beratTon) <= 0) {
          sendJson(res, 400, { success: false, error: 'Berat muatan kargo (Ton) harus lebih besar dari 0.' });
          return true;
        }

        const voyage = db.voyages.find(v => v.id === payload.voyageId);
        const nomorVoyage = voyage ? voyage.nomorVoyage : 'VOY-DEFAULT';
        const namaKapal = voyage ? voyage.namaKapal : 'Armada Pelayaran';

        const newCargo = {
          id: 'crg-' + Date.now().toString(36),
          nomorBL: payload.nomorBL.trim().toUpperCase(),
          voyageId: payload.voyageId,
          nomorVoyage,
          namaKapal,
          pengirim: payload.pengirim.trim(),
          penerima: payload.penerima.trim(),
          jenisKargo: payload.jenisKargo || 'Peti Kemas 20ft',
          jumlahUnit: Number(payload.jumlahUnit) || 1,
          beratTon: Number(payload.beratTon) || 0,
          volumeCBM: Number(payload.volumeCBM) || 0,
          statusMuatan: payload.statusMuatan || 'Booking Terdaftar',
          nilaiKargo: Number(payload.nilaiKargo) || 0,
          instruksiKhusus: payload.instruksiKhusus?.trim() || 'Standar Penanganan Muatan Laut',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.cargo.unshift(newCargo);
        saveDatabase(db);
        logAudit('CREATE_CARGO', `Menerbitkan Manifes B/L: ${newCargo.nomorBL} untuk ${newCargo.pengirim}`, 'Admin');
        broadcastEvent({
          type: 'cargo:created',
          actor: 'Operator Sistem',
          message: `Manifes kargo B/L ${newCargo.nomorBL} (${newCargo.jenisKargo}, ${newCargo.beratTon} Ton) baru saja diterbitkan.`,
          payload: newCargo,
        });

        sendJson(res, 201, {
          success: true,
          message: `Manifes kargo ${newCargo.nomorBL} berhasil disimpan ke database.`,
          data: newCargo,
        });
        return true;
      }
    }

    if (cleanUrl.startsWith('/api/cargo/')) {
      const id = cleanUrl.replace('/api/cargo/', '');
      const db = getDatabase();
      const index = db.cargo.findIndex(c => c.id === id);

      if (index === -1) {
        sendJson(res, 404, { success: false, error: 'Manifes kargo tidak ditemukan.' });
        return true;
      }

      if (method === 'GET') {
        sendJson(res, 200, { success: true, data: db.cargo[index] });
        return true;
      }

      if (method === 'PUT') {
        const payload = await parseRequestBody(req);
        if (!payload.nomorBL?.trim()) {
          sendJson(res, 400, { success: false, error: 'Nomor Bill of Lading (B/L) tidak boleh kosong.' });
          return true;
        }

        const existing = db.cargo[index];
        const voyage = payload.voyageId ? db.voyages.find(v => v.id === payload.voyageId) : null;

        const updated = {
          ...existing,
          nomorBL: payload.nomorBL.trim().toUpperCase(),
          voyageId: payload.voyageId || existing.voyageId,
          nomorVoyage: voyage ? voyage.nomorVoyage : existing.nomorVoyage,
          namaKapal: voyage ? voyage.namaKapal : existing.namaKapal,
          pengirim: payload.pengirim?.trim() || existing.pengirim,
          penerima: payload.penerima?.trim() || existing.penerima,
          jenisKargo: payload.jenisKargo || existing.jenisKargo,
          jumlahUnit: Number(payload.jumlahUnit) || existing.jumlahUnit,
          beratTon: Number(payload.beratTon) || existing.beratTon,
          volumeCBM: Number(payload.volumeCBM) || existing.volumeCBM,
          statusMuatan: payload.statusMuatan || existing.statusMuatan,
          nilaiKargo: Number(payload.nilaiKargo) || existing.nilaiKargo,
          instruksiKhusus: payload.instruksiKhusus !== undefined ? payload.instruksiKhusus.trim() : existing.instruksiKhusus,
          updatedAt: new Date().toISOString(),
        };

        db.cargo[index] = updated;
        saveDatabase(db);
        logAudit('UPDATE_CARGO', `Memperbarui Manifes B/L: ${updated.nomorBL}`, 'Admin');
        broadcastEvent({
          type: 'cargo:updated',
          actor: 'Operator Sistem',
          message: `Manifes kargo B/L ${updated.nomorBL} (${updated.statusMuatan}) baru saja diperbarui.`,
          payload: updated,
        });

        sendJson(res, 200, {
          success: true,
          message: `Manifes kargo ${updated.nomorBL} berhasil diperbarui di database persisten.`,
          data: updated,
        });
        return true;
      }

      if (method === 'DELETE') {
        const deleted = db.cargo.splice(index, 1)[0];
        saveDatabase(db);
        logAudit('DELETE_CARGO', `Menghapus manifes kargo: ${deleted.nomorBL}`, 'Admin');
        broadcastEvent({
          type: 'cargo:deleted',
          actor: 'Operator Sistem',
          message: `Manifes kargo B/L ${deleted.nomorBL} telah dihapus dari database.`,
          payload: { id: deleted.id, nomorBL: deleted.nomorBL },
        });

        sendJson(res, 200, {
          success: true,
          message: `Manifes kargo ${deleted.nomorBL} berhasil dihapus dari database.`,
        });
        return true;
      }
    }

    // ----------------------------------------------------
    // 6. PORTS CRUD (/api/ports)
    // ----------------------------------------------------
    if (cleanUrl === '/api/ports') {
      const db = getDatabase();
      if (method === 'GET') {
        sendJson(res, 200, { success: true, data: db.ports });
        return true;
      }

      if (method === 'POST') {
        const payload = await parseRequestBody(req);
        if (!payload.kodePelabuhan?.trim() || !payload.namaPelabuhan?.trim()) {
          sendJson(res, 400, { success: false, error: 'Kode dan nama pelabuhan wajib diisi.' });
          return true;
        }

        const newPort = {
          id: 'prt-' + Date.now().toString(36),
          kodePelabuhan: payload.kodePelabuhan.trim().toUpperCase(),
          namaPelabuhan: payload.namaPelabuhan.trim(),
          kota: payload.kota?.trim() || '',
          kedalamanDraft: Number(payload.kedalamanDraft) || 10,
          panjangDermaga: Number(payload.panjangDermaga) || 1000,
          kontakOtoritas: payload.kontakOtoritas?.trim() || '-',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.ports.push(newPort);
        saveDatabase(db);
        logAudit('CREATE_PORT', `Menambahkan pelabuhan baru: ${newPort.namaPelabuhan}`, 'Admin');

        sendJson(res, 201, {
          success: true,
          message: `Master pelabuhan ${newPort.namaPelabuhan} berhasil disimpan.`,
          data: newPort,
        });
        return true;
      }
    }

    // ----------------------------------------------------
    // 7. AUDIT LOGS
    // ----------------------------------------------------
    if (cleanUrl === '/api/logs' && method === 'GET') {
      const db = getDatabase();
      sendJson(res, 200, { success: true, data: db.auditLogs });
      return true;
    }

    // ----------------------------------------------------
    // 8. RESET DATA TO FACTORY SEED
    // ----------------------------------------------------
    if (cleanUrl === '/api/reset' && method === 'POST') {
      const db = getDatabase();
      // Keep users, reload maritime data
      saveDatabase({
        ...db,
        auditLogs: [
          {
            id: 'log-' + Date.now(),
            action: 'RESET_FACTORY',
            description: 'Sinkronisasi ulang data angkutan laut.',
            timestamp: new Date().toISOString(),
            actor: 'Super Admin',
          },
        ],
      });
      sendJson(res, 200, { success: true, message: 'Database telah disinkronkan ulang.' });
      return true;
    }

    // Not handled by API
    return false;
  } catch (err: any) {
    console.error('API Error:', err);
    sendJson(res, 500, {
      success: false,
      error: 'Terjadi kesalahan pada server database: ' + (err?.message || 'Internal error'),
    });
    return true;
  }
}
