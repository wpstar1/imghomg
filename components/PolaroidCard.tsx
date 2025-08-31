/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion } from 'framer-motion';

type ImageStatus = 'pending' | 'done' | 'error';
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface PolaroidCardProps {
    imageUrl?: string;
    caption: string;
    status: ImageStatus;
    error?: string;
    aspectRatio: AspectRatio;
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
        <svg className="animate-spin h-8 w-8 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const ErrorDisplay = ({ error }: { error?: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-400 text-sm">Image generation failed.</p>
        {error && <p className="text-neutral-500 text-xs mt-1 max-w-full break-words">{error}</p>}
    </div>
);


const PolaroidCard: React.FC<PolaroidCardProps> = ({ imageUrl, caption, status, error, aspectRatio }) => {
    
    // Map aspect ratios to Tailwind classes for responsive sizing and aspect ratio
    const sizeClasses: Record<AspectRatio, string> = {
        '1:1': 'max-w-md aspect-square',
        '3:4': 'max-w-sm aspect-[3/4]',
        '9:16': 'max-w-sm aspect-[9/16]',
        '4:3': 'max-w-lg aspect-[4/3]',
        '16:9': 'max-w-xl aspect-[16/9]',
    };

    const cardSizeClass = sizeClasses[aspectRatio] || sizeClasses['1:1'];

    return (
        <motion.div
            className={`bg-neutral-100 dark:bg-neutral-100 p-4 pb-4 flex flex-col items-center justify-start w-full rounded-md shadow-lg relative ${cardSizeClass}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
            <div className="w-full bg-neutral-900 shadow-inner flex-grow relative overflow-hidden group">
                {status === 'pending' && <LoadingSpinner />}
                {status === 'error' && <ErrorDisplay error={error} />}
                {status === 'done' && imageUrl && (
                    <>
                        <img
                            key={imageUrl}
                            src={imageUrl}
                            alt="AI generated background"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/40">
                             <p 
                                className="font-bold text-white text-center text-3xl leading-tight" 
                                style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}
                            >
                                {caption}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default PolaroidCard;