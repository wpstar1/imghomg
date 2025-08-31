/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fetchPromoImage } from './services/unsplashService';
import PolaroidCard from './components/PolaroidCard';
import Footer from './components/Footer';

type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}
type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";

const aspectButtonBase = "font-sans text-sm text-center py-2 px-4 rounded-full transform transition-all duration-200 hover:scale-105 border-2";
const selectedAspectButtonClass = `${aspectButtonBase} bg-yellow-400 border-yellow-400 text-black font-bold`;
const unselectedAspectButtonClass = `${aspectButtonBase} bg-white/5 border-white/20 text-neutral-300`;

const aspectRatioOptions: { label: string; value: AspectRatio }[] = [
    { label: '정사각형 (1:1)', value: '1:1' },
    { label: '세로 (3:4)', value: '3:4' },
    { label: '스토리 (9:16)', value: '9:16' },
    { label: '가로 (4:3)', value: '4:3' },
    { label: '와이드 (16:9)', value: '16:9' },
];

// Helper function to wrap text on a canvas
const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    // Use a more robust regex to split text into words or characters for languages without spaces.
    const words = text.split(/(\s+)/);
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n];
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    const totalHeight = (lines.length -1) * lineHeight;
    let startY = y - (totalHeight / 2);

    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], x, startY + (i * lineHeight));
    }
};


function App() {
    const [promoText, setPromoText] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const [appState, setAppState] = useState<'idle' | 'generating' | 'results-shown'>('idle');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

    const handleGenerateClick = async () => {
        if (!promoText.trim()) return;

        setAppState('generating');
        setGeneratedImage({ status: 'pending' });

        try {
            const resultUrl = await fetchPromoImage(promoText, aspectRatio);
            setGeneratedImage({ status: 'done', url: resultUrl });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImage({ status: 'error', error: errorMessage });
            console.error(`Failed to fetch promo image:`, err);
        } finally {
            setAppState('results-shown');
        }
    };

    const handleReset = () => {
        setPromoText('');
        setGeneratedImage(null);
        setAppState('idle');
    };

    const handleDownloadImage = () => {
        if (generatedImage?.status !== 'done' || !generatedImage.url || !promoText) {
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = generatedImage.url;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. Draw the base image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // 2. Set up text style for sharpness
            const fontSize = Math.floor(canvas.width / 15);
            ctx.font = `bold ${fontSize}px 'Roboto', sans-serif`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Use a sharper, less blurry shadow for better text definition
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // 3. Draw wrapped text
            const maxWidth = canvas.width * 0.9;
            const lineHeight = fontSize * 1.2;
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            
            wrapText(ctx, promoText, x, y, maxWidth, lineHeight);

            // 4. Trigger download
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'promo-image-with-text.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        img.onerror = (err) => {
            console.error("Failed to load image for canvas operations.", err);
            // Fallback to downloading just the base image if canvas fails
            const link = document.createElement('a');
            link.href = generatedImage.url!;
            link.download = 'promo-image-background.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert("텍스트를 이미지에 추가하는데 실패했습니다. 배경 이미지만 다운로드합니다.");
        };
    };

    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>

            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className="text-center mb-10">
                    <h1 className="text-6xl md:text-8xl font-caveat font-bold text-neutral-100">Promo Image AI</h1>
                    <p className="font-permanent-marker text-neutral-300 mt-2 text-xl tracking-wide">홍보 문구를 입력하면 AI가 광고 이미지를 만들어 드립니다.</p>
                </div>

                {appState === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-6 w-full max-w-lg"
                    >
                         <div className="mb-2 w-full">
                            <p className="text-center font-permanent-marker text-neutral-400 mb-4 text-lg">이미지 규격 선택:</p>
                            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                                {aspectRatioOptions.map(({ label, value }) => (
                                    <button
                                        key={value}
                                        onClick={() => setAspectRatio(value)}
                                        className={aspectRatio === value ? selectedAspectButtonClass : unselectedAspectButtonClass}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={promoText}
                            onChange={(e) => setPromoText(e.target.value)}
                            placeholder="예: '세상에서 가장 맛있는 비건 버거, 오늘만 50% 할인!'"
                            className="w-full h-32 p-4 bg-white/5 border-2 border-white/20 rounded-md text-lg text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-300 resize-none font-sans"
                            aria-label="Promotional text input"
                        />
                        <button onClick={handleGenerateClick} disabled={!promoText.trim()} className={primaryButtonClasses}>
                            이미지 생성하기
                        </button>
                    </motion.div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                    <div className="flex flex-col items-center gap-6 w-full px-4">
                        <PolaroidCard
                            aspectRatio={aspectRatio}
                            caption={promoText}
                            status={generatedImage?.status || 'pending'}
                            imageUrl={generatedImage?.url}
                            error={generatedImage?.error}
                        />
                         <div className="flex items-center gap-4 mt-4">
                            {appState === 'results-shown' && (
                                <>
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        새로 시작
                                    </button>
                                    <button onClick={handleDownloadImage} disabled={!generatedImage?.url} className={`${primaryButtonClasses} disabled:opacity-50`}>
                                        다운로드
                                    </button>
                                </>
                            )}
                             {appState === 'generating' && (
                                 <p className="font-permanent-marker text-yellow-400 text-lg animate-pulse">
                                     AI가 이미지를 생성하고 있습니다...
                                 </p>
                             )}
                         </div>
                    </div>
                )}
            </div>
            <Footer />
        </main>
    );
}

export default App;