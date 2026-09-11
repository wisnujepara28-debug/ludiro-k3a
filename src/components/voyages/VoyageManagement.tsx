import type React from 'react';
import { useState, useMemo } from 'react';
import { Navigation, Plus, Search, Filter, Edit3, Trash2, ArrowRight, Calendar, Clock, AlertCircle, Check, X, Anchor } from 'lucide-react';
import type { Voyage, VoyageStatus, Ship, Port } from '../../types/maritime';
import { ConfirmModal } from '../common/ConfirmModal';

interface VoyageManagementProps {
  voyages: Voyage[];
  ships: Ship[];
  ports: Port[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateVoyage: (data: Partial<Voyage>) => Promise<void>;
  onUpdateVoyage: (id: string, data: Partial<Voyage>) => Promise<void>;
  onDeleteVoyage: (id: string) => Promise<void>;
}

const VOYAGE_STATUSES: VoyageStatus[] = [
  'Terjadwal',
  'Proses Muat',
  'Dalam Pelayaran',
  'Tiba di Pelabuhan Tujuan',
  'Selesai',
  'Tertunda Cuaca',
];

export function VoyageManagement({
  voyages,
  ships,
  ports,
  isLoading,
  onRefresh,
  onCreateVoyage,
  onUpdateVoyage,
  onDeleteVoyage,
}: VoyageManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoyage, setEditingVoyage] = useState<Voyage | null>(null);
  const [deletingVoyage, setDeletingVoyage] = useState<Voyage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [nomorVoyage, setNomorVoyage] = useState('');
  const [kapalId, setKapalId] = useState('');
  const [pelabuhanAsal, setPelabuhanAsal] = useState('');
  const [pelabuhanTujuan, setPelabuhanTujuan] = useState('');
  const [etd, setEtd] = useState('');
  const [eta, setEta] = useState('');
  const [status, setStatus] = useState<VoyageStatus>('Terjadwal');
  const [tarifPerTon, setTarifPerTon] = useState<number>(350000);
  const [catatanRute, setCatatanRute] = useState('');

  const filteredVoyages = useMemo(() => {
    return voyages.filter(v => {
      const matchSearch =
        v.nomorVoyage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.namaKapal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.pelabuhanAsal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.pelabuhanTujuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.catatanRute.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = filterStatus === 'ALL' || v.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [voyages, searchQuery, filterStatus]);

  const defaultEtdString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  };

  const defaultEtaString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().slice(0, 16);
  };

  const openCreateModal = () => {
    setEditingVoyage(null);
    setNomorVoyage(`VOY/${Date.now().toString().slice(-4)}`);
    setKapalId(ships.length > 0 ? ships[0].id : '');
    setPelabuhanAsal(ports.length > 0 ? ports[0].namaPelabuhan + ' (' + ports[0].kodePelabuhan + ')' : 'Pelabuhan Tanjung Priok (IDTPP)');
    setPelabuhanTujuan(ports.length > 1 ? ports[1].namaPelabuhan + ' (' + ports[1].kodePelabuhan + ')' : 'Pelabuhan Tanjung Perak (IDSUB)');
    setEtd(defaultEtdString());
    setEta(defaultEtaString());
    setStatus('Terjadwal');
    setTarifPerTon(400000);
    setCatatanRute('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (voyage: Voyage) => {
    setEditingVoyage(voyage);
    setNomorVoyage(voyage.nomorVoyage);
    setKapalId(voyage.kapalId);
    setPelabuhanAsal(voyage.pelabuhanAsal);
    setPelabuhanTujuan(voyage.pelabuhanTujuan);
    setEtd(voyage.etd);
    setEta(voyage.eta);
    setStatus(voyage.status);
    setTarifPerTon(voyage.tarifPerTon);
    setCatatanRute(voyage.catatanRute);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!nomorVoyage.trim()) {
      errors.nomorVoyage = 'Nomor voyage pelayaran wajib diisi.';
    }

    if (!kapalId) {
      errors.kapalId = 'Pilih kapal armada yang berlayar.';
    }

    if (!pelabuhanAsal.trim()) {
      errors.pelabuhanAsal = 'Pilih pelabuhan asal keberangkatan.';
    }

    if (!pelabuhanTujuan.trim()) {
      errors.pelabuhanTujuan = 'Pilih pelabuhan tujuan kedatangan.';
    }

    if (pelabuhanAsal === pelabuhanTujuan) {
      errors.pelabuhanTujuan = 'Pelabuhan tujuan tidak boleh sama dengan pelabuhan asal.';
    }

    if (!etd) {
      errors.etd = 'Waktu keberangkatan (ETD) wajib diisi.';
    }

    if (!eta) {
      errors.eta = 'Waktu kedatangan (ETA) wajib diisi.';
    }

    if (etd && eta && new Date(eta).getTime() <= new Date(etd).getTime()) {
      errors.eta = 'Waktu estimasi kedatangan (ETA) harus lebih lambat dari waktu keberangkatan (ETD).';
    }

    if (tarifPerTon < 0) {
      errors.tarifPerTon = 'Tarif per ton tidak boleh negatif.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const selectedShip = ships.find(s => s.id === kapalId);
      const namaKapal = selectedShip ? selectedShip.namaKapal : 'Armada Pelayaran';

      const payload = {
        nomorVoyage: nomorVoyage.trim().toUpperCase(),
        kapalId,
        namaKapal,
        pelabuhanAsal,
        pelabuhanTujuan,
        etd,
        eta,
        status,
        tarifPerTon: Number(tarifPerTon),
        catatanRute: catatanRute.trim(),
      };

      if (editingVoyage) {
        await onUpdateVoyage(editingVoyage.id, payload);
      } else {
        await onCreateVoyage(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVoyage) return;
    setIsSubmitting(true);
    try {
      await onDeleteVoyage(deletingVoyage.id);
      setDeletingVoyage(null);
    } catch (err) {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVoyageStatusBadge = (st: VoyageStatus) => {
    const styles: Record<VoyageStatus, string> = {
      Terjadwal: 'bg-slate-100 text-slate-700 border-slate-200',
      'Proses Muat': 'bg-sky-50 text-sky-700 border-sky-200',
      'Dalam Pelayaran': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Tiba di Pelabuhan Tujuan': 'bg-blue-50 text-blue-700 border-blue-200',
      Selesai: 'bg-slate-100 text-slate-500 border-slate-200',
      'Tertunda Cuaca': 'bg-rose-50 text-rose-700 border-rose-200',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[st]}`}>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            st === 'Dalam Pelayaran'
              ? 'bg-emerald-500 animate-pulse'
              : st === 'Proses Muat'
              ? 'bg-sky-500'
              : st === 'Tertunda Cuaca'
              ? 'bg-rose-500'
              : 'bg-slate-400'
          }`}
        ></span>
        {st}
      </span>
    );
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="voyage-management-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Jadwal & Rute Pelayaran (Voyages)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penjadwalan pergerakan kapal niaga antar-pelabuhan, estimasi ETD/ETA, dan alokasi rute pelayaran maritim.
          </p>
        </div>

        <button
          id="create-voyage-btn"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Jadwal Pelayaran Baru</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-voyage-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari voyage no, nama kapal, atau nama pelabuhan rute..."
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            id="filter-voyage-status-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full md:w-56 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Status Pelayaran</option>
            {VOYAGE_STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="voyages-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Nomor Voyage & Kapal</th>
                <th className="py-3.5 px-4">Rute Pelabuhan</th>
                <th className="py-3.5 px-4">Jadwal ETD - ETA</th>
                <th className="py-3.5 px-4">Tarif Angkut</th>
                <th className="py-3.5 px-4">Status Pelayaran</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat jadwal pelayaran dari server database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVoyages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Navigation className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada jadwal pelayaran yang sesuai</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan atur jadwal pelayaran baru untuk armada Anda.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVoyages.map(voyage => (
                  <tr key={voyage.id} id={`voyage-row-${voyage.id}`} className="hover:bg-sky-50/30 transition-colors">
                    {/* Voyage & Ship */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm font-mono flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        {voyage.nomorVoyage}
                      </div>
                      <div className="text-slate-600 font-medium text-xs mt-0.5 flex items-center gap-1">
                        <Anchor className="w-3 h-3 text-slate-400" />
                        {voyage.namaKapal}
                      </div>
                    </td>

                    {/* Route */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                        <span className="truncate max-w-[140px]" title={voyage.pelabuhanAsal}>
                          {voyage.pelabuhanAsal}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate max-w-[140px]" title={voyage.pelabuhanTujuan}>
                          {voyage.pelabuhanTujuan}
                        </span>
                      </div>
                      {voyage.catatanRute && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {voyage.catatanRute}
                        </div>
                      )}
                    </td>

                    {/* ETD & ETA */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>ETD: <strong>{formatDateTime(voyage.etd)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-700 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>ETA: <strong>{formatDateTime(voyage.eta)}</strong></span>
                      </div>
                    </td>

                    {/* Freight Rate */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        Rp {voyage.tarifPerTon.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[10px] text-slate-400">per ton kargo</span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getVoyageStatusBadge(voyage.status)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`edit-voyage-${voyage.id}`}
                          onClick={() => openEditModal(voyage)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Jadwal Pelayaran"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-voyage-${voyage.id}`}
                          onClick={() => setDeletingVoyage(voyage)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Jadwal"
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredVoyages.length} dari {voyages.length} jadwal pelayaran</span>
          <button onClick={onRefresh} className="text-sky-600 hover:text-sky-800 font-medium cursor-pointer">
            Segarkan Jadwal
          </button>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          id="voyage-form-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingVoyage ? 'Edit Jadwal Pelayaran' : 'Jadwal Pelayaran Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data rute dan waktu berlayar disimpan di database server.
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
              {/* Row 1: Nomor Voyage & Kapal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Voyage / Pelayaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-voyage-number"
                    type="text"
                    value={nomorVoyage}
                    onChange={e => setNomorVoyage(e.target.value.toUpperCase())}
                    placeholder="misal: VOY/SN01/26/050"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.nomorVoyage && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.nomorVoyage}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Kapal Bertugas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="input-voyage-ship"
                    value={kapalId}
                    onChange={e => setKapalId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Pilih Kapal Armada --</option>
                    {ships.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.namaKapal} ({s.jenisKapal} - {s.status})
                      </option>
                    ))}
                  </select>
                  {formErrors.kapalId && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.kapalId}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Pelabuhan Asal & Pelabuhan Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pelabuhan Asal (Origin) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-voyage-origin"
                    type="text"
                    list="ports-list"
                    value={pelabuhanAsal}
                    onChange={e => setPelabuhanAsal(e.target.value)}
                    placeholder="misal: Pelabuhan Tanjung Priok (IDTPP)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.pelabuhanAsal && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.pelabuhanAsal}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pelabuhan Tujuan (Destination) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-voyage-destination"
                    type="text"
                    list="ports-list"
                    value={pelabuhanTujuan}
                    onChange={e => setPelabuhanTujuan(e.target.value)}
                    placeholder="misal: Pelabuhan Tanjung Perak (IDSUB)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.pelabuhanTujuan && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.pelabuhanTujuan}</p>
                  )}
                </div>
              </div>

              <datalist id="ports-list">
                {ports.map(p => (
                  <option key={p.id} value={`${p.namaPelabuhan} (${p.kodePelabuhan})`} />
                ))}
              </datalist>

              {/* Row 3: ETD & ETA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Keberangkatan (ETD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-voyage-etd"
                    type="datetime-local"
                    value={etd}
                    onChange={e => setEtd(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.etd && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.etd}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Kedatangan (ETA) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-voyage-eta"
                    type="datetime-local"
                    value={eta}
                    onChange={e => setEta(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.eta && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.eta}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Status & Tarif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Operasional Pelayaran
                  </label>
                  <select
                    id="input-voyage-status"
                    value={status}
                    onChange={e => setStatus(e.target.value as VoyageStatus)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {VOYAGE_STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tarif Angkut / Freight (Rp / Ton)
                  </label>
                  <input
                    id="input-voyage-rate"
                    type="number"
                    min="0"
                    step="5000"
                    value={tarifPerTon}
                    onChange={e => setTarifPerTon(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Row 5: Catatan Rute */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Rute / Instruksi Pelayaran
                </label>
                <textarea
                  id="input-voyage-notes"
                  rows={2}
                  value={catatanRute}
                  onChange={e => setCatatanRute(e.target.value)}
                  placeholder="misal: Melalui Selat Sunda, kecepatan jelajah 13 knot, prioritas sandar dermaga peti kemas."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="save-voyage-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan Jadwal...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingVoyage ? 'Simpan Perubahan' : 'Jadwalkan Pelayaran'}</span>
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
        isOpen={!!deletingVoyage}
        title="Konfirmasi Penghapusan Jadwal Pelayaran"
        message={`Apakah Anda yakin ingin menghapus jadwal pelayaran "${deletingVoyage?.nomorVoyage}" (${deletingVoyage?.namaKapal})? Jadwal yang dihapus tidak dapat dipulihkan.`}
        confirmLabel="Hapus Jadwal"
        cancelLabel="Batal"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingVoyage(null)}
      />
    </div>
  );
}
