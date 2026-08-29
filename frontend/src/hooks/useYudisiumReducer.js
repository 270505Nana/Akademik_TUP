import { SECTIONS, DOCUMENT_CONFIG } from "../components/mahasiswa/yudisium/YudisiumDocument";

const generateDocuments = () => {
  const docs = [];
  Object.entries(DOCUMENT_CONFIG).forEach(([section, entries]) => {
    entries.forEach((entry, idx) => {
      docs.push({
        id: `${section}-${idx + 1}`,
        section,
        name: entry.name,
        slug: entry.slug,
        templateUrl: null, 
        fileUrl: null, 
        fileName: "",
        fileSize: "",
        file: null, 
        error: null,
        status: "", 
      });
    });
  });
  return docs;
};

export const initialFormState = {
  step: 1,
  data: {
    registrationId: null,
    program: "",
    tak: "",
    judulTugasAkhirIndonesia: "",
    judulTugasAkhirInggris: "",
    skemaSidang: "",
    pengajuanCumlaude: "Non Cumlaude",
    skemaCumlaude: [], 
    evidenCumlaude: "",
    sidangDate: "-", 
    minatWirausaha: "", 
    dosenWaliId: "-", 
    dosenPembimbing1Id: "",
    dosenPembimbing2Id: "",
    yudisiumPeriodId: null, 
    yudisiumRegistrationPeriodId: "", 
  },
  documents: generateDocuments(),
  activeDocIds: {
    [SECTIONS.WAJIB]: "", 
    [SECTIONS.JURNAL]: `${SECTIONS.JURNAL}-1`,
    [SECTIONS.PAMERAN]: `${SECTIONS.PAMERAN}-1`,
    [SECTIONS.LOMBA]: `${SECTIONS.LOMBA}-1`,
    [SECTIONS.HKI]: `${SECTIONS.HKI}-1`,
    [SECTIONS.WIRAUSAHA]: `${SECTIONS.WIRAUSAHA}-1`,
  },
};

export function formReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, data: { ...state.data, [action.field]: action.value } };
    case "SET_STEP":
      return { ...state, step: action.value };
    case "SET_ACTIVE_DOC":
      return { ...state, activeDocIds: { ...state.activeDocIds, [action.section]: action.value } };
      
    case "RESTORE_FROM_API": {
      const draft = action.payload;
      
      const newData = {
        ...state.data,
        registrationId: draft.id,
        program: draft.program || "",
        tak: draft.tak || "",
        judulTugasAkhirIndonesia: draft.judulTugasAkhirIndonesia || "",
        judulTugasAkhirInggris: draft.judulTugasAkhirInggris || "",
        skemaSidang: draft.skemaSidang || "",
        pengajuanCumlaude: draft.pengajuanCumlaude || "Non Cumlaude",
        skemaCumlaude: draft.skemaCumlaude ? draft.skemaCumlaude.split(", ") : [],
        evidenCumlaude: draft.evidenCumlaude || "",
        minatWirausaha: draft.berminatWirausaha ? "Ya" : "Tidak",
        dosenPembimbing1Id: draft.dosenPembimbing1Id || "",
        dosenPembimbing2Id: draft.dosenPembimbing2Id || "",
        yudisiumRegistrationPeriodId: draft.yudisiumRegistrationPeriodId || "",
      };

      const updatedDocs = state.documents.map(doc => {
        const uploaded = draft.yudisiumRegistrationUploads?.find(
          u => u.category === doc.slug || (u.category === "undefined" && u.name.includes(doc.slug))
        );
        
        if (uploaded) {
          return { 
            ...doc, 
            status: "completed", 
            fileUrl: uploaded.downloadUrl, 
            fileName: uploaded.name 
          };
        }
        return doc;
      });

      return {
        ...state,
        step: 2,
        data: newData,
        documents: updatedDocs
      };
    }

    case "SET_DYNAMIC_DOCUMENTS": {
      const apiDocs = action.payload.map((item, idx) => {
        const existingDoc = state.documents.find(d => d.slug === item.code);
        return {
          id: `${SECTIONS.WAJIB}-${idx + 1}`,
          section: SECTIONS.WAJIB,
          name: item.name,
          slug: item.code, 
          templateUrl: item.downloadUrl || null,
          fileUrl: existingDoc ? existingDoc.fileUrl : null,
          fileName: existingDoc ? existingDoc.fileName : "",
          fileSize: existingDoc ? existingDoc.fileSize : "",
          file: existingDoc ? existingDoc.file : null,
          error: existingDoc ? existingDoc.error : null,
          status: existingDoc ? existingDoc.status : "",
        };
      });

      const otherDocs = state.documents.filter(d => d.section !== SECTIONS.WAJIB);
      
      return { 
        ...state, 
        documents: [...apiDocs, ...otherDocs],
        activeDocIds: {
          ...state.activeDocIds,
          [SECTIONS.WAJIB]: state.activeDocIds[SECTIONS.WAJIB] || (apiDocs.length > 0 ? apiDocs[0].id : "")
        }
      };
    }

    case "UPLOAD_DOCUMENT": {
      const updatedDocs = state.documents.map((doc) =>
        doc.id === action.docId ? { ...doc, file: action.file, fileUrl: action.fileUrl, fileName: action.fileName, fileSize: action.fileSize, error: null, status: "" } : doc
      );
      return { ...state, documents: updatedDocs };
    }
    case "SET_DOCUMENT_ERROR": {
      const updatedDocs = state.documents.map((doc) =>
        doc.id === action.docId ? { ...doc, error: action.error, file: null, fileUrl: null } : doc
      );
      return { ...state, documents: updatedDocs };
    }
    case "COMPLETE_DOCUMENT": {
      const updatedDocs = state.documents.map((doc) =>
        doc.id === action.docId ? { ...doc, status: "completed" } : doc
      );
      return { ...state, documents: updatedDocs };
    }
    case "CLEAR_DOCUMENT_STATUS": {
      const updatedDocs = state.documents.map((doc) =>
        doc.id === action.docId ? { ...doc, status: "" } : doc
      );
      return { ...state, documents: updatedDocs };
    }
    case "RESTORE_DRAFT": {
      const restoredDocs = action.payload.documents ? action.payload.documents.map(doc => ({
        ...doc,
        file: null, 
        fileUrl: doc.status === 'completed' ? doc.fileUrl : null 
      })) : generateDocuments();

      return { ...action.payload, documents: restoredDocs };
    }
    default:
      return state;
  }
}