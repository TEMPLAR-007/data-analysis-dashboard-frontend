import React from 'react';

/**
 * Card component built with Tailwind CSS
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content of the card
 * @param {string} props.title - Optional card title
 * @param {React.ReactNode} props.headerActions - Optional actions to display in the header
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
const Card = ({
    children,
    title = null,
    headerActions = null,
    className = ''
}) => {
    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
            {(title || headerActions) && (
                <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200">
                    {title && (
                        typeof title === 'string'
                            ? <h3 className="text-lg font-medium text-gray-800">{title}</h3>
                            : title
                    )}
                    {headerActions && (
                        <div className="flex items-center space-x-2">
                            {headerActions}
                        </div>
                    )}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;