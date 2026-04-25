import { SECTIONS, DOCUMENT_CONFIG } from '../requirement/sidangDocument';

const generateDocuments = () => {
  const docs = [];
  Object.entries(DOCUMENT_CONFIG).forEach(([section, names]) => {
    names.forEach((name, idx) => {
      docs.push({
        id: `${section}-${idx + 1}`,
        section,
        name,
        fileUrl: null,
        status: 'pending',
        fileName: '',
        fileSize: '',
        error: null
      });
    });
  });
  return docs;
};

const initialActiveDocIds = {};
Object.keys(SECTIONS).forEach(key => {
  initialActiveDocIds[SECTIONS[key]] = `${SECTIONS[key]}-1`;
});

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
    jalurNonSidang: [], 
    testBahasaPersyaratan: null,
    linkPaperJurnal: '',
    linkPaperProceeding: '',
  },
  documents: generateDocuments(),
  activeDocIds: initialActiveDocIds
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
      return { 
        ...state, 
        activeDocIds: {
          ...state.activeDocIds,
          [action.section]: action.value
        }
      };
    case 'UPLOAD_DOCUMENT':
      // Find the document being uploaded
      const targetDoc = state.documents.find(d => d.id === action.docId);
      
      const uploadedDocs = state.documents.map(doc => {
        // Direct match
        if (doc.id === action.docId) {
          return { ...doc, fileUrl: action.fileUrl, fileName: action.fileName, fileSize: action.fileSize, status: 'uploaded', error: null };
        }
        
        // SYNC LOGIC: If it's a "shared" document like LoA or Camera Ready 
        // between Jurnal and Proceeding (matching names)
        if (targetDoc && (targetDoc.section === SECTIONS.JURNAL || targetDoc.section === SECTIONS.PROCEEDING)) {
          const sharedNames = ['BERKAS LoA', 'BERKAS PERSETUJUAN PUBLIKASI TA SEBAGAI PENGGANTI SIDANG', 'BERKAS CAMERA READY PAPER', 'BERKAS RESPONSE'];
          if (sharedNames.includes(targetDoc.name) && doc.name === targetDoc.name && (doc.section === SECTIONS.JURNAL || doc.section === SECTIONS.PROCEEDING)) {
            return { ...doc, fileUrl: action.fileUrl, fileName: action.fileName, fileSize: action.fileSize, status: 'uploaded', error: null };
          }
        }
        
        return doc;
      });
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
