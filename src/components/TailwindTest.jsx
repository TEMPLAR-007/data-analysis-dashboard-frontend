import React from 'react';

const TailwindTest = () => {
    return (
        <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4 my-4">
            <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">T</div>
            </div>
            <div>
                <div className="text-xl font-medium text-black">Tailwind CSS is working!</div>
                <p className="text-gray-500">This component is styled with Tailwind classes</p>
            </div>
        </div>
    );
};

export default TailwindTest;