import type React from 'react';
import { useState, useMemo } from 'react';
import { Ship as ShipIcon, Plus, Search, Filter, Edit3, Trash2, Anchor, Compass, Check, X, AlertCircle } from 'lucide-react';
import type { Ship, ShipType, ShipStatus } from '../../types/maritime';
import { ConfirmModal } from '../common/ConfirmModal';

interface ShipManagementProps {
  ships: Ship[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateShip: (data: Partial<Ship>) => Promise<void>;
  onUpdateShip: (id: string, data: Partial<Ship>) => Promise<void>;
  onDeleteShip: (id: string) => Promise<void>;
}

const SHIP_TYPES: ShipType[] = [
  'Container Ship',
  'Bulk Carrier',
  'Oil & Chemical Tanker',
  'Ro-Ro Passenger/Cargo',
  'Tug & Barge',
  'General Cargo',
];

const SHIP_STATUSES: ShipStatus[] = [
  'Berlayar',
  'Sandar / Bongkar Muat',
  'Menunggu Labuh / Jangkar',
  'Perawatan / Docking',
];

export function ShipManagement({
  ships,
  isLoading,
  onRefresh,
  onCreateShip,
  onUpdateShip,
  onDeleteShip,
}: ShipManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShip, setEditingShip] = useState<Ship | null>(null);
  const [deletingShip, setDeletingShip] = useState<Ship | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [namaKapal, setNamaKapal] = useState('');
  const [imoNumber, setImoNumber] = useState('');
  const [callSign, setCallSign] = useState('');
  const [jenisKapal, setJenisKapal] = useState<ShipType>('Container Ship');
  const [kapasitasDWT, setKapasitasDWT] = useState<number>(10000);
  const [kapasitasTEU, setKapasitasTEU] = useState<number>(500);
  const [tahunPembuatan, setTahunPembuatan] = useState<number>(2020);
  const [bendera, setBendera] = useState('Indonesia');
  const [status, setStatus] = useState<ShipStatus>('Berlayar');
  const [posisiSaatIni, setPosisiSaatIni] = useState('');
  const [nahkoda, setNahkoda] = useState('');

  // Filtered vessels
  const filteredShips = useMemo(() => {
    return ships.filter(s => {
      const matchSearch =
        s.namaKapal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.imoNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.callSign.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nahkoda.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.posisiSaatIni.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = filterType === 'ALL' || s.jenisKapal === filterType;
      const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [ships, searchQuery, filterType, filterStatus]);

  const openCreateModal = () => {
    setEditingShip(null);
    setNamaKapal('');
    setImoNumber('');
    setCallSign('');
    setJenisKapal('Container Ship');
    setKapasitasDWT(12000);
    setKapasitasTEU(800);
    setTahunPembuatan(2021);
    setBendera('Indonesia');
    setStatus('Berlayar');
    setPosisiSaatIni('Laut Jawa');
    setNahkoda('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (ship: Ship) => {
    setEditingShip(ship);
    setNamaKapal(ship.namaKapal);
    setImoNumber(ship.imoNumber);
    setCallSign(ship.callSign);
    setJenisKapal(ship.jenisKapal);
    setKapasitasDWT(ship.kapasitasDWT);
    setKapasitasTEU(ship.kapasitasTEU);
    setTahunPembuatan(ship.tahunPembuatan);
    setBendera(ship.bendera);
    setStatus(ship.status);
    setPosisiSaatIni(ship.posisiSaatIni);
    setNahkoda(ship.nahkoda);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!namaKapal.trim()) {
      errors.namaKapal = 'Nama kapal wajib diisi.';
    } else if (namaKapal.trim().length < 3) {
      errors.namaKapal = 'Nama kapal minimal 3 karakter.';
    }

    const digits = imoNumber.replace(/[^0-9]/g, '');
    if (!imoNumber.trim()) {
      errors.imoNumber = 'Nomor IMO wajib diisi.';
    } else if (digits.length !== 7) {
      errors.imoNumber = 'Nomor IMO harus memiliki tepat 7 digit angka (misal: IMO 9345612).';
    }

    if (!callSign.trim()) {
      errors.callSign = 'Call Sign (Tanda Selar) wajib diisi.';
    }

    if (!kapasitasDWT || Number(kapasitasDWT) <= 0) {
      errors.kapasitasDWT = 'Kapasitas DWT harus lebih besar dari 0 ton.';
    }

    if (kapasitasTEU < 0) {
      errors.kapasitasTEU = 'Kapasitas TEU tidak boleh bernilai negatif.';
    }

    const currentYear = new Date().getFullYear();
    if (!tahunPembuatan || tahunPembuatan < 1970 || tahunPembuatan > currentYear + 1) {
      errors.tahunPembuatan = `Tahun pembuatan harus antara 1970 dan ${currentYear + 1}.`;
    }

    if (!bendera.trim()) {
      errors.bendera = 'Negara bendera kapal wajib diisi.';
    }

    if (!nahkoda.trim()) {
      errors.nahkoda = 'Nama nahkoda wajib diisi.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const digits = imoNumber.replace(/[^0-9]/g, '');
      const formattedIMO = `IMO ${digits}`;

      const payload = {
        namaKapal: namaKapal.trim(),
        imoNumber: formattedIMO,
        callSign: callSign.trim().toUpperCase(),
        jenisKapal,
        kapasitasDWT: Number(kapasitasDWT),
        kapasitasTEU: Number(kapasitasTEU) || 0,
        tahunPembuatan: Number(tahunPembuatan),
        bendera: bendera.trim(),
        status,
        posisiSaatIni: posisiSaatIni.trim() || 'Pelabuhan Pangkalan',
        nahkoda: nahkoda.trim(),
      };

      if (editingShip) {
        await onUpdateShip(editingShip.id, payload);
      } else {
        await onCreateShip(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingShip) return;
    setIsSubmitting(true);
    try {
      await onDeleteShip(deletingShip.id);
      setDeletingShip(null);
    } catch (err) {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (st: ShipStatus) => {
    const styles: Record<ShipStatus, string> = {
      Berlayar: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Sandar / Bongkar Muat': 'bg-blue-50 text-blue-700 border-blue-200',
      'Menunggu Labuh / Jangkar': 'bg-amber-50 text-amber-700 border-amber-200',
      'Perawatan / Docking': 'bg-slate-100 text-slate-700 border-slate-300',
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[st]}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            st === 'Berlayar'
              ? 'bg-emerald-500 animate-pulse'
              : st === 'Sandar / Bongkar Muat'
              ? 'bg-blue-500'
              : st === 'Menunggu Labuh / Jangkar'
              ? 'bg-amber-500'
              : 'bg-slate-400'
          }`}
        ></span>
        {st}
      </span>
    );
  };

  return (
    <div id="ship-management-view" className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShipIcon className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Manajemen Armada Kapal (Fleet)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data registrasi kapal niaga, nomor IMO, kapasitas muat DWT/TEU, dan status operasional real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="create-ship-btn"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan Kapal Baru</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-ship-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama kapal, IMO, call sign, atau nahkoda..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Type */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            id="filter-ship-type-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full md:w-44 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Jenis Kapal</option>
            {SHIP_TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            id="filter-ship-status-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full md:w-48 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Status Operasi</option>
            {SHIP_STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ships Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="ships-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Nama Kapal & IMO</th>
                <th className="py-3.5 px-4">Jenis Kapal</th>
                <th className="py-3.5 px-4">Kapasitas (DWT / TEU)</th>
                <th className="py-3.5 px-4">Posisi & Nahkoda</th>
                <th className="py-3.5 px-4">Status Operasional</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data armada dari database persisten...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredShips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ShipIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada kapal yang cocok</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ubah kata kunci pencarian atau daftarkan kapal baru ke armada.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredShips.map(ship => (
                  <tr key={ship.id} id={`ship-row-${ship.id}`} className="hover:bg-sky-50/30 transition-colors">
                    {/* Ship Name & IMO */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Anchor className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        {ship.namaKapal}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono font-medium text-slate-700">{ship.imoNumber}</span>
                        <span>&bull;</span>
                        <span>Call Sign: <strong className="text-slate-700">{ship.callSign}</strong></span>
                        <span>&bull;</span>
                        <span>{ship.bendera}</span>
                      </div>
                    </td>

                    {/* Ship Type */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{ship.jenisKapal}</span>
                      <div className="text-[11px] text-slate-400">Tahun {ship.tahunPembuatan}</div>
                    </td>

                    {/* Capacity */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {ship.kapasitasDWT.toLocaleString('id-ID')} Ton DWT
                      </div>
                      {ship.kapasitasTEU > 0 && (
                        <div className="text-[11px] text-sky-600 font-medium">
                          {ship.kapasitasTEU.toLocaleString('id-ID')} TEU
                        </div>
                      )}
                    </td>

                    {/* Position & Captain */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-800 font-medium truncate flex items-center gap-1">
                        <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                        {ship.posisiSaatIni}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Nahkoda: {ship.nahkoda}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(ship.status)}</td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`edit-ship-${ship.id}`}
                          onClick={() => openEditModal(ship)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Kapal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-ship-${ship.id}`}
                          onClick={() => setDeletingShip(ship)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Kapal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredShips.length} dari total {ships.length} armada kapal</span>
          <button
            onClick={onRefresh}
            className="text-sky-600 hover:text-sky-800 font-medium cursor-pointer"
          >
            Segarkan Data
          </button>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          id="ship-form-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <ShipIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingShip ? 'Perbarui Data Kapal' : 'Registrasi Kapal Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Input disimpan langsung ke database persisten server.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
              {/* Row 1: Nama Kapal & IMO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Kapal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-ship-name"
                    type="text"
                    value={namaKapal}
                    onChange={e => setNamaKapal(e.target.value)}
                    placeholder="misal: KM. Samudera Raya 05"
                    className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 border text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 ${
                      formErrors.namaKapal
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-sky-500'
                    }`}
                  />
                  {formErrors.namaKapal && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.namaKapal}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor IMO (7 Digit Standar) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-ship-imo"
                    type="text"
                    value={imoNumber}
                    onChange={e => setImoNumber(e.target.value)}
                    placeholder="misal: IMO 9482156"
                    className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 border text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 ${
                      formErrors.imoNumber
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-sky-500'
                    }`}
                  />
                  {formErrors.imoNumber && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.imoNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Call Sign & Jenis Kapal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Call Sign / Tanda Selar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-ship-callsign"
                    type="text"
                    value={callSign}
                    onChange={e => setCallSign(e.target.value.toUpperCase())}
                    placeholder="misal: YDBA5"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 uppercase font-mono"
                  />
                  {formErrors.callSign && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.callSign}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kapal</label>
                  <select
                    id="input-ship-type"
                    value={jenisKapal}
                    onChange={e => setJenisKapal(e.target.value as ShipType)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {SHIP_TYPES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: DWT & TEU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kapasitas DWT (Ton) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-ship-dwt"
                    type="number"
                    min="1"
                    value={kapasitasDWT}
                    onChange={e => setKapasitasDWT(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.kapasitasDWT && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.kapasitasDWT}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kapasitas TEU (Peti Kemas)
                  </label>
                  <input
                    id="input-ship-teu"
                    type="number"
                    min="0"
                    value={kapasitasTEU}
                    onChange={e => setKapasitasTEU(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tahun Pembuatan
                  </label>
                  <input
                    id="input-ship-year"
                    type="number"
                    value={tahunPembuatan}
                    onChange={e => setTahunPembuatan(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.tahunPembuatan && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.tahunPembuatan}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Status & Bendera */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Operasional Kapal
                  </label>
                  <select
                    id="input-ship-status"
                    value={status}
                    onChange={e => setStatus(e.target.value as ShipStatus)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {SHIP_STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Negara Bendera
                  </label>
                  <input
                    id="input-ship-flag"
                    type="text"
                    value={bendera}
                    onChange={e => setBendera(e.target.value)}
                    placeholder="misal: Indonesia"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Row 5: Posisi Terkini & Nahkoda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Posisi / Lokasi Terkini
                  </label>
                  <input
                    id="input-ship-position"
                    type="text"
                    value={posisiSaatIni}
                    onChange={e => setPosisiSaatIni(e.target.value)}
                    placeholder="misal: Dermaga 102 Tanjung Priok"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nahkoda (Master / Captain) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-ship-captain"
                    type="text"
                    value={nahkoda}
                    onChange={e => setNahkoda(e.target.value)}
                    placeholder="misal: Capt. Budi Santoso, M.Mar"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.nahkoda && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.nahkoda}</p>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  id="cancel-ship-form-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="save-ship-form-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan ke Server...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingShip ? 'Simpan Perubahan' : 'Daftarkan Kapal'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingShip}
        title="Konfirmasi Penghapusan Kapal"
        message={`Apakah Anda yakin ingin menghapus data kapal "${deletingShip?.namaKapal}" (${deletingShip?.imoNumber}) dari database? Tindakan ini bersifat permanen.`}
        confirmLabel="Hapus Kapal"
        cancelLabel="Batal"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingShip(null)}
      />
    </div>
  );
}
