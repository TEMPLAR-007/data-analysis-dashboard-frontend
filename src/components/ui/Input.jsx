import React from 'react';

/**
 * Input component with Tailwind CSS styling
 *
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.id - Input ID
 * @param {string} props.type - Input type
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {boolean} props.fullWidth - Whether the input should take full width
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
const Input = ({
    label,
    id,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    fullWidth = true,
    className = '',
    ...props
}) => {
    return (
        <div className={`mb-4 ${fullWidth ? 'w-full' : ''} ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="block mb-2 font-medium text-gray-700"
                >
                    {label}
                </label>
            )}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`
          w-full px-3 py-2 border rounded-md
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          ${error ? 'border-error' : 'border-border'}
          bg-white text-text
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-error">{error}</p>
            )}
        </div>
    );
};

export default Input;