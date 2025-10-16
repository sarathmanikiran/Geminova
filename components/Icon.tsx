import React from 'react';

interface IconProps {
    type: string;
}

export const Icon: React.FC<IconProps> = ({ type }) => {
    const icons: { [key: string]: React.ReactElement } = {
        '✅': <span className="text-green-500">✅</span>,
        '💡': <span>💡</span>,
        '🔍': <span>🔍</span>,
        'clipboard': <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    };
    return icons[type] || null;
};