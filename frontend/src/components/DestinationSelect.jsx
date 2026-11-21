import { useEffect, useRef, useState } from 'react';
import { shippingService } from '../services/shippingService';

export default function DestinationSelect({
  value,
  onChange,
  error,
  disabled = false,
  id = 'wilayah-tujuan',
}) {
  const [inputValue, setInputValue] = useState(value?.label || '');
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [emptyResults, setEmptyResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const searchReqIdRef = useRef(0);
  const retryQueryRef = useRef('');

  // Keep input in sync with external value
  useEffect(() => {
    if (value && value.label) {
      setInputValue(value.label);
    }
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // If user typed something but didn't select an option, reset input to selected value
        if (value?.label) {
          setInputValue(value.label);
        } else {
          setInputValue('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Debounced search when input changes
  const executeSearch = (query) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setOptions([]);
      setIsOpen(false);
      setLoading(false);
      setFetchError('');
      setEmptyResults(false);
      setHighlightedIndex(-1);
      return;
    }

    const currentReqId = ++searchReqIdRef.current;
    setLoading(true);
    setFetchError('');
    setEmptyResults(false);
    retryQueryRef.current = trimmed;

    shippingService
      .searchDestinations(trimmed)
      .then((res) => {
        if (currentReqId !== searchReqIdRef.current) return;
        const results = Array.isArray(res?.data) ? res.data : [];
        setOptions(results);
        setIsOpen(true);
        setEmptyResults(results.length === 0);
        setHighlightedIndex(-1);
      })
      .catch((err) => {
        if (currentReqId !== searchReqIdRef.current) return;
        setOptions([]);
        setIsOpen(true);
        setFetchError('Daftar wilayah gagal dimuat. Coba lagi.');
        setEmptyResults(false);
        setHighlightedIndex(-1);
      })
      .finally(() => {
        if (currentReqId === searchReqIdRef.current) {
          setLoading(false);
        }
      });
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);

    // Any manual typing clears the valid selection
    if (value) {
      onChange(null);
    }

    if (text.trim().length < 3) {
      setOptions([]);
      setIsOpen(false);
      setLoading(false);
      setFetchError('');
      setEmptyResults(false);
      return;
    }

    // Debounce 400ms
    setLoading(true);
    const timeout = setTimeout(() => {
      executeSearch(text);
    }, 400);

    return () => clearTimeout(timeout);
  };

  const handleSelectOption = (option) => {
    setInputValue(option.label);
    onChange(option);
    setOptions([]);
    setIsOpen(false);
    setFetchError('');
    setEmptyResults(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (options.length > 0) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (options.length > 0) {
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (options.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
        e.preventDefault();
        handleSelectOption(options[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleRetry = () => {
    if (retryQueryRef.current) {
      executeSearch(retryQueryRef.current);
    }
  };

  return (
    <div className="ko-destination-search" ref={containerRef}>
      <div className="relative">
        <span
          className="ko-input-leading-icon"
          style={{ color: error ? '#ba1a1a' : '#0d631b' }}
          aria-hidden="true"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        <input
          id={id}
          ref={inputRef}
          type="search"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="destination-listbox"
          aria-activedescendant={
            highlightedIndex >= 0 ? `destination-opt-${highlightedIndex}` : undefined
          }
          disabled={disabled}
          placeholder="Ketik nama kecamatan atau kota..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (options.length > 0 || emptyResults || fetchError) {
              setIsOpen(true);
            }
          }}
          className={`ko-input-control${error ? ' error' : ''}`}
          style={{ paddingLeft: 42, paddingRight: 38 }}
        />

        {value && !loading && (
          <span
            className="ko-select-trailing-check"
            title="Wilayah terverifikasi"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              color: '#0d631b',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0d631b" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </span>
        )}

        {loading && (
          <span
            className="ko-spin-icon"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              color: '#0d631b',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </span>
        )}
      </div>

      {/* Combobox Dropdown */}
      {isOpen && (
        <ul
          id="destination-listbox"
          className="ko-destination-options"
          role="listbox"
          aria-label="Daftar wilayah tujuan"
        >
          {loading && options.length === 0 && (
            <li className="ko-destination-item-status" role="status">
              <div className="flex items-center gap-2 p-2 text-xs text-outline">
                <span className="ko-spin-icon">⏳</span>
                <span>Mencari wilayah...</span>
              </div>
            </li>
          )}

          {fetchError && (
            <li className="ko-destination-item-error" role="alert">
              <div className="p-3 text-xs text-error flex items-center justify-between gap-2" style={{ color: '#ba1a1a' }}>
                <span>{fetchError}</span>
                <button
                  type="button"
                  className="ko-link-retry text-xs font-bold"
                  onClick={handleRetry}
                  style={{ color: '#0d631b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Coba Lagi
                </button>
              </div>
            </li>
          )}

          {emptyResults && !loading && !fetchError && (
            <li className="ko-destination-item-empty" role="status">
              <div className="p-3 text-xs text-outline" style={{ color: '#707a6c' }}>
                Wilayah tidak ditemukan. Coba kata lain.
              </div>
            </li>
          )}

          {options.map((opt, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={opt.id}
                id={`destination-opt-${idx}`}
                role="option"
                aria-selected={value?.id === opt.id}
                className={isHighlighted ? 'ko-opt-highlighted' : ''}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => handleSelectOption(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className="flex items-center justify-between w-full"
                  style={{
                    backgroundColor: isHighlighted ? 'rgba(13, 99, 27, 0.08)' : 'transparent',
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {value?.id === opt.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0d631b" aria-hidden="true">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
