import React, { SelectHTMLAttributes } from 'react';
import classNames from 'classnames';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  fullWidth?: boolean;
  id: string;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  fullWidth = true,
  className,
  id,
  placeholder,
  ...props
}) => {
  return (
    <div className={classNames('mb-4', { 'w-full': fullWidth })}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        className={classNames(
          'shadow-sm rounded-md border-gray-300 focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm',
          { 'border-red-300': error },
          className
        )}
        {...props}
      >
        <option value="">{placeholder ?? 'Seleziona...'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;