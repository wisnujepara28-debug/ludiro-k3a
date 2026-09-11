import type React from 'react';
import { useState, useMemo } from 'react';
import { MapPin, Plus, Search, Anchor, Check, X, Phone, Waves, AlertCircle } from 'lucide-react';
import type { Port } from '../../types/maritime';

interface PortManagementProps {
  ports: Port[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreatePort: (data: Partial<Port>) => Promise<void>;
}

export function PortManagement({
  ports,
  isLoading,
  onRefresh,
  onCreatePort,
}: PortManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [kodePelabuhan, setKodePelabuhan] = useState('');
  const [namaPelabuhan, setNamaPelabuhan] = useState('');
  const [kota, setKota] = useState('');
  const [kedalamanDraft, setKedalamanDraft] = useState<number>(12);
  const [panjangDermaga, setPanjangDermaga] = useState<number>(2500);
  const [kontakOtoritas, setKontakOtoritas] = useState('');

  const filteredPorts = useMemo(() => {
    return ports.filter(p => {
      return (
        p.namaPelabuhan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kodePelabuhan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kota.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kontakOtoritas.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [ports, searchQuery]);

  const openCreateModal = () => {
    setKodePelabuhan('ID');
    setNamaPelabuhan('');
    setKota('');
    setKedalamanDraft(12.5);
    setPanjangDermaga(2000);
    setKontakOtoritas('+62 ');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!kodePelabuhan.trim() || kodePelabuhan.trim().length < 4) {
      errors.kodePelabuhan = 'Kode pelabuhan (UN/LOCODE) minimal 4 karakter (misal: IDTPP).';
    }

    if (!namaPelabuhan.trim()) {
      errors.namaPelabuhan = 'Nama pelabuhan wajib diisi.';
    }

    if (!kota.trim()) {
      errors.kota = 'Kota / Wilayah lokasi wajib diisi.';
    }

    if (!kedalamanDraft || kedalamanDraft <= 0) {
      errors.kedalamanDraft = 'Kedalaman draft kolam pelabuhan harus lebih dari 0 meter.';
    }

    if (!panjangDermaga || panjangDermaga <= 0) {
      errors.panjangDermaga = 'Panjang dermaga harus lebih dari 0 meter.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onCreatePort({
        kodePelabuhan: kodePelabuhan.trim().toUpperCase(),
        namaPelabuhan: namaPelabuhan.trim(),
        kota: kota.trim(),
        kedalamanDraft: Number(kedalamanDraft),
        panjangDermaga: Number(panjangDermaga),
        kontakOtoritas: kontakOtoritas.trim() || 'KSOP Pelabuhan Setempat',
      });
      setIsModalOpen(false);
    } catch (err) {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="port-management-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Master Data Pelabuhan & Terminal</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data pelabuhan hub maritim Indonesia, kedalaman alur pelayaran (draft), panjang tambatan, dan kontak KSOP / Pelindo.
          </p>
        </div>

        <button
          id="create-port-btn"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelabuhan Baru</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-port-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari kode pelabuhan, nama pelabuhan, atau kota..."
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
      </div>

      {/* Port Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Memuat master pelabuhan...</span>
          </div>
        ) : filteredPorts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Pelabuhan tidak ditemukan</p>
          </div>
        ) : (
          filteredPorts.map(port => (
            <div
              key={port.id}
              id={`port-card-${port.id}`}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold font-mono text-xs border border-sky-200">
                      {port.kodePelabuhan}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{port.namaPelabuhan}</h3>
                      <p className="text-xs text-slate-500">{port.kota}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Waves className="w-3.5 h-3.5 text-sky-500" />
                      <span>Draft Kolam</span>
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">{port.kedalamanDraft} Meter</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Anchor className="w-3.5 h-3.5 text-blue-500" />
                      <span>Panjang Tambatan</span>
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">{port.panjangDermaga.toLocaleString('id-ID')} m</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{port.kontakOtoritas}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Port Modal */}
      {isModalOpen && (
        <div
          id="port-form-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Tambah Master Pelabuhan</h3>
                  <p className="text-xs text-slate-500">
                    Simpan titik hub maritim ke database persisten.
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
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode Pelabuhan (UN/LOCODE) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-port-code"
                  type="text"
                  value={kodePelabuhan}
                  onChange={e => setKodePelabuhan(e.target.value.toUpperCase())}
                  placeholder="misal: IDTPP"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                {formErrors.kodePelabuhan && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.kodePelabuhan}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pelabuhan <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-port-name"
                  type="text"
                  value={namaPelabuhan}
                  onChange={e => setNamaPelabuhan(e.target.value)}
                  placeholder="misal: Pelabuhan Tanjung Priok"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                {formErrors.namaPelabuhan && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.namaPelabuhan}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kota / Wilayah Provinsi <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-port-city"
                  type="text"
                  value={kota}
                  onChange={e => setKota(e.target.value)}
                  placeholder="misal: Jakarta Utara, DKI Jakarta"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                {formErrors.kota && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.kota}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kedalaman Draft (Meter)
                  </label>
                  <input
                    id="input-port-draft"
                    type="number"
                    step="0.1"
                    min="1"
                    value={kedalamanDraft}
                    onChange={e => setKedalamanDraft(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Panjang Dermaga (Meter)
                  </label>
                  <input
                    id="input-port-quay"
                    type="number"
                    min="100"
                    value={panjangDermaga}
                    onChange={e => setPanjangDermaga(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kontak Otoritas Pelabuhan (KSOP / Terminal)
                </label>
                <input
                  id="input-port-contact"
                  type="text"
                  value={kontakOtoritas}
                  onChange={e => setKontakOtoritas(e.target.value)}
                  placeholder="misal: +62 21 4301080 (KSOP Tanjung Priok)"
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
                  id="save-port-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan Pelabuhan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Pelabuhan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
