/**
 * Helper untuk menyusun URL unduhan template
 */
export const buildDownloadUrl = (req, template) => {
  if (!template?.code || !template?.filepath) return null;
  const baseUrl = req ? `${req.protocol}://${req.get("host")}` : "";
  return `${baseUrl}/api/templates/download/${template.code}`;
};

/**
 * Helper untuk menyusun URL pratinjau template
 */
export const buildPreviewUrl = (req, template) => {
  if (!template?.code || !template?.filepath) return null;
  const baseUrl = req ? `${req.protocol}://${req.get("host")}` : "";
  return `${baseUrl}/api/templates/preview/${template.code}`;
};

/**
 * Memetakan data dokumen template upload tunggal ke response format standar
 */
export const mapTemplateUpload = (data, req) => {
  if (!data) return null;
  const downloadUrl = buildDownloadUrl(req, data);
  const previewUrl = buildPreviewUrl(req, data);
  return {
    id: data.id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    name: data.name,
    code: data.code,
    category: data.category,
    queue: data.queue,
    filepath: data.filepath,
    isPublish: data.isPublish,
    isRequired: data.isRequired,
    downloadUrl,
    previewUrl,
    url: downloadUrl,
  };
};

/**
 * Memetakan daftar dokumen template upload
 */
export const mapTemplateUploadList = (list, req) => {
  if (!Array.isArray(list)) return [];
  return list.map((item) => mapTemplateUpload(item, req));
};
