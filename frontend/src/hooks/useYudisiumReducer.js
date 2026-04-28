
export const initialState = {
  step: 1,
  data: {
    nama: '',
    nim: '', 
    prodi: '',
    tak: '',
    program: 'Reguler',
    doswal: '',
    skemaSidang: 'Sidang Reguler',
    jalurYudisium: 'Non Cumlaude', // Non Cumlaude, Pengajuan Cumlaude, Pengajuan Summa Cumlaude
    skemaTambahan: [], // For Cumlaude/Summa
    evidenList: '',
    judulId: '',
    judulEn: '',
    berkas: {} // { [docName]: File }
  },
  documents: [
    { id: 1, name: 'BERKAS LEMBAR REVISI TA', status: 'pending', section: 'WAJIB' },
    { id: 2, name: 'BERKAS LEMBAR PENGESAHAN TUGAS AKHIR', status: 'pending', section: 'WAJIB' },
    { id: 3, name: 'BERKAS SURAT BEBAS KEWAJIBAN PUSTAKA', status: 'pending', section: 'WAJIB' },
    { id: 4, name: 'BERKAS SCAN BUKTI PEMBAYARAN WISUDA', status: 'pending', section: 'WAJIB' },
    { id: 5, name: 'BERKAS BUKTI UNGGAH 5 TAK TERBAIK (SKPI)', status: 'pending', section: 'WAJIB' },
    { id: 6, name: 'BERKAS SKPI SUDAH APPROVE BK', status: 'pending', section: 'WAJIB' },
    { id: 7, name: 'BERKAS BUKTI UPLOAD OPENLIBRARY', status: 'pending', section: 'WAJIB' },
    { id: 8, name: 'BERKAS BUKTI SIMILARITY', status: 'pending', section: 'WAJIB' },
    { id: 9, name: 'BERKAS KELENGKAPAN DOKUMEN YUDISIUM', status: 'pending', section: 'WAJIB' }
  ]
};

export default function yudisiumReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.value };
    case 'UPDATE_DATA':
      return { ...state, data: { ...state.data, ...action.payload } };
    case 'UPDATE_DOC_STATUS':
      return {
        ...state,
        documents: state.documents.map(doc =>
          doc.id === action.id ? { ...doc, status: action.status } : doc
        )
      };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}
