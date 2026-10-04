

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { buildNiceScale } from './registrasiTAHelpers';

/**
 * VerticalBarChart
 * Menampilkan diagram batang vertikal dengan animasi masuk (grow dari bawah).
 *
 * @param {Array} dataList - Array of { label, shortLabel, count }
 */
const VerticalBarChart = ({ dataList = [] }) => {
  const maxCount = useMemo(() => {
    if (!dataList || dataList.length === 0) return 0;
    return Math.max(...dataList.map((d) => d.count), 0);
  }, [dataList]);

  const { niceMax, ticks } = useMemo(() => {
    return buildNiceScale(maxCount);
  }, [maxCount]);

  const yTicksDesc = useMemo(() => {
    return [...ticks].reverse();
  }, [ticks]);

  return (
    <div style={{ width: '100%', position: 'relative', paddingTop: 10 }}>
      <div style={{ display: 'flex', height: 230, position: 'relative' }}>
        {/* Sumbu Y (Label Angka) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingRight: 14,
            paddingBottom: 24,
            color: '#9CA3AF',
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'right',
            minWidth: 24,
            userSelect: 'none',
          }}
        >
          {yTicksDesc.map((val) => (
            <span key={val} style={{ lineHeight: 1 }}>
              {val}
            </span>
          ))}
        </div>

        {/* Area Grid + Batang */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* Garis horizontal background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              bottom: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pointerEvents: 'none',
            }}
          >
            {yTicksDesc.map((val) => (
              <div
                key={val}
                style={{
                  width: '100%',
                  height: 1,
                  background: val === 0 ? '#E2E8F0' : '#F1F5F9',
                }}
              />
            ))}
          </div>

          {/* Kolom Batang Diagram */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              paddingBottom: 24,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {dataList.map((item, idx) => {
              const heightPercent = niceMax > 0 ? (item.count / niceMax) * 100 : 0;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                    flex: 1,
                    maxWidth: 70,
                    margin: '0 8px',
                  }}
                >
                  {/* Angka di atas batang */}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: item.count > 0 ? '#991B1B' : '#94A3B8',
                      marginBottom: 6,
                      transition: 'color 0.2s',
                    }}
                  >
                    {item.count}
                  </span>

                  {/* Batang Vertikal dengan animasi masuk */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPercent, 2)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.08 }}
                    style={{
                      width: '100%',
                      background:
                        item.count > 0
                          ? 'linear-gradient(180deg, #4338CA 0%, #4F46E5 100%)'
                          : '#E2E8F0',
                      borderRadius: '6px 6px 0 0',
                      boxShadow:
                        item.count > 0 ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                      minHeight: 4,
                      cursor: 'pointer',
                    }}
                    whileHover={{ scaleY: 1.03, filter: 'brightness(1.1)' }}
                  />
                </div>
              );
            })}
          </div>

          {/* Sumbu X (Label Nama Fakultas) */}
          <div
            style={{
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              borderTop: '1px solid #E2E8F0',
              paddingTop: 8,
            }}
          >
            {dataList.map((item, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  maxWidth: 90,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  margin: '0 4px',
                }}
                title={item.label}
              >
                {item.shortLabel}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerticalBarChart;
