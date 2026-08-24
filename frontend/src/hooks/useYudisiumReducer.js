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
        file: null, 
        fileName: "",
      });
    });
  });
  return docs;
};

export const initialFormState = {
  step: 1,
  data: {
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
};

export function formReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, data: { ...state.data, [action.field]: action.value } };
    case "SET_STEP":
      return { ...state, step: action.value };
    case "SET_DOCUMENT_FILE": {
      const updatedDocs = state.documents.map((doc) =>
        doc.id === action.docId
          ? { ...doc, file: action.file, fileName: action.file.name }
          : doc
      );
      return { ...state, documents: updatedDocs };
    }
    case "REMOVE_DOCUMENT_FILE": {
      const removedDocs = state.documents.map((doc) =>
        doc.id === action.docId
          ? { ...doc, file: null, fileName: "" }
          : doc
      );
      return { ...state, documents: removedDocs };
    }
    case "RESTORE_DRAFT":
      return { ...action.payload, documents: generateDocuments() };
    default:
      return state;
  }
}