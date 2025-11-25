class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.installPrompt = document.getElementById('pwa-install-prompt');
        this.installBtn = document.getElementById('pwa-install-btn');
        this.dismissBtn = document.getElementById('pwa-dismiss-btn');
        this.isDismissed = localStorage.getItem('pwa-dismissed') === 'true';
        this.init();
    }

    init() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => {
                this.installApp();
            });
        }

        if (this.dismissBtn) {
            this.dismissBtn.addEventListener('click', () => {
                this.dismissPrompt();
            });
        }

        window.addEventListener('appinstalled', () => {
            this.hideInstallPrompt();
            this.deferredPrompt = null;
        });

        this.checkIfStandalone();

        setTimeout(() => {
            if (!this.isStandalone() && !this.isDismissed) {
                this.showInstallPrompt();
            }
        }, 3000);
    }

    showInstallPrompt() {
        if (this.installPrompt && !this.isStandalone() && !this.isDismissed) {
            this.installPrompt.classList.remove('hidden');
        }
    }

    hideInstallPrompt() {
        if (this.installPrompt) {
            this.installPrompt.classList.add('hidden');
        }
    }

    dismissPrompt() {
        this.isDismissed = true;
        localStorage.setItem('pwa-dismissed', 'true');
        this.hideInstallPrompt();

        setTimeout(() => {
            localStorage.removeItem('pwa-dismissed');
            this.isDismissed = false;
        }, 7 * 24 * 60 * 60 * 1000);
    }

    async installApp() {
        if (!this.deferredPrompt) {
            if (window.displayMessage) {
                window.displayMessage('Para instalar, usa el menú de tu navegador y selecciona "Agregar a pantalla de inicio"', true);
            }
            return;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        this.deferredPrompt = null;
        this.hideInstallPrompt();
    }

    isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://');
    }

    checkIfStandalone() {
        if (this.isStandalone()) {
            this.hideInstallPrompt();
        }
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

window.PWAManager = PWAManager;