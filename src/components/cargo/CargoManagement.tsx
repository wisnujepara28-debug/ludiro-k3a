import type React from 'react';
import { useState, useMemo } from 'react';
import { Package, Plus, Search, Filter, Edit3, Trash2, FileText, Check, X, AlertCircle, Printer, Ship, Anchor } from 'lucide-react';
import type { CargoItem, CargoType, CargoStatus, Voyage } from '../../types/maritime';
import { ConfirmModal } from '../common/ConfirmModal';

interface CargoManagementProps {
  cargoList: CargoItem[];
  voyages: Voyage[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateCargo: (data: Partial<CargoItem>) => Promise<void>;
  onUpdateCargo: (id: string, data: Partial<CargoItem>) => Promise<void>;
  onDeleteCargo: (id: string) => Promise<void>;
}

const CARGO_TYPES: CargoType[] = [
  'Peti Kemas 20ft',
  'Peti Kemas 40ft',
  'Curah Kering (Batu Bara / Semen / Gandum)',
  'Kargo Umum (General Cargo)',
  'Kendaraan / Alat Berat',
  'Cairan Industri / CPO',
];

const CARGO_STATUSES: CargoStatus[] = [
  'Booking Terdaftar',
  'Pemuatan Kapal',
  'Dalam Perjalanan',
  'Bongkar Muat',
  'Telah Diserahkan (Released)',
];

export function CargoManagement({
  cargoList,
  voyages,
  isLoading,
  onRefresh,
  onCreateCargo,
  onUpdateCargo,
  onDeleteCargo,
}: CargoManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<CargoItem | null>(null);
  const [deletingCargo, setDeletingCargo] = useState<CargoItem | null>(null);
  const [viewingBL, setViewingBL] = useState<CargoItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [nomorBL, setNomorBL] = useState('');
  const [voyageId, setVoyageId] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [penerima, setPenerima] = useState('');
  const [jenisKargo, setJenisKargo] = useState<CargoType>('Peti Kemas 40ft');
  const [jumlahUnit, setJumlahUnit] = useState<number>(10);
  const [beratTon, setBeratTon] = useState<number>(200);
  const [volumeCBM, setVolumeCBM] = useState<number>(650);
  const [statusMuatan, setStatusMuatan] = useState<CargoStatus>('Booking Terdaftar');
  const [nilaiKargo, setNilaiKargo] = useState<number>(1500000000);
  const [instruksiKhusus, setInstruksiKhusus] = useState('');

  const filteredCargo = useMemo(() => {
    return cargoList.filter(c => {
      const matchSearch =
        c.nomorBL.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.pengirim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.penerima.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nomorVoyage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.namaKapal.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = filterType === 'ALL' || c.jenisKargo === filterType;
      const matchStatus = filterStatus === 'ALL' || c.statusMuatan === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [cargoList, searchQuery, filterType, filterStatus]);

  const openCreateModal = () => {
    setEditingCargo(null);
    setNomorBL(`BL/SMN/26/${Math.floor(1000 + Math.random() * 9000)}`);
    setVoyageId(voyages.length > 0 ? voyages[0].id : '');
    setPengirim('');
    setPenerima('');
    setJenisKargo('Peti Kemas 40ft');
    setJumlahUnit(5);
    setBeratTon(100);
    setVolumeCBM(320);
    setStatusMuatan('Booking Terdaftar');
    setNilaiKargo(750000000);
    setInstruksiKhusus('Kargo standar maritime logistics. Segel kontainer dalam kondisi utuh.');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: CargoItem) => {
    setEditingCargo(item);
    setNomorBL(item.nomorBL);
    setVoyageId(item.voyageId);
    setPengirim(item.pengirim);
    setPenerima(item.penerima);
    setJenisKargo(item.jenisKargo);
    setJumlahUnit(item.jumlahUnit);
    setBeratTon(item.beratTon);
    setVolumeCBM(item.volumeCBM);
    setStatusMuatan(item.statusMuatan);
    setNilaiKargo(item.nilaiKargo);
    setInstruksiKhusus(item.instruksiKhusus);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!nomorBL.trim()) {
      errors.nomorBL = 'Nomor Bill of Lading (B/L) wajib diisi.';
    }

    if (!voyageId) {
      errors.voyageId = 'Pilih jadwal pelayaran (voyage).';
    }

    if (!pengirim.trim()) {
      errors.pengirim = 'Nama pengirim (Shipper) wajib diisi.';
    }

    if (!penerima.trim()) {
      errors.penerima = 'Nama penerima (Consignee) wajib diisi.';
    }

    if (!beratTon || beratTon <= 0) {
      errors.beratTon = 'Berat muatan kargo harus lebih besar dari 0 ton.';
    }

    if (!jumlahUnit || jumlahUnit <= 0) {
      errors.jumlahUnit = 'Jumlah unit kargo minimal 1.';
    }

    if (nilaiKargo < 0) {
      errors.nilaiKargo = 'Nilai kargo tidak boleh bernilai negatif.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const selectedVoyage = voyages.find(v => v.id === voyageId);
      const nomorVoyage = selectedVoyage ? selectedVoyage.nomorVoyage : 'VOY-DEFAULT';
      const namaKapal = selectedVoyage ? selectedVoyage.namaKapal : 'Armada Pelayaran';

      const payload = {
        nomorBL: nomorBL.trim().toUpperCase(),
        voyageId,
        nomorVoyage,
        namaKapal,
        pengirim: pengirim.trim(),
        penerima: penerima.trim(),
        jenisKargo,
        jumlahUnit: Number(jumlahUnit),
        beratTon: Number(beratTon),
        volumeCBM: Number(volumeCBM) || 0,
        statusMuatan,
        nilaiKargo: Number(nilaiKargo),
        instruksiKhusus: instruksiKhusus.trim(),
      };

      if (editingCargo) {
        await onUpdateCargo(editingCargo.id, payload);
      } else {
        await onCreateCargo(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCargo) return;
    setIsSubmitting(true);
    try {
      await onDeleteCargo(deletingCargo.id);
      setDeletingCargo(null);
    } catch (err) {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCargoStatusBadge = (st: CargoStatus) => {
    const styles: Record<CargoStatus, string> = {
      'Booking Terdaftar': 'bg-slate-100 text-slate-700 border-slate-200',
      'Pemuatan Kapal': 'bg-sky-50 text-sky-700 border-sky-200',
      'Dalam Perjalanan': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Bongkar Muat': 'bg-amber-50 text-amber-700 border-amber-200',
      'Telah Diserahkan (Released)': 'bg-blue-50 text-blue-700 border-blue-200',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[st]}`}>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            st === 'Dalam Perjalanan'
              ? 'bg-emerald-500 animate-pulse'
              : st === 'Pemuatan Kapal'
              ? 'bg-sky-500'
              : st === 'Bongkar Muat'
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }`}
        ></span>
        {st}
      </span>
    );
  };

  return (
    <div id="cargo-management-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Manifes & Muatan Kargo (Bill of Lading)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan surat muatan laut (B/L), data consignor & consignee, tonase, kubikasi, serta status serah terima barang.
          </p>
        </div>

        <button
          id="create-cargo-btn"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Terbitkan Manifes Kargo Baru</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-cargo-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nomor B/L, pengirim, penerima, atau nomor voyage..."
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
            id="filter-cargo-type-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full md:w-48 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Jenis Kargo</option>
            {CARGO_TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            id="filter-cargo-status-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full md:w-48 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Status Muatan</option>
            {CARGO_STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cargo Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="cargo-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Nomor B/L & Voyage</th>
                <th className="py-3.5 px-4">Pengirim & Penerima</th>
                <th className="py-3.5 px-4">Spesifikasi Muatan</th>
                <th className="py-3.5 px-4">Tonase & Nilai Kargo</th>
                <th className="py-3.5 px-4">Status Muatan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data manifes dari database persisten server...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCargo.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada data manifes kargo yang ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Buat manifes muatan baru untuk kapal yang sedang berlayar.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCargo.map(cargo => (
                  <tr key={cargo.id} id={`cargo-row-${cargo.id}`} className="hover:bg-sky-50/30 transition-colors">
                    {/* BL & Voyage */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm font-mono flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        {cargo.nomorBL}
                      </div>
                      <div className="text-slate-600 font-medium text-xs mt-0.5">
                        Voyage: <span className="font-mono text-slate-800">{cargo.nomorVoyage}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{cargo.namaKapal}</div>
                    </td>

                    {/* Shipper & Consignee */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-900 font-semibold truncate">
                        Pengirim: {cargo.pengirim}
                      </div>
                      <div className="text-slate-600 text-xs mt-0.5 truncate">
                        Penerima: {cargo.penerima}
                      </div>
                    </td>

                    {/* Cargo Specs */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{cargo.jenisKargo}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {cargo.jumlahUnit} Unit &bull; {cargo.volumeCBM} CBM
                      </div>
                    </td>

                    {/* Weight & Value */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {cargo.beratTon.toLocaleString('id-ID')} Ton
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        Rp {cargo.nilaiKargo.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getCargoStatusBadge(cargo.statusMuatan)}</td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`view-bl-${cargo.id}`}
                          onClick={() => setViewingBL(cargo)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Tinjau Surat Muatan (Bill of Lading)"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          id={`edit-cargo-${cargo.id}`}
                          onClick={() => openEditModal(cargo)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Manifes"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-cargo-${cargo.id}`}
                          onClick={() => setDeletingCargo(cargo)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Manifes"
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
          <span>Menampilkan {filteredCargo.length} dari {cargoList.length} manifes kargo</span>
          <button onClick={onRefresh} className="text-sky-600 hover:text-sky-800 font-medium cursor-pointer">
            Segarkan Manifes
          </button>
        </div>
      </div>

      {/* Bill of Lading (B/L) Official Document Viewer Modal */}
      {viewingBL && (
        <div
          id="bl-viewer-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Dokumen Resmi Bill of Lading (B/L)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Surat Muatan Laut Niaga: {viewingBL.nomorBL}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  onClick={() => setViewingBL(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="mt-6 border-2 border-slate-900 p-6 rounded-xl bg-slate-50/40 text-xs space-y-5">
              {/* Document Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="font-extrabold text-base text-slate-900 uppercase tracking-tight">
                    PT JAPARA MARITIM NUSANTARA
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Kantor Pusat: Gedung Maritim Nusantara Lt. 12, Tanjung Priok, Jakarta Utara
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Izin Usaha Angkutan Laut (SIUPAL) No: 582/AL.001/DJPL/2020
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase">BILL OF LADING NO.</div>
                  <div className="text-base font-extrabold font-mono text-slate-900">
                    {viewingBL.nomorBL}
                  </div>
                </div>
              </div>

              {/* Shipper & Consignee boxes */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">PENGIRIM (SHIPPER)</div>
                  <div className="font-bold text-slate-900 mt-1">{viewingBL.pengirim}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Indonesia</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">PENERIMA (CONSIGNEE)</div>
                  <div className="font-bold text-slate-900 mt-1">{viewingBL.penerima}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Indonesia</div>
                </div>
              </div>

              {/* Vessel & Voyage */}
              <div className="grid grid-cols-3 gap-4 border-b border-slate-300 pb-4">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">KAPAL PENGANGKUT</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Ship className="w-3.5 h-3.5 text-sky-600" />
                    {viewingBL.namaKapal}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">NOMOR VOYAGE</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {viewingBL.nomorVoyage}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">STATUS MUATAN</div>
                  <div className="mt-0.5">{getCargoStatusBadge(viewingBL.statusMuatan)}</div>
                </div>
              </div>

              {/* Cargo description table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Kategori / Deskripsi Kargo</th>
                      <th className="p-2.5">Jumlah</th>
                      <th className="p-2.5">Berat (Ton)</th>
                      <th className="p-2.5">Volume (CBM)</th>
                      <th className="p-2.5 text-right">Nilai Pertanggungan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 font-medium text-slate-900">{viewingBL.jenisKargo}</td>
                      <td className="p-2.5 text-slate-700">{viewingBL.jumlahUnit} Unit</td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {viewingBL.beratTon.toLocaleString('id-ID')} Ton
                      </td>
                      <td className="p-2.5 text-slate-700">{viewingBL.volumeCBM} CBM</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        Rp {viewingBL.nilaiKargo.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 text-[11px]">
                <strong>Instruksi Khusus & Catatan Penanganan:</strong> {viewingBL.instruksiKhusus || 'Standar keselamatan muatan laut.'}
              </div>

              {/* Signature area */}
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="text-center border-t border-slate-300 pt-2">
                  <div className="text-slate-400 text-[11px]">Tanda Tangan Pengirim (Shipper)</div>
                  <div className="h-12"></div>
                  <div className="font-bold text-slate-800">{viewingBL.pengirim}</div>
                </div>
                <div className="text-center border-t border-slate-300 pt-2">
                  <div className="text-slate-400 text-[11px]">Nahkoda / Perusahaan Angkutan Laut</div>
                  <div className="h-12 flex items-center justify-center text-sky-700 font-serif italic text-sm">
                    Verified Digital Seal
                  </div>
                  <div className="font-bold text-slate-800">PT JAPARA MARITIM NUSANTARA</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingBL(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          id="cargo-form-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingCargo ? 'Perbarui Manifes Kargo' : 'Terbitkan Manifes Kargo Baru (B/L)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simpan langsung ke database persisten server.
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
              {/* Row 1: Nomor BL & Voyage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Bill of Lading (B/L) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-cargo-bl"
                    type="text"
                    value={nomorBL}
                    onChange={e => setNomorBL(e.target.value.toUpperCase())}
                    placeholder="misal: BL/SMN/26/0481"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.nomorBL && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.nomorBL}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Jadwal Pelayaran (Voyage) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="input-cargo-voyage"
                    value={voyageId}
                    onChange={e => setVoyageId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Pilih Voyage --</option>
                    {voyages.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.nomorVoyage} ({v.namaKapal} - {v.pelabuhanAsal} ke {v.pelabuhanTujuan})
                      </option>
                    ))}
                  </select>
                  {formErrors.voyageId && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.voyageId}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Pengirim & Penerima */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Pengirim (Shipper) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-cargo-shipper"
                    type="text"
                    value={pengirim}
                    onChange={e => setPengirim(e.target.value)}
                    placeholder="misal: PT Indofood Sukses Makmur Tbk"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.pengirim && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.pengirim}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Penerima (Consignee) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-cargo-consignee"
                    type="text"
                    value={penerima}
                    onChange={e => setPenerima(e.target.value)}
                    placeholder="misal: PT Sumber Distribusi Laut Timur"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.penerima && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.penerima}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Jenis Kargo & Jumlah Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kargo</label>
                  <select
                    id="input-cargo-type"
                    value={jenisKargo}
                    onChange={e => setJenisKargo(e.target.value as CargoType)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {CARGO_TYPES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Unit Muatan
                  </label>
                  <input
                    id="input-cargo-units"
                    type="number"
                    min="1"
                    value={jumlahUnit}
                    onChange={e => setJumlahUnit(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Row 4: Berat Ton, Volume CBM, Nilai Kargo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Berat Bersih (Ton) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-cargo-weight"
                    type="number"
                    min="1"
                    step="0.1"
                    value={beratTon}
                    onChange={e => setBeratTon(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  {formErrors.beratTon && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.beratTon}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Volume Kubikasi (CBM)
                  </label>
                  <input
                    id="input-cargo-cbm"
                    type="number"
                    min="0"
                    value={volumeCBM}
                    onChange={e => setVolumeCBM(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nilai Kargo (Rp)
                  </label>
                  <input
                    id="input-cargo-val"
                    type="number"
                    min="0"
                    step="1000000"
                    value={nilaiKargo}
                    onChange={e => setNilaiKargo(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Row 5: Status Muatan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Muatan</label>
                <select
                  id="input-cargo-status"
                  value={statusMuatan}
                  onChange={e => setStatusMuatan(e.target.value as CargoStatus)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  {CARGO_STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 6: Instruksi Khusus */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instruksi Khusus & Segel Pengiriman
                </label>
                <textarea
                  id="input-cargo-instructions"
                  rows={2}
                  value={instruksiKhusus}
                  onChange={e => setInstruksiKhusus(e.target.value)}
                  placeholder="misal: Suhu kontainer -18°C, segel peti kemas No. 8912301."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Buttons */}
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
                  id="save-cargo-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan Manifes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingCargo ? 'Simpan Perubahan' : 'Terbitkan Manifes B/L'}</span>
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
        isOpen={!!deletingCargo}
        title="Konfirmasi Penghapusan Manifes Kargo"
        message={`Apakah Anda yakin ingin menghapus data manifes Bill of Lading "${deletingCargo?.nomorBL}" (${deletingCargo?.pengirim}) dari database?`}
        confirmLabel="Hapus Manifes"
        cancelLabel="Batal"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCargo(null)}
      />
    </div>
  );
}
