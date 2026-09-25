import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Searchable dropdown penguji — compact variant, value = dosen.id.
const PengujiSearchable = ({ value, placeholder, otherValue, options = [], onChange, status }) => {
  const [isOpen, setIsOpen]   = useState(false);
  const [query, setQuery]     = useState('');
  const [coords, setCoords]   = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef            = useRef(null);
  const triggerRef            = useRef(null);
  const dropdownRef           = useRef(null);

  const available = options.filter(p => String(p.value) !== String(otherValue));
  const filtered = available.filter(p =>
    p.label.toLowerCase().includes(query.toLowerCase())
  );
  const selectedLabel = options.find(p => String(p.value) === String(value))?.label || '';

  let statusClass = 'saved';
  if (!value) {
    statusClass = 'empty';
  } else if (status === 'unsaved') {
    statusClass = 'unsaved';
  }

  // Hitung posisi trigger setiap kali dropdown dibuka.
  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 3,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      // Reposisi saat scroll/resize supaya dropdown tetap menempel ke trigger.
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isOpen, updateCoords]);

  // Click-outside close — cek trigger DAN dropdown portal.
  useEffect(() => {
    const handleOutside = (e) => {
      const clickedTrigger = wrapperRef.current && wrapperRef.current.contains(e.target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!clickedTrigger && !clickedDropdown) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = (optValue) => {
    onChange(optValue || null);
    setIsOpen(false);
    setQuery('');
  };



  return (
    <div ref={wrapperRef} className="ps-penguji-searchable-wrap">
      <div
        ref={triggerRef}
        className={`ps-penguji-trigger ${statusClass}`}
        onClick={() => setIsOpen(prev => !prev)}
        title={selectedLabel || placeholder}
      >
        <span className={`ps-penguji-trigger-label ${!selectedLabel ? 'empty' : ''}`}>
          {selectedLabel || placeholder}
        </span>
        <div className="ps-penguji-trigger-icons">
          <svg
            width="10" height="10" viewBox="0 0 10 10"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.15s', flexShrink: 0 }}
          >
            <path d="M1 3l4 4 4-4" stroke="#94A3B8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="ps-penguji-dropdown ps-penguji-dropdown-portal"
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            width: coords.width + 120,
          }}
        >
          <div className="ps-penguji-search-wrap">
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
              <circle cx="5" cy="5" r="4" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
              <path d="M8.5 8.5l2.5 2.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className="ps-penguji-search-input"
              type="text"
              placeholder="Cari nama atau kode..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="ps-penguji-list">
            {filtered.length > 0 ? (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  className={`ps-penguji-option ${String(value) === String(opt.value) ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="ps-penguji-empty">Dosen tidak ditemukan</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PengujiSearchable;