import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import classNames from 'classnames';

interface AutocompleteOption {
  value: string;
  usageCount?: number;
}

interface AutocompleteInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect?: (value: string) => void;
  getSuggestions: (query: string) => Promise<AutocompleteOption[]>;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  onSelect,
  getSuggestions,
  placeholder,
  error,
  required = false,
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedValue = useDebounce(value, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (debouncedValue.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await getSuggestions(debouncedValue);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, [debouncedValue, getSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectSuggestion = (suggestionValue: string) => {
    const syntheticEvent = {
      target: {
        name,
        value: suggestionValue,
        type: 'text',
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
    if (onSelect) {
      onSelect(suggestionValue);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={classNames(
            'shadow-sm block w-full sm:text-sm rounded-md',
            {
              'border-red-300 focus:ring-red-500 focus:border-red-500': error,
              'border-gray-300 focus:ring-primary-500 focus:border-primary-500': !error,
              'bg-gray-100 cursor-not-allowed': disabled,
            }
          )}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion.value)}
              className={classNames(
                'w-full text-left px-4 py-2 hover:bg-primary-50 focus:bg-primary-50 focus:outline-none',
                {
                  'bg-primary-100': index === selectedIndex,
                }
              )}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-900">{suggestion.value}</span>
                {suggestion.usageCount !== undefined && suggestion.usageCount > 0 && (
                  <span className="text-xs text-gray-500">
                    usato {suggestion.usageCount} {suggestion.usageCount === 1 ? 'volta' : 'volte'}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
