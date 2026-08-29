/**
 * Helper untuk mengekstrak parameter pagination dari query request.
 *
 * @param {Object} query - req.query dari Express
 * @param {number} defaultLimit - Batas default data per halaman (default: 10)
 * @returns {Object} { isPaginated, page, limit, skip, take }
 */
export const getPaginationParams = (query = {}, defaultLimit = 10) => {
  const { page: rawPage, limit: rawLimit, pagination } = query;

  // Jika eksplisit meminta tanpa paginasi (misal untuk dropdown)
  if (pagination === 'false' || rawLimit === 'all' || rawLimit === '-1') {
    return {
      isPaginated: false,
      page: 1,
      limit: null,
      skip: undefined,
      take: undefined,
    };
  }

  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const parsedLimit = parseInt(rawLimit, 10);
  const limit = Math.max(1, Math.min(100, isNaN(parsedLimit) ? defaultLimit : parsedLimit));
  const skip = (page - 1) * limit;

  return {
    isPaginated: true,
    page,
    limit,
    skip,
    take: limit,
  };
};

/**
 * Format response terstandar dengan metadata pagination.
 *
 * @param {Array} data - Array data yang akan dikembalikan
 * @param {number} total - Total seluruh data yang cocok dengan filter
 * @param {Object} paginationParams - Hasil dari getPaginationParams
 * @returns {Object} { data: Array, pagination: Object }
 */
export const formatPaginationResponse = (data = [], total = 0, paginationParams = {}) => {
  if (!paginationParams || !paginationParams.isPaginated) {
    return {
      data,
      pagination: {
        page: 1,
        limit: data.length,
        total: total ?? data.length,
        totalPages: 1,
      },
    };
  }

  const { page, limit } = paginationParams;
  const totalCount = typeof total === 'number' ? total : data.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    data,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
    },
  };
};
