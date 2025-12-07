import { useState, useEffect } from 'react';
import { showInfo } from '@/utils/sweetalert';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const isStandalone = () => {
            return (
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://')
            );
        };

        const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';

        if (!isStandalone() && !isDismissed) {
            setShowPrompt(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);

            if (!isDismissed) {
                setShowPrompt(true);
            }
        };

        const handleAppInstalled = () => {
            setShowPrompt(false);
            setDeferredPrompt(null);
            localStorage.removeItem('pwa-install-dismissed');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            showInfo('Para instalar, usa el menú de tu navegador y selecciona "Agregar a pantalla de inicio"', 'Instalación Manual');
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            localStorage.removeItem('pwa-install-dismissed');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleClose = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showPrompt) {
        return null;
    }

    return (
        <div className="install-prompt">
            <div className="install-prompt__content">
                <div className="install-prompt__text">
                    <strong className="install-prompt__title">Instala la Aplicación</strong>
                    <span className="install-prompt__subtitle">Acceso rápido en tu pantalla de inicio</span>
                </div>
                <button onClick={handleInstallClick} className="install-prompt__install-btn">
                    Instalar
                </button>
                <button onClick={handleClose} className="install-prompt__close-btn" aria-label="Cerrar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
