import React from 'react';

/**
 * Button component built with Tailwind CSS
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant (primary, secondary, outline, danger)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.fullWidth - Whether the button should take full width
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @returns {JSX.Element}
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    className = '',
    onClick,
    ...props
}) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';

    // Size classes
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    // Variant classes
    const variantClasses = {
        primary: 'bg-[#3f51b5] text-white hover:bg-[#303f9f] focus:ring-[#3f51b5] border border-transparent',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500 border border-transparent',
        outline: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-[#3f51b5] border border-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent'
    };

    // Disabled classes
    const disabledClasses = 'opacity-50 cursor-not-allowed';

    // Full width class
    const fullWidthClass = 'w-full';

    return (
        <button
            className={`
        ${baseClasses}
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${disabled ? disabledClasses : ''}
        ${fullWidth ? fullWidthClass : ''}
        ${className}
      `}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;