import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';

// ============================================
// OZOBATH - Phone Input with Country Code
// ============================================
// Splits the dial code from the subscriber number so they can be validated
// independently. Storing them concatenated made "+919845000000" and
// "9845000000" indistinguishable, and the checkout's /^\d{10}$/ check
// rejected any number a customer typed with a country code.
//
// The value exposed to the parent is the full E.164-ish string
// ("+919845000000") because that is what Razorpay prefill and SMS
// providers expect. The split is a UI concern only.

// Ordered so the common cases sit at the top; the rest are searchable.
export const COUNTRIES = [
  { code: 'IN', dial: '+91', name: 'India', digits: 10, flag: '🇮🇳' },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates', digits: 9, flag: '🇦🇪' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia', digits: 9, flag: '🇸🇦' },
  { code: 'US', dial: '+1', name: 'United States', digits: 10, flag: '🇺🇸' },
  { code: 'GB', dial: '+44', name: 'United Kingdom', digits: 10, flag: '🇬🇧' },
  { code: 'SG', dial: '+65', name: 'Singapore', digits: 8, flag: '🇸🇬' },
  { code: 'AU', dial: '+61', name: 'Australia', digits: 9, flag: '🇦🇺' },
  { code: 'CA', dial: '+1', name: 'Canada', digits: 10, flag: '🇨🇦' },
  { code: 'MY', dial: '+60', name: 'Malaysia', digits: 9, flag: '🇲🇾' },
  { code: 'QA', dial: '+974', name: 'Qatar', digits: 8, flag: '🇶🇦' },
  { code: 'KW', dial: '+965', name: 'Kuwait', digits: 8, flag: '🇰🇼' },
  { code: 'OM', dial: '+968', name: 'Oman', digits: 8, flag: '🇴🇲' },
  { code: 'BH', dial: '+973', name: 'Bahrain', digits: 8, flag: '🇧🇭' },
  { code: 'LK', dial: '+94', name: 'Sri Lanka', digits: 9, flag: '🇱🇰' },
  { code: 'NP', dial: '+977', name: 'Nepal', digits: 10, flag: '🇳🇵' },
];

const DEFAULT = COUNTRIES[0];

// Splits a stored value back into { country, number }. Longest dial code
// first, so +971 is not mistaken for +97 followed by a digit.
export const parsePhone = (value) => {
  const raw = String(value || '').trim();
  if (!raw.startsWith('+')) return { country: DEFAULT, number: raw.replace(/\D/g, '') };

  const match = [...COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => raw.startsWith(c.dial));

  if (!match) return { country: DEFAULT, number: raw.replace(/\D/g, '') };
  return { country: match, number: raw.slice(match.dial.length).replace(/\D/g, '') };
};

// Exported so the checkout validates against the same rule the input shows.
export const isValidPhone = (value) => {
  const { country, number } = parsePhone(value);
  return number.length === country.digits;
};

const PhoneInput = ({ value, onChange, error, id = 'phone' }) => {
  const initial = parsePhone(value);
  const [country, setCountry] = useState(initial.country);
  const [number, setNumber] = useState(initial.number);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  // Keep local state in step when the parent replaces the value — picking a
  // saved address rewrites the whole form.
  useEffect(() => {
    const next = parsePhone(value);
    setCountry(next.country);
    setNumber(next.number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const emit = (c, n) => onChange(`${c.dial}${n}`);

  const handleNumber = (e) => {
    // Strip anything non-numeric as it is typed: customers paste numbers
    // with spaces, dashes and a leading zero.
    const digits = e.target.value.replace(/\D/g, '').slice(0, country.digits);
    setNumber(digits);
    emit(country, digits);
  };

  const pick = (c) => {
    setCountry(c);
    setOpen(false);
    setQuery('');
    // Re-clamp: switching from a 10-digit to an 8-digit country must not
    // leave an over-long number behind.
    const clamped = number.slice(0, c.digits);
    setNumber(clamped);
    emit(c, clamped);
  };

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.dial.includes(query) ||
      c.code.toLowerCase().includes(query.toLowerCase())
  );

  const tooShort = number.length > 0 && number.length < country.digits;
  const showError = error || (tooShort ? `Enter ${country.digits} digits` : '');

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex items-stretch rounded-xl border bg-white transition-colors ${
          showError ? 'border-red-300' : 'border-dark-100/60 focus-within:border-accent-400'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Select country code"
          aria-expanded={open}
          className="flex items-center gap-1.5 px-3 rounded-l-xl hover:bg-dark-50 transition-colors border-r border-dark-100/60 shrink-0"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-sm font-semibold text-dark-700">{country.dial}</span>
          <FiChevronDown className={`w-3.5 h-3.5 text-dark-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={number}
          onChange={handleNumber}
          placeholder={'0'.repeat(country.digits)}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none rounded-r-xl min-w-0"
        />
      </div>

      {showError && <p className="text-xs text-red-600 mt-1">{showError}</p>}

      {open && (
        <div className="absolute z-50 mt-1.5 w-full max-w-xs bg-white rounded-xl border border-dark-100 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-dark-100/60">
            <FiSearch className="w-3.5 h-3.5 text-dark-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country"
              className="flex-1 text-sm outline-none bg-transparent min-w-0"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto">
            {filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => pick(c)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent-50 transition-colors ${
                    c.code === country.code ? 'bg-accent-50/60 font-semibold' : ''
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 truncate text-dark-700">{c.name}</span>
                  <span className="text-dark-400 text-xs">{c.dial}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-sm text-dark-400 text-center">No match</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
