import { useEffect } from 'react';
import './Lightbox.css';

interface LightboxProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrevious: () => void;
}

export default function Lightbox({ images, currentIndex, onClose, onNext, onPrevious }: LightboxProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrevious();
            if (e.key === 'ArrowRight') onNext();
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, onNext, onPrevious]);

    if (images.length === 0) return null;

    return (
        <div className="lightbox" onClick={onClose}>
            <button onClick={onClose} className="lightbox__close">
                ×
            </button>

            <div className="lightbox__content">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrevious();
                    }}
                    className="lightbox__nav lightbox__nav--prev"
                >
                    &#10094;
                </button>

                <img
                    src={images[currentIndex]}
                    alt="Full size"
                    className="lightbox__image"
                    onClick={(e) => e.stopPropagation()}
                />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onNext();
                    }}
                    className="lightbox__nav lightbox__nav--next"
                >
                    &#10095;
                </button>
            </div>

            <div className="lightbox__counter">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    );
}
