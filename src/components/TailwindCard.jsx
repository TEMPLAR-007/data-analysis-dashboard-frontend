import React from 'react';

/**
 * A reusable card component built with Tailwind CSS
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content of the card
 * @param {string} props.title - The title of the card
 * @param {boolean} props.elevated - Whether the card should have a shadow
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClose - Optional function to call when the close button is clicked
 * @returns {JSX.Element}
 */
const TailwindCard = ({
    children,
    title,
    elevated = true,
    className = '',
    onClose
}) => {
    return (
        <div
            className={`
        bg-white rounded-lg overflow-hidden
        ${elevated ? 'shadow-md hover:shadow-lg transition-shadow duration-300' : 'border border-gray-200'}
        ${className}
      `}
        >
            {title && (
                <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800">{title}</h3>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    )}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

export default TailwindCard;