import { SECTIONS, DOCUMENT_CONFIG } from "../components/mahasiswa/yudisium/yudisiumDocument";

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
        isValid: null,
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
    isDraft: true,
    isEdit: null,
    message: null,
    submittedAt: null,
    uploads: [], 
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
      const uploads = draft.yudisiumRegistrationUploads || draft.uploads || [];
      
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
        isDraft: draft.isDraft,
        isEdit: draft.isEdit,
        message: draft.message,
        submittedAt: draft.submittedAt,
        yudisiumPeriodId: draft.yudisiumPeriodId,
        uploads: uploads,
      };

      let currentDocs = [...state.documents];
      const hasWajib = currentDocs.some(d => d.section === SECTIONS.WAJIB);

      if (!hasWajib && uploads.length > 0) {
        const nonWajibSlugs = currentDocs.filter(d => d.slug).map(d => d.slug);
        const wajibUploads = uploads.filter(u => {
          const uSlug = u.category || u.slug;
          return !nonWajibSlugs.includes(uSlug);
        });

        wajibUploads.forEach((u, idx) => {
          const slugStr = u.category || u.slug || "dokumen_wajib";
          const cleanName = slugStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

          currentDocs.push({
            id: `${SECTIONS.WAJIB}-${idx + 1}`,
            section: SECTIONS.WAJIB,
            name: cleanName,
            slug: slugStr,
            templateUrl: null,
            fileUrl: null,
            fileName: "",
            fileSize: "",
            file: null,
            error: null,
            status: "",
            isValid: null,
          });
        });
      }

      const updatedDocs = currentDocs.map(doc => {
        const uploaded = uploads.find(
          u => u.category === doc.slug || u.slug === doc.slug || (u.name && u.name.includes(doc.slug))
        );
        
        if (uploaded) {
          const isRejected = draft.isEdit && uploaded.isValid === false;
          return { 
            ...doc, 
            status: isRejected ? "" : "completed", 
            fileUrl: uploaded.downloadUrl || uploaded.previewUrl || uploaded.url, 
            fileName: uploaded.name || uploaded.filename || "Dokumen Terunggah",
            isValid: uploaded.isValid,
            error: isRejected ? "Berkas ditolak. Silakan unggah dokumen yang baru." : null
          };
        }
        return doc;
      });

      updatedDocs.sort((a, b) => (a.slug || '').localeCompare(b.slug || ''));

      const newActiveDocIds = { ...state.activeDocIds };
      const wajibAfter = updatedDocs.filter(d => d.section === SECTIONS.WAJIB);
      if (wajibAfter.length > 0 && !newActiveDocIds[SECTIONS.WAJIB]) {
         newActiveDocIds[SECTIONS.WAJIB] = wajibAfter[0].id;
      }

      return { ...state, step: 1, data: newData, documents: updatedDocs, activeDocIds: newActiveDocIds };
    }

    case "SET_DYNAMIC_DOCUMENTS": {
      const apiDocs = [];
      const sectionCounts = {};
      const sectionsFromApi = new Set(); 
      const uploads = state.data.uploads || []; 

      (action.payload || []).forEach(item => {
        if (!item.category) return;
        
        const cat = item.category.toLowerCase();
        let mappedSection = null;
        
        if (cat.includes("berkas wajib")) mappedSection = SECTIONS.WAJIB;
        else if (cat.includes("publikasi jurnal")) mappedSection = SECTIONS.JURNAL;
        else if (cat.includes("pameran")) mappedSection = SECTIONS.PAMERAN;
        else if (cat.includes("lomba")) mappedSection = SECTIONS.LOMBA;
        else if (cat.includes("kewirausahaan")) mappedSection = SECTIONS.WIRAUSAHA;

        if (mappedSection) {
          sectionsFromApi.add(mappedSection);
          if (!sectionCounts[mappedSection]) sectionCounts[mappedSection] = 0;
          sectionCounts[mappedSection]++;
          
          const existingDoc = state.documents.find(d => d.slug === item.code);
          const uploaded = uploads.find(
            u => u.category === item.code || u.slug === item.code || (u.name && u.name.includes(item.code))
          );
          
          let cleanName = item.name ? item.name.replace(/^contoh\s+/i, '').trim() : "";
          cleanName = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : cleanName;

          const isRejected = state.data.isEdit && uploaded?.isValid === false;
          
          apiDocs.push({
            id: `${mappedSection}-${sectionCounts[mappedSection]}`,
            section: mappedSection,
            name: cleanName,
            slug: item.code, 
            templateUrl: item.downloadUrl || item.url || null,
            fileUrl: uploaded ? (uploaded.downloadUrl || uploaded.previewUrl || uploaded.url) : (existingDoc ? existingDoc.fileUrl : null),
            fileName: uploaded ? (uploaded.name || uploaded.filename || "Dokumen Terunggah") : (existingDoc ? existingDoc.fileName : ""),
            fileSize: existingDoc ? existingDoc.fileSize : "",
            file: existingDoc ? existingDoc.file : null,
            error: isRejected ? "Berkas ditolak. Silakan unggah dokumen yang baru." : (existingDoc ? existingDoc.error : null),
            status: uploaded ? (isRejected ? "" : "completed") : (existingDoc ? existingDoc.status : ""),
            isValid: uploaded ? uploaded.isValid : (existingDoc ? existingDoc.isValid : null),
          });
        }
      });

      const staticDocs = state.documents.filter(d => !sectionsFromApi.has(d.section));
      const newDocuments = [...apiDocs, ...staticDocs];

      newDocuments.sort((a, b) => (a.slug || '').localeCompare(b.slug || ''));

      const newActiveDocIds = { ...state.activeDocIds };
      Object.values(SECTIONS).forEach(sec => {
        const docsInSection = newDocuments.filter(d => d.section === sec);
        if (docsInSection.length > 0) {
          if (!docsInSection.find(d => d.id === newActiveDocIds[sec])) {
            newActiveDocIds[sec] = docsInSection[0].id;
          }
        } else {
          newActiveDocIds[sec] = "";
        }
      });

      return { ...state, documents: newDocuments, activeDocIds: newActiveDocIds };
    }

    case "UPLOAD_DOCUMENT": {
      const updatedDocs = state.documents.map((doc) =>
        doc.id === action.docId ? { 
          ...doc, 
          file: action.file, 
          fileUrl: action.fileUrl, 
          fileName: action.fileName, 
          fileSize: action.fileSize, 
          error: null, 
          status: "",
          isValid: null
        } : doc
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