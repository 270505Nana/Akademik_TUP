
export const initialFormState = {
  step: 1,
  data: {
    nama: '',
    nim: '', 
    prodi: '',
    sks: '',
    ipk: '',
    tak: '',
    batasSk: '',
    doswal: '',
    nipDoswal: '',
    pembimbing1: '',
    pembimbing2: '',
    program: null,
    skema: null,
    kelompokKeilmuan: null,
    judulId: '',
    judulEn: '',
    periodeSidang: null, // sidang_period_id
    jalurNonSidang: [], // From Skema Sidang Data Example
    testBahasaPersyaratan: null, // "Sudah" | "Belum"
  },
  documents: [
    { id: 1, name: 'BERKAS FORM VALIDASI DOSEN WALI', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 2, name: 'BERKAS REKOMENDASI SIDANG PEMBIMBIMB', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 3, name: 'BERKAS SCAN PERNYATAAN BIODATA IJAZAH BERMATERAI', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 4, name: 'BERKAS DUMMY IJAZAH BERMATERAI', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 5, name: 'BERKAS SCAN SCAN AKTA KELAHIRAN', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 6, name: 'BERKAS SCAN IJAZAH TERAKHIR', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 7, name: 'BERKAS SCAN KHS DENGAN TTD DOSWAL/KAPRODI', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 8, name: 'BERKAS LOG BIMBINGAN', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 9, name: 'BERKAS PEMAKLUMAN TEST BAHASA(OPSIONAL)', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 10, name: 'BERKAS SERTIFIKAT TAK', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 11, name: 'BERKAS REKOMENDASI BERKAS EVIDENCE TA/PA IGRACIAS PEMBIMBING', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
    { id: 12, name: 'BERKAS KELENGKAPAN DOK SIDANG', fileUrl: null, status: 'pending', fileName: '', fileSize: '' },
  ],
  activeDocId: 1
};

export function formReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        data: {
          ...state.data,
          [action.field]: action.value
        }
      };
    case 'SET_STEP':
      return { ...state, step: action.value };
    case 'SET_INITIAL_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          ...action.payload
        }
      };
    case 'SET_ACTIVE_DOC':
      return { ...state, activeDocId: action.value };
    case 'UPLOAD_DOCUMENT':
      const uploadedDocs = state.documents.map(doc => 
        doc.id === action.docId 
          ? { ...doc, fileUrl: action.fileUrl, fileName: action.fileName, fileSize: action.fileSize, status: 'uploaded', error: null } 
          : doc
      );
      return { ...state, documents: uploadedDocs };
    case 'SET_DOCUMENT_ERROR':
      const errorDocs = state.documents.map(doc => 
        doc.id === action.docId 
          ? { ...doc, error: action.error, fileUrl: null, status: 'pending' } 
          : doc
      );
      return { ...state, documents: errorDocs };
    case 'CLEAR_DOCUMENT_STATUS':
      const clearedDocs = state.documents.map(doc => 
        doc.id === action.docId 
          ? { ...doc, error: null, fileUrl: null, status: 'pending', fileName: '', fileSize: '' } 
          : doc
      );
      return { ...state, documents: clearedDocs };
    case 'COMPLETE_DOCUMENT':
      const completedDocs = state.documents.map(doc => 
        doc.id === action.docId 
          ? { ...doc, status: 'completed' } 
          : doc
      );
      return { ...state, documents: completedDocs };
    case 'RESTORE_DRAFT':
      return action.payload;
    default:
      return state;
  }
}
