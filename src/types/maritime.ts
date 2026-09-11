export type ShipType = 
  | 'Container Ship' 
  | 'Bulk Carrier' 
  | 'Oil & Chemical Tanker' 
  | 'Ro-Ro Passenger/Cargo' 
  | 'Tug & Barge' 
  | 'General Cargo';

export type ShipStatus = 
  | 'Berlayar' 
  | 'Sandar / Bongkar Muat' 
  | 'Menunggu Labuh / Jangkar' 
  | 'Perawatan / Docking';

export interface Ship {
  id: string;
  namaKapal: string;
  imoNumber: string; // 7 digits IMO format e.g. "IMO 9283741"
  callSign: string;
  jenisKapal: ShipType;
  kapasitasDWT: number; // Deadweight tonnage (tons)
  kapasitasTEU: number; // TEU for containers
  tahunPembuatan: number;
  bendera: string;
  status: ShipStatus;
  posisiSaatIni: string;
  nahkoda: string;
  createdAt: string;
  updatedAt: string;
}

export type VoyageStatus = 
  | 'Terjadwal' 
  | 'Proses Muat' 
  | 'Dalam Pelayaran' 
  | 'Tiba di Pelabuhan Tujuan' 
  | 'Selesai' 
  | 'Tertunda Cuaca';

export interface Voyage {
  id: string;
  nomorVoyage: string;
  kapalId: string;
  namaKapal: string;
  pelabuhanAsal: string;
  pelabuhanTujuan: string;
  etd: string; // Estimated Time of Departure (YYYY-MM-DDTHH:mm)
  eta: string; // Estimated Time of Arrival (YYYY-MM-DDTHH:mm)
  status: VoyageStatus;
  tarifPerTon: number; // Rupiah per ton
  catatanRute: string;
  createdAt: string;
  updatedAt: string;
}

export type CargoType = 
  | 'Peti Kemas 20ft' 
  | 'Peti Kemas 40ft' 
  | 'Curah Kering (Batu Bara / Semen / Gandum)' 
  | 'Kargo Umum (General Cargo)' 
  | 'Kendaraan / Alat Berat' 
  | 'Cairan Industri / CPO';

export type CargoStatus = 
  | 'Booking Terdaftar' 
  | 'Pemuatan Kapal' 
  | 'Dalam Perjalanan' 
  | 'Bongkar Muat' 
  | 'Telah Diserahkan (Released)';

export interface CargoItem {
  id: string;
  nomorBL: string; // Bill of Lading No e.g. "BL/JKT-SBY/2026/001"
  voyageId: string;
  nomorVoyage: string;
  namaKapal: string;
  pengirim: string; // Shipper
  penerima: string; // Consignee
  jenisKargo: CargoType;
  jumlahUnit: number;
  beratTon: number;
  volumeCBM: number;
  statusMuatan: CargoStatus;
  nilaiKargo: number; // In IDR
  instruksiKhusus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Port {
  id: string;
  kodePelabuhan: string; // e.g. "IDTPP"
  namaPelabuhan: string;
  kota: string;
  kedalamanDraft: number; // in meters
  panjangDermaga: number; // in meters
  kontakOtoritas: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  username: string;
  email: string;
  namaLengkap: string;
  role: 'Super Admin' | 'Manajer Operasional' | 'Staf Logistik';
  divisi: string;
  loginAt: string;
  token: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actor: string;
  description: string;
  timestamp: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

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

