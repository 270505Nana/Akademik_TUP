/**
 * Mapper untuk entitas Sidang Period dan Yudisium Period
 */

/**
 * Memetakan single period entity dari Prisma ke representasi DTO
 *
 * @param {Object} period
 * @returns {Object|null}
 */
export const mapPeriod = (period) => {
  if (!period) return null;

  return {
    id: period.id,
    createdAt: period.createdAt,
    updatedAt: period.updatedAt,
    deletedAt: period.deletedAt,
    name: period.name,
    category: period.category,
    period: period.period,
    startDate: period.startDate,
    endDate: period.endDate,
    isOpen: period.isOpen,
    ...(period.isPublished !== undefined && { isPublished: period.isPublished }),
  };
};

/**
 * Memetakan pasangan periode pendaftaran & pelaksanaan
 *
 * @param {Object} pair - { pendaftaran, pelaksanaan }
 * @returns {Object}
 */
export const mapPeriodPair = (pair) => {
  if (!pair) return null;

  return {
    pendaftaran: pair.pendaftaran ? mapPeriod(pair.pendaftaran) : null,
    pelaksanaan: pair.pelaksanaan ? mapPeriod(pair.pelaksanaan) : null,
  };
};
