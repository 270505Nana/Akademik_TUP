export const mapRuangan = (ruangan) => {
  if (!ruangan) return null;
  return {
    id: ruangan.id,
    name: ruangan.name,
    gedung: ruangan.gedung,
    isActive: ruangan.isActive,
  };
};
