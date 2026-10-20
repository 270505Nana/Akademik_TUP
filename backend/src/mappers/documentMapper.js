import { mapMahasiswa } from "./userMapper.js";

export const mapSklUpload = (item, req) => {
  if (!item) return null;
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    name: item.name,
    category: item.category,
    filepath: item.filepath,
    mahasiswaId: item.mahasiswaId,
    mahasiswa: mapMahasiswa(item.mahasiswa),
    downloadUrl: `${req.protocol}://${req.get("host")}/api/skl/uploads/${item.id}/download`,
  };
};

export const mapSklUploadList = (list, req) => {
  if (!Array.isArray(list)) return [];
  return list.map((item) => mapSklUpload(item, req));
};

export const mapTranskripUpload = (item, req) => {
  if (!item) return null;
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    name: item.name,
    category: item.category,
    filepath: item.filepath,
    mahasiswaId: item.mahasiswaId,
    mahasiswa: mapMahasiswa(item.mahasiswa),
    downloadUrl: `${req.protocol}://${req.get("host")}/api/transkrip/uploads/${item.id}/download`,
  };
};

export const mapTranskripUploadList = (list, req) => {
  if (!Array.isArray(list)) return [];
  return list.map((item) => mapTranskripUpload(item, req));
};

export const mapDokumenPanduanTugasAkhir = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    createdAt: item.createdAt ? item.createdAt.toISOString() : null,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
    category: item.category,
    name: item.name,
    description: item.description ?? "",
    icon: item.icon ?? "",
    url: item.path ?? "",
    isPublish: item.isPublish ?? null,
    showInPreview: item.showInPreview ? item.showInPreview.toISOString() : null,
    queue: item.queue,
  };
};

export const mapPusatInformasi = mapDokumenPanduanTugasAkhir;
