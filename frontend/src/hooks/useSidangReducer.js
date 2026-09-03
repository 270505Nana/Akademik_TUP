import { SECTIONS, DOCUMENT_CONFIG } from "../requirement/sidangDocument";
import { humanizeDocName } from "../utils/textHelper";

/**
 * Helper terpusat untuk membangun objek dokumen standar (dipakai baik untuk inisialisasi statis maupun update dinamis dari BE).
 */
const createDocItem = ({
  section,
  index,
  name,
  slug,
  templateCode = null,
  existing = null,
}) => ({
  id: `${section}-${index + 1}`,
  section,
  name: humanizeDocName(name),
  slug,
  templateCode: templateCode || null,
  fileUrl: existing?.fileUrl ?? null,
  status: existing?.status ?? "pending",
  fileName: existing?.fileName ?? "",
  fileSize: existing?.fileSize ?? "",
  error: existing?.error ?? null,
  isValid: existing?.isValid ?? null,
  downloadUrl: existing?.downloadUrl ?? null,
  uploadId: existing?.uploadId ?? null,
});

const generateDocuments = () => {
  const docs = [];
  Object.entries(DOCUMENT_CONFIG).forEach(([section, entries]) => {
    entries.forEach((entry, idx) => {
      docs.push(
        createDocItem({
          section,
          index: idx,
          name: entry.name,
          slug: entry.slug,
          templateCode: entry.templateCode || null,
        })
      );
    });
  });
  return docs;
};

const initialActiveDocIds = {};
Object.keys(SECTIONS).forEach((key) => {
  initialActiveDocIds[SECTIONS[key]] = `${SECTIONS[key]}-1`;
});

export const initialFormState = {
  step: 1,
  data: {
    id: null,
    mahasiswaId: null,
    programType: "",
    sks: "",
    ipk: "",
    tak: "",
    sktaExpDate: "",
    thesisTitleId: "",
    thesisTitleEn: "",
    dosenPembimbing1Id: "",
    dosenPembimbing2Id: "",
    sidangScheme: "",
    jalurNonSidang: [],
    testBahasaPersyaratan: null,
    linkPaperJurnal: "",
    linkPaperProceeding: "",
  },
  documents: generateDocuments(),
  activeDocIds: initialActiveDocIds,
};

export function formReducer(state, action) {
  switch (action.type) {
    case "SET_REGISTRATION_ID":
      return {
        ...state,
        data: {
          ...state.data,
          id: action.id ?? action.payload ?? null,
        },
      };
    case "SET_MAHASISWA_ID":
      return {
        ...state,
        data: {
          ...state.data,
          mahasiswaId: action.mahasiswaId ?? action.payload ?? null,
        },
      };
    case "UPDATE_FIELD":
      return {
        ...state,
        data: {
          ...state.data,
          [action.field]: action.value,
        },
      };
    case "SET_STEP":
      return { ...state, step: action.value };
    case "SET_INITIAL_DATA":
      return {
        ...state,
        data: {
          ...state.data,
          ...action.payload,
        },
      };
    case "SET_ACTIVE_DOC":
      return {
        ...state,
        activeDocIds: {
          ...state.activeDocIds,
          [action.section]: action.value,
        },
      };
    case "UPLOAD_DOCUMENT": {
      // Find the document being uploaded
      const targetDoc = state.documents.find((d) => d.id === action.docId);

      const uploadedDocs = state.documents.map((doc) => {
        // Direct match
        if (doc.id === action.docId) {
          return {
            ...doc,
            fileUrl: action.fileUrl,
            fileName: action.fileName,
            fileSize: action.fileSize,
            status: "uploaded",
            error: null,
            isValid: null,
          };
        }
        if (
          targetDoc &&
          (targetDoc.section === SECTIONS.JURNAL ||
            targetDoc.section === SECTIONS.PROCEEDING)
        ) {
          const sharedNames = [
            "BERKAS LoA",
            "BERKAS PERSETUJUAN PUBLIKASI TA SEBAGAI PENGGANTI SIDANG",
            "BERKAS CAMERA READY PAPER",
            "BERKAS RESPONSE",
          ];
          if (
            sharedNames.includes(targetDoc.name) &&
            doc.name === targetDoc.name &&
            (doc.section === SECTIONS.JURNAL ||
              doc.section === SECTIONS.PROCEEDING)
          ) {
            return {
              ...doc,
              fileUrl: action.fileUrl,
              fileName: action.fileName,
              fileSize: action.fileSize,
              status: "uploaded",
              error: null,
              isValid: null,
            };
          }
        }

        return doc;
      });
      return { ...state, documents: uploadedDocs };
    }
    case "SET_DOCUMENT_ERROR": {
      const errorDocs = state.documents.map((doc) =>
        doc.id === action.docId
          ? { ...doc, error: action.error, fileUrl: null, status: "pending" }
          : doc,
      );
      return { ...state, documents: errorDocs };
    }
    case "CLEAR_DOCUMENT_STATUS": {
      const clearedDocs = state.documents.map((doc) =>
        doc.id === action.docId
          ? {
              ...doc,
              error: null,
              fileUrl: null,
              status: "pending",
              fileName: "",
              fileSize: "",
            }
          : doc,
      );
      return { ...state, documents: clearedDocs };
    }
    case "COMPLETE_DOCUMENT": {
      const completedDocs = state.documents.map((doc) =>
        doc.id === action.docId ? { ...doc, status: "completed", isValid: null } : doc,
      );
      return { ...state, documents: completedDocs };
    }
    case "RESTORE_SERVER_DOCUMENTS": {
      // Sinkronkan status dokumen dari data sidangRegistrationUploads 
      const uploadsBySlug = {};
      (action.uploads || []).forEach((u) => {
        uploadsBySlug[u.category] = u;
      });

      const merged = state.documents.map((doc) => {
        const serverDoc = uploadsBySlug[doc.slug];
        if (!serverDoc) return doc;
        return {
          ...doc,
          status: "completed",
          isValid: serverDoc.isValid ?? null,
          fileName: serverDoc.name || serverDoc.filename || doc.fileName,
          downloadUrl: serverDoc.downloadUrl || null,
          uploadId: serverDoc.id ?? null,
          error: null,
        };
      });
      return { ...state, documents: merged };
    }
    case "SET_SECTION_TEMPLATES": {
      const { section, templates } = action.payload || {};
      if (!section || !Array.isArray(templates) || templates.length === 0) {
        return state;
      }

      // Map dokumen yang sudah ada di state untuk section ini agar status upload/progress tetap dipertahankan
      const existingDocsBySlug = {};
      state.documents
        .filter((d) => d.section === section)
        .forEach((d) => {
          existingDocsBySlug[d.slug] = d;
        });

      const newSectionDocs = templates.map((tpl, idx) => {
        const slug = tpl.code;
        const existing = existingDocsBySlug[slug];
        return createDocItem({
          section,
          index: idx,
          name: tpl.name,
          slug,
          templateCode: tpl.code,
          existing,
        });
      });

      const sectionOrder = Object.values(SECTIONS);
      const allDocsGrouped = {};
      sectionOrder.forEach((sec) => {
        if (sec === section) {
          allDocsGrouped[sec] = newSectionDocs;
        } else {
          allDocsGrouped[sec] = state.documents.filter((d) => d.section === sec);
        }
      });
      const updatedDocuments = sectionOrder.flatMap((sec) => allDocsGrouped[sec] || []);

      // Pastikan activeDocId untuk section ini tetap valid
      const currentActiveId = state.activeDocIds[section];
      const isActiveStillValid = newSectionDocs.some((d) => d.id === currentActiveId);
      const updatedActiveDocIds = {
        ...state.activeDocIds,
        [section]: isActiveStillValid ? currentActiveId : (newSectionDocs[0]?.id || `${section}-1`),
      };

      return {
        ...state,
        documents: updatedDocuments,
        activeDocIds: updatedActiveDocIds,
      };
    }
    case "RESTORE_DRAFT":
      return action.payload;
    default:
      return state;
  }
}