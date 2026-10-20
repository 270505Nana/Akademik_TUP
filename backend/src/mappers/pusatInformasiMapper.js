/**
 * Mapping satu dokumen panduan tugas akhir / pusat informasi ke format response API
 */
export const mapPusatInformasi = (item) => {
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

/**
 * Mapping daftar dokumen panduan tugas akhir / pusat informasi
 */
export const mapPusatInformasiList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(mapPusatInformasi);
};

/**
 * Mengelompokkan dokumen panduan berdasarkan kategori
 */
export const groupPusatInformasiByCategory = (items) => {
  if (!Array.isArray(items)) return [];
  const groupedMap = new Map();
  for (const item of items) {
    if (!groupedMap.has(item.category)) {
      groupedMap.set(item.category, []);
    }
    groupedMap.get(item.category).push(mapPusatInformasi(item));
  }

  return Array.from(groupedMap.entries()).map(([category, list]) => ({
    category,
    data: list,
  }));
};
