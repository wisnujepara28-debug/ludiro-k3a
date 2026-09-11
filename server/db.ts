import fs from 'fs';
import path from 'path';

export interface DatabaseSchema {
  ships: Array<any>;
  voyages: Array<any>;
  cargo: Array<any>;
  ports: Array<any>;
  users: Array<any>;
  auditLogs: Array<any>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

const INITIAL_DATA: DatabaseSchema = {
  users: [
    {
      id: 'usr-admin-01',
      username: 'admin',
      email: 'admin@japara-maritim.co.id',
      password: 'admin', // Bebas tanpa batasan
      namaLengkap: 'Direktur Japara Maritim',
      role: 'Super Admin',
      divisi: 'Direksi PT JAPARA MARITIM NUSANTARA',
    },
    {
      id: 'usr-ops-02',
      username: 'ops',
      email: 'ops@japara-maritim.co.id',
      password: 'ops', // Bebas tanpa batasan
      namaLengkap: 'Capt. Hendra Japara, M.Mar',
      role: 'Manajer Operasional',
      divisi: 'Divisi Pelayaran PT JAPARA MARITIM NUSANTARA',
    },
  ],
  ports: [
    {
      id: 'prt-001',
      kodePelabuhan: 'IDTPP',
      namaPelabuhan: 'Pelabuhan Tanjung Priok',
      kota: 'Jakarta Utara, DKI Jakarta',
      kedalamanDraft: 14.5,
      panjangDermaga: 4200,
      kontakOtoritas: '+62 21 4301080 (KSOP Tanjung Priok)',
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'prt-002',
      kodePelabuhan: 'IDSUB',
      namaPelabuhan: 'Pelabuhan Tanjung Perak',
      kota: 'Surabaya, Jawa Timur',
      kedalamanDraft: 12.0,
      panjangDermaga: 3100,
      kontakOtoritas: '+62 31 3291991 (Pelindo Regional 3)',
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'prt-003',
      kodePelabuhan: 'IDBLW',
      namaPelabuhan: 'Pelabuhan Belawan',
      kota: 'Medan, Sumatera Utara',
      kedalamanDraft: 11.5,
      panjangDermaga: 2450,
      kontakOtoritas: '+62 61 6941121 (Otoritas Pelabuhan Belawan)',
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'prt-004',
      kodePelabuhan: 'IDMAK',
      namaPelabuhan: 'Pelabuhan Soekarno-Hatta Makassar',
      kota: 'Makassar, Sulawesi Selatan',
      kedalamanDraft: 13.0,
      panjangDermaga: 1850,
      kontakOtoritas: '+62 411 316521 (KSOP Utama Makassar)',
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'prt-005',
      kodePelabuhan: 'IDBPN',
      namaPelabuhan: 'Pelabuhan Semayang',
      kota: 'Balikpapan, Kalimantan Timur',
      kedalamanDraft: 10.5,
      panjangDermaga: 1200,
      kontakOtoritas: '+62 542 422055 (KSOP Balikpapan)',
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
    },
  ],
  ships: [
    {
      id: 'shp-001',
      namaKapal: 'KM. Samudera Nusantara 01',
      imoNumber: 'IMO 9345612',
      callSign: 'YDBA2',
      jenisKapal: 'Container Ship',
      kapasitasDWT: 14500,
      kapasitasTEU: 950,
      tahunPembuatan: 2019,
      bendera: 'Indonesia',
      status: 'Berlayar',
      posisiSaatIni: 'Laut Jawa (05°32\'S 109°15\'E) - Kecepatan 14 knot',
      nahkoda: 'Capt. Bambang Trihatmojo, M.Mar',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-09-09T08:30:00.000Z',
    },
    {
      id: 'shp-002',
      namaKapal: 'KM. Baruna Raya Perkasa',
      imoNumber: 'IMO 9128340',
      callSign: 'PKXR9',
      jenisKapal: 'Bulk Carrier',
      kapasitasDWT: 28000,
      kapasitasTEU: 0,
      tahunPembuatan: 2016,
      bendera: 'Indonesia',
      status: 'Sandar / Bongkar Muat',
      posisiSaatIni: 'Dermaga Jamrud Utara, Tanjung Perak Surabaya',
      nahkoda: 'Capt. H. Syaiful Anwar, M.Mar',
      createdAt: '2026-02-05T11:00:00.000Z',
      updatedAt: '2026-09-08T14:20:00.000Z',
    },
    {
      id: 'shp-003',
      namaKapal: 'KM. Khatulistiwa Tanker IX',
      imoNumber: 'IMO 9456782',
      callSign: 'YCEE5',
      jenisKapal: 'Oil & Chemical Tanker',
      kapasitasDWT: 12000,
      kapasitasTEU: 0,
      tahunPembuatan: 2021,
      bendera: 'Indonesia',
      status: 'Berlayar',
      posisiSaatIni: 'Selat Makassar menuju Balikpapan (Kecepatan 12 knot)',
      nahkoda: 'Capt. Ir. Rudi Hermawan',
      createdAt: '2026-02-12T09:00:00.000Z',
      updatedAt: '2026-09-09T18:45:00.000Z',
    },
    {
      id: 'shp-004',
      namaKapal: 'TB. Bima Sena & BG. Pasifik 300',
      imoNumber: 'IMO 9871234',
      callSign: 'PKLM3',
      jenisKapal: 'Tug & Barge',
      kapasitasDWT: 8500,
      kapasitasTEU: 0,
      tahunPembuatan: 2020,
      bendera: 'Indonesia',
      status: 'Menunggu Labuh / Jangkar',
      posisiSaatIni: 'Outer Anchorage Belawan (Rede Belawan)',
      nahkoda: 'Capt. Dedi Kurniawan, ANT-II',
      createdAt: '2026-02-20T14:00:00.000Z',
      updatedAt: '2026-09-07T07:15:00.000Z',
    },
    {
      id: 'shp-005',
      namaKapal: 'KM. Meratus Andalas',
      imoNumber: 'IMO 9554321',
      callSign: 'YFFT8',
      jenisKapal: 'Container Ship',
      kapasitasDWT: 18200,
      kapasitasTEU: 1250,
      tahunPembuatan: 2017,
      bendera: 'Indonesia',
      status: 'Perawatan / Docking',
      posisiSaatIni: 'Galangan Kapal PT PAL Indonesia, Surabaya',
      nahkoda: 'Capt. Joko Susanto, M.Mar',
      createdAt: '2026-03-01T08:30:00.000Z',
      updatedAt: '2026-09-05T11:00:00.000Z',
    },
  ],
  voyages: [
    {
      id: 'vyg-001',
      nomorVoyage: 'VOY/SN01/26/048',
      kapalId: 'shp-001',
      namaKapal: 'KM. Samudera Nusantara 01',
      pelabuhanAsal: 'Pelabuhan Tanjung Priok, Jakarta (IDTPP)',
      pelabuhanTujuan: 'Pelabuhan Tanjung Perak, Surabaya (IDSUB)',
      etd: '2026-09-10T06:00',
      eta: '2026-09-12T14:00',
      status: 'Dalam Pelayaran',
      tarifPerTon: 450000,
      catatanRute: 'Rute Jalur Pantura - Muatan penuh peti kemas konsumsi & spareparts industri.',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-10T06:30:00.000Z',
    },
    {
      id: 'vyg-002',
      nomorVoyage: 'VOY/BRP/26/019',
      kapalId: 'shp-002',
      namaKapal: 'KM. Baruna Raya Perkasa',
      pelabuhanAsal: 'Pelabuhan Semayang, Balikpapan (IDBPN)',
      pelabuhanTujuan: 'Pelabuhan Tanjung Perak, Surabaya (IDSUB)',
      etd: '2026-09-06T11:00',
      eta: '2026-09-09T22:00',
      status: 'Tiba di Pelabuhan Tujuan',
      tarifPerTon: 320000,
      catatanRute: 'Muatan curah semen & bahan konstruksi IKN. Proses unloader di Jamrud.',
      createdAt: '2026-08-28T09:30:00.000Z',
      updatedAt: '2026-09-09T22:15:00.000Z',
    },
    {
      id: 'vyg-003',
      nomorVoyage: 'VOY/KT9/26/033',
      kapalId: 'shp-003',
      namaKapal: 'KM. Khatulistiwa Tanker IX',
      pelabuhanAsal: 'Pelabuhan Soekarno-Hatta Makassar (IDMAK)',
      pelabuhanTujuan: 'Pelabuhan Semayang, Balikpapan (IDBPN)',
      etd: '2026-09-11T18:00',
      eta: '2026-09-13T20:00',
      status: 'Terjadwal',
      tarifPerTon: 580000,
      catatanRute: 'Pengangkutan CPO & bahan bakar minyak. Dokumen hazmat terverifikasi.',
      createdAt: '2026-09-05T14:00:00.000Z',
      updatedAt: '2026-09-05T14:00:00.000Z',
    },
    {
      id: 'vyg-004',
      nomorVoyage: 'VOY/BMS/26/012',
      kapalId: 'shp-004',
      namaKapal: 'TB. Bima Sena & BG. Pasifik 300',
      pelabuhanAsal: 'Pelabuhan Belawan, Medan (IDBLW)',
      pelabuhanTujuan: 'Pelabuhan Tanjung Priok, Jakarta (IDTPP)',
      etd: '2026-09-13T08:00',
      eta: '2026-09-17T17:00',
      status: 'Proses Muat',
      tarifPerTon: 280000,
      catatanRute: 'Pengangkutan komoditas kayu lapis dan pupuk bersubsidi.',
      createdAt: '2026-09-07T10:00:00.000Z',
      updatedAt: '2026-09-09T16:00:00.000Z',
    },
  ],
  cargo: [
    {
      id: 'crg-001',
      nomorBL: 'BL/JKT-SBY/26/00481',
      voyageId: 'vyg-001',
      nomorVoyage: 'VOY/SN01/26/048',
      namaKapal: 'KM. Samudera Nusantara 01',
      pengirim: 'PT Indofood CBP Sukses Makmur Tbk',
      penerima: 'PT Retail Distribusi Jawa Timur',
      jenisKargo: 'Peti Kemas 40ft',
      jumlahUnit: 24,
      beratTon: 480,
      volumeCBM: 1600,
      statusMuatan: 'Dalam Perjalanan',
      nilaiKargo: 3600000000,
      instruksiKhusus: 'Peti kemas kering standar. Handle with care, barang FMCG.',
      createdAt: '2026-09-02T11:00:00.000Z',
      updatedAt: '2026-09-10T06:30:00.000Z',
    },
    {
      id: 'crg-002',
      nomorBL: 'BL/BPN-SBY/26/00192',
      voyageId: 'vyg-002',
      nomorVoyage: 'VOY/BRP/26/019',
      namaKapal: 'KM. Baruna Raya Perkasa',
      pengirim: 'PT Semen Indonesia Logistik',
      penerima: 'PT Berkat Jaya Beton Mandiri',
      jenisKargo: 'Curah Kering (Batu Bara / Semen / Gandum)',
      jumlahUnit: 1,
      beratTon: 18500,
      volumeCBM: 14200,
      statusMuatan: 'Bongkar Muat',
      nilaiKargo: 18500000000,
      instruksiKhusus: 'Curah kering, pembongkaran menggunakan crane hopper dermaga.',
      createdAt: '2026-08-29T13:00:00.000Z',
      updatedAt: '2026-09-09T22:30:00.000Z',
    },
    {
      id: 'crg-003',
      nomorBL: 'BL/JKT-SBY/26/00482',
      voyageId: 'vyg-001',
      nomorVoyage: 'VOY/SN01/26/048',
      namaKapal: 'KM. Samudera Nusantara 01',
      pengirim: 'PT Astra International Tbk',
      penerima: 'PT United Tractors Surabaya Branch',
      jenisKargo: 'Kendaraan / Alat Berat',
      jumlahUnit: 8,
      beratTon: 140,
      volumeCBM: 450,
      statusMuatan: 'Dalam Perjalanan',
      nilaiKargo: 12400000000,
      instruksiKhusus: 'Lashing rantai baja grade 80, inspeksi maritime surveyor sebelum layar.',
      createdAt: '2026-09-03T15:00:00.000Z',
      updatedAt: '2026-09-10T06:30:00.000Z',
    },
    {
      id: 'crg-004',
      nomorBL: 'BL/MAK-BPN/26/00331',
      voyageId: 'vyg-003',
      nomorVoyage: 'VOY/KT9/26/033',
      namaKapal: 'KM. Khatulistiwa Tanker IX',
      pengirim: 'PT Wilmar Nabati Indonesia',
      penerima: 'PT Agro Mandiri Sejahtera',
      jenisKargo: 'Cairan Industri / CPO',
      jumlahUnit: 1,
      beratTon: 6200,
      volumeCBM: 6800,
      statusMuatan: 'Booking Terdaftar',
      nilaiKargo: 68200000000,
      instruksiKhusus: 'Suhu tangki dipertahankan 45-50°C. Uji laboratorium FFA dan moisture.',
      createdAt: '2026-09-06T10:00:00.000Z',
      updatedAt: '2026-09-06T10:00:00.000Z',
    },
  ],
  auditLogs: [
    {
      id: 'log-001',
      action: 'SYSTEM_INIT',
      description: 'Inisialisasi database master angkutan laut.',
      timestamp: '2026-09-10T00:00:00.000Z',
      actor: 'System Bootstrap',
    },
  ],
};

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring data file:', err);
  }
}

export function getDatabase(): DatabaseSchema {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (err) {
    console.error('Error reading database file, returning initial:', err);
    return INITIAL_DATA;
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  ensureDataFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
    throw new Error('Gagal menyimpan ke database persisten server.');
  }
}

export function logAudit(action: string, description: string, actor: string): void {
  const db = getDatabase();
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action,
    description,
    timestamp: new Date().toISOString(),
    actor,
  });
  if (db.auditLogs.length > 50) {
    db.auditLogs = db.auditLogs.slice(0, 50);
  }
  saveDatabase(db);
}
