import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { CountryCode } from 'libphonenumber-js';
import { getAllCountries, CountryInfo } from '@/lib/countryCodes';

interface CountryCodeSelectorProps {
  value: CountryCode;
  onChange: (country: CountryCode) => void;
  disabled?: boolean;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const countries = useMemo(() => getAllCountries(), []);

  const currentCountry = useMemo(() => {
    return countries.find((c) => c.code === value) || {
      code: value,
      name: value,
      dialCode: '+1',
      flag: '🌐',
    };
  }, [countries, value]);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [countries, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (c: CountryInfo) => {
    onChange(c.code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-11 px-3 rounded-xl bg-surface-2/90 border border-border/80 hover:border-primary/50 text-foreground flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 select-none text-xs sm:text-sm font-medium"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`${currentCountry.name} (${currentCountry.dialCode})`}
      >
        <span className="text-base leading-none select-none">{currentCountry.flag}</span>
        <span className="font-mono text-xs font-semibold text-text-primary">
          {currentCountry.dialCode}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 max-w-[90vw] bg-surface-1/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              className="w-full bg-surface-2 border border-border/80 rounded-xl pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto overscroll-contain space-y-0.5 pr-1">
            {filteredCountries.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No country found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/15 text-primary font-bold'
                        : 'hover:bg-surface-2 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none shrink-0">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0 font-medium">
                      {c.dialCode}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
