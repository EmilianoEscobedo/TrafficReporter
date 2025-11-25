import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    setLogLevel
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

setLogLevel('Debug');

class SiniestrosApp {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.isAuthReady = false;
        this.allAccidentRecords = [];

        this.mapManager = new window.MapManager();
        this.pwaManager = new window.PWAManager();

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.loginScreen = document.getElementById('login-screen');
        this.appScreen = document.getElementById('app-screen');
        this.googleSigninBtn = document.getElementById('google-signin-btn');
        this.signinText = document.getElementById('signin-text');
        this.signinSpinner = document.getElementById('signin-spinner');
        this.loginError = document.getElementById('login-error');
        this.logoutBtn = document.getElementById('logout-btn');
        this.userEmailDisplay = document.getElementById('user-email');
        this.userEmailMobile = document.getElementById('user-email-mobile');

        this.form = document.getElementById('accident-form');
        this.recordsList = document.getElementById('records-list');
        this.accidentCount = document.getElementById('accident-count');
        this.emptyState = document.getElementById('empty-state');
        this.submitBtn = document.getElementById('submit-btn');
        this.submitText = document.getElementById('submit-text');
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.messageArea = document.getElementById('message-area');
        this.fechaInput = document.getElementById('fecha');

        this.statsLoading = document.getElementById('stats-loading');
        this.statsViaSection = document.getElementById('stats-via');
        this.statsGravedadSection = document.getElementById('stats-gravedad');
        this.statsVehiculosSection = document.getElementById('stats-vehiculos');
        this.chartVia = document.getElementById('chart-via');
        this.chartGravedad = document.getElementById('chart-gravedad');
        this.chartVehiculos = document.getElementById('chart-vehiculos');

        this.locateMeBtn = document.getElementById('locate-me-btn');
        this.showAllAccidentsBtn = document.getElementById('show-all-accidents');
        this.showFatalAccidentsBtn = document.getElementById('show-fatal-accidents');
    }

    attachEventListeners() {
        if (this.googleSigninBtn) {
            this.googleSigninBtn.addEventListener('click', () => this.signInWithGoogle());
        }
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        if (this.locateMeBtn) {
            this.locateMeBtn.addEventListener('click', () => this.mapManager.getCurrentLocation());
        }
        if (this.showAllAccidentsBtn) {
            this.showAllAccidentsBtn.addEventListener('click', () => this.mapManager.filterAccidentMarkers(false));
        }
        if (this.showFatalAccidentsBtn) {
            this.showFatalAccidentsBtn.addEventListener('click', () => this.mapManager.filterAccidentMarkers(true));
        }

        window.showTab = (tabName) => this.showTab(tabName);
        window.showRecordOnMap = (lat, lng, ubicacion) => this.mapManager.showRecordOnMap(lat, lng, ubicacion);
        window.displayMessage = (text, isSuccess) => this.displayMessage(text, isSuccess);
    }

    getEnvironmentVars() {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        let firebaseConfig = {};
        let allowedEmails = [];

        if (typeof __firebase_config !== 'undefined' && __firebase_config) {
            try {
                if (typeof __firebase_config === 'string') {
                    firebaseConfig = JSON.parse(__firebase_config);
                } else {
                    firebaseConfig = __firebase_config;
                }
            } catch (e) {
                console.error("Error parsing Firebase config:", e);
            }
        }

        if (typeof __allowed_emails !== 'undefined' && __allowed_emails) {
            allowedEmails = __allowed_emails;
        }

        return { appId, firebaseConfig, allowedEmails };
    }

    displayMessage(text, isSuccess = true) {
        if (!this.messageArea) return;

        this.messageArea.textContent = text;
        this.messageArea.classList.remove('hidden', 'message-success', 'message-error');
        if (isSuccess) {
            this.messageArea.classList.add('message-success');
        } else {
            this.messageArea.classList.add('message-error');
        }
        setTimeout(() => {
            this.messageArea.classList.add('hidden');
        }, 8000);
    }

    displayLoginError(text) {
        if (!this.loginError) return;

        this.loginError.textContent = text;
        this.loginError.classList.remove('hidden');
        setTimeout(() => {
            this.loginError.classList.add('hidden');
        }, 8000);
    }

    showLoginScreen() {
        this.loginScreen?.classList.remove('hidden');
        this.appScreen?.classList.add('hidden');
    }

    showAppScreen() {
        this.loginScreen?.classList.add('hidden');
        this.appScreen?.classList.remove('hidden');
        setTimeout(() => this.mapManager.initializeMaps(), 100);
    }

    isEmailAllowed(email) {
        const { allowedEmails } = this.getEnvironmentVars();
        return allowedEmails.includes(email);
    }

    showTab(tabName) {
        const tabs = ['registro', 'mapa', 'estadisticas'];
        tabs.forEach(tab => {
            const contentEl = document.getElementById(`content-${tab}`);
            const tabEl = document.getElementById(`tab-${tab}`);

            if (contentEl) contentEl.classList.add('hidden');
            if (tabEl) {
                tabEl.classList.remove('border-teal-500', 'text-teal-600');
                tabEl.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            }
        });

        const activeContent = document.getElementById(`content-${tabName}`);
        const activeTab = document.getElementById(`tab-${tabName}`);

        if (activeContent) activeContent.classList.remove('hidden');
        if (activeTab) {
            activeTab.classList.add('border-teal-500', 'text-teal-600');
            activeTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        }

        if (tabName === 'estadisticas') {
            this.renderStatistics(this.allAccidentRecords);
        } else if (tabName === 'mapa') {
            setTimeout(() => {
                this.mapManager.invalidateSize();
                this.mapManager.loadAccidentMarkers(this.allAccidentRecords);
            }, 100);
        }
    }

    async initializeFirebase() {
        try {
            const { firebaseConfig } = this.getEnvironmentVars();

            if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.apiKey) {
                this.displayLoginError("Error crítico: Configuración de Firebase no encontrada.");
                return;
            }

            this.app = initializeApp(firebaseConfig);
            this.db = getFirestore(this.app);
            this.auth = getAuth(this.app);

            onAuthStateChanged(this.auth, (user) => {
                if (user && this.isEmailAllowed(user.email)) {
                    this.currentUser = user;
                    if (this.userEmailDisplay) this.userEmailDisplay.textContent = user.email;
                    if (this.userEmailMobile) this.userEmailMobile.textContent = user.email;
                    this.isAuthReady = true;
                    this.showAppScreen();
                    this.loadAccidentRecords();
                } else if (user && !this.isEmailAllowed(user.email)) {
                    signOut(this.auth);
                    this.displayLoginError(`Acceso denegado. El email ${user.email} no está autorizado.`);
                    this.showLoginScreen();
                } else {
                    this.currentUser = null;
                    this.isAuthReady = false;
                    this.showLoginScreen();
                }
            });

        } catch (error) {
            console.error("Error initializing Firebase:", error);
            this.displayLoginError(`Error de conexión: ${error.message}`);
        }
    }

    async signInWithGoogle() {
        if (!this.signinText || !this.signinSpinner || !this.googleSigninBtn) return;

        this.signinText.textContent = 'Conectando...';
        this.signinSpinner.classList.remove('hidden');
        this.googleSigninBtn.disabled = true;

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(this.auth, provider);
        } catch (error) {
            console.error("Error signing in:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                this.displayLoginError("Inicio de sesión cancelado.");
            } else {
                this.displayLoginError(`Error de autenticación: ${error.message}`);
            }
        } finally {
            this.signinText.textContent = 'Iniciar Sesión';
            this.signinSpinner.classList.add('hidden');
            this.googleSigninBtn.disabled = false;
        }
    }

    async handleLogout() {
        try {
            await signOut(this.auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    }

    getSelectedVehicles() {
        const checkboxes = document.querySelectorAll('input[name="vehicles_involved"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        if (!this.isAuthReady || !this.currentUser || !this.db) {
            this.displayMessage("Sistema no disponible. Por favor, recarga la página.", false);
            return;
        }

        const selectedVehicles = this.getSelectedVehicles();
        if (selectedVehicles.length === 0) {
            this.displayMessage("Por favor, selecciona al menos un tipo de vehículo implicado.", false);
            return;
        }

        const tipoVia = document.getElementById('tipo_via')?.value;
        const tipoSiniestro = document.getElementById('tipo')?.value;
        const gravedad = document.getElementById('gravedad')?.value;

        if (!tipoVia || !tipoSiniestro || !gravedad) {
            this.displayMessage("Por favor, completa todos los campos obligatorios.", false);
            return;
        }

        if (!this.mapManager.selectedLatLng) {
            this.displayMessage("Por favor, selecciona la ubicación en el mapa.", false);
            return;
        }

        const formData = new FormData(this.form);
        const data = {
            fecha: formData.get('fecha'),
            ubicacion: formData.get('ubicacion'),
            tipo_via: tipoVia,
            tipo: tipoSiniestro,
            gravedad: gravedad,
            vehiculos_total: parseInt(formData.get('vehiculos_total') || '0'),
            vehicles_involved: selectedVehicles,
            descripcion: formData.get('descripcion'),
            latitude: this.mapManager.selectedLatLng.lat,
            longitude: this.mapManager.selectedLatLng.lng,
            createdAt: serverTimestamp(),
            recordedBy: this.currentUser.email,
            recordedByUid: this.currentUser.uid
        };

        this.submitText.textContent = 'Guardando...';
        this.loadingSpinner?.classList.remove('hidden');
        if (this.submitBtn) this.submitBtn.disabled = true;

        try {
            await addDoc(collection(this.db, 'shared_accident_reports'), data);

            this.form.reset();
            this.setInitialDateTime();
            document.querySelectorAll('input[name="vehicles_involved"]:checked').forEach(cb => cb.checked = false);
            this.mapManager.resetFormMap();
            this.displayMessage("Registro exitoso. Nuevo accidente guardado.", true);

        } catch (error) {
            console.error("Error saving record:", error);
            this.displayMessage(`Error al guardar: ${error.message}`, false);
        } finally {
            this.submitText.textContent = 'Registrar Accidente';
            this.loadingSpinner?.classList.add('hidden');
            if (this.submitBtn) this.submitBtn.disabled = false;
        }
    }

    loadAccidentRecords() {
        if (!this.isAuthReady || !this.currentUser || !this.db) return;

        const q = query(
            collection(this.db, 'shared_accident_reports'),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(q, (snapshot) => {
            const records = [];
            snapshot.forEach((doc) => {
                records.push({ id: doc.id, ...doc.data() });
            });

            this.allAccidentRecords = records;
            this.renderRecords(records);

            if (this.accidentCount) {
                this.accidentCount.textContent = records.length;
            }

            this.mapManager.loadAccidentMarkers(records);

            if (!document.getElementById('content-estadisticas')?.classList.contains('hidden')) {
                this.renderStatistics(records);
            }
        }, (error) => {
            console.error("Error loading records:", error);
            this.displayMessage(`Error al cargar registros: ${error.message}`, false);
        });
    }

    getVehicleBadge(vehicle) {
        let color = 'bg-gray-200 text-gray-800';
        if (vehicle === 'Moto') color = 'bg-red-100 text-red-700';
        else if (vehicle === 'Bicicleta' || vehicle === 'Peatón') color = 'bg-yellow-100 text-yellow-700';
        else if (vehicle === 'Camión') color = 'bg-blue-100 text-blue-700';
        else if (vehicle === 'Camioneta') color = 'bg-purple-100 text-purple-700';
        else if (vehicle === 'Auto') color = 'bg-green-100 text-green-700';
        else if (vehicle === 'Utilitario') color = 'bg-orange-100 text-orange-700';

        return `<span class="badge ${color}">${vehicle}</span>`;
    }

    renderRecords(records) {
        if (!this.recordsList) return;

        this.recordsList.innerHTML = '';

        if (records.length === 0) {
            this.emptyState?.classList.remove('hidden');
            return;
        }
        this.emptyState?.classList.add('hidden');

        records.forEach(record => {
            const date = record.fecha ? new Date(record.fecha).toLocaleString('es-AR') : 'Fecha no especificada';
            const vehicleBadges = (record.vehicles_involved || []).map(v => this.getVehicleBadge(v)).join('');
            const recordedBy = record.recordedBy || 'Usuario no identificado';

            let severityColor = 'text-green-600';
            if (record.gravedad === 'Lesiones Leves') severityColor = 'text-yellow-600';
            else if (record.gravedad === 'Lesiones Graves') severityColor = 'text-orange-600';
            else if (record.gravedad === 'Fatal') severityColor = 'text-red-600';

            let viaHighlightClass = 'text-gray-700 font-normal';
            let recordWrapperClass = 'bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200';

            if (record.tipo_via?.includes('CON Boulevard')) {
                viaHighlightClass = 'bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold text-xs';
                recordWrapperClass = 'bg-red-50 p-3 sm:p-4 rounded-lg border-2 border-red-400 shadow-lg';
            }

            const element = document.createElement('div');
            element.className = recordWrapperClass;

            const showLocationBtn = record.latitude && record.longitude ?
                `<button onclick="showRecordOnMap(${record.latitude}, ${record.longitude}, '${record.ubicacion}')" class="text-blue-600 hover:text-blue-800 text-xs font-medium">📍 Ver en Mapa</button>` : '';

            element.innerHTML = `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 mb-2 space-y-1 sm:space-y-0">
                    <span class="text-xs sm:text-sm text-gray-400 font-medium">${date}</span>
                    <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                        <span class="font-bold text-base sm:text-lg text-gray-800">${record.ubicacion}</span>
                        ${showLocationBtn}
                    </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 text-xs sm:text-sm gap-2">
                    <p><strong>Tipo de Siniestro:</strong> ${record.tipo}</p>
                    <p><strong>Total Vehículos:</strong> ${record.vehiculos_total || 0}</p>
                    <p><strong>Gravedad:</strong> <span class="${severityColor} font-semibold">${record.gravedad}</span></p>
                    <p><strong>Vía:</strong> <span class="${viaHighlightClass}">${record.tipo_via}</span></p>
                </div>
                
                <div class="mt-3 border-t pt-2">
                    <p class="text-xs font-semibold text-gray-500 mb-1">Vehículos Implicados:</p>
                    <div class="flex flex-wrap">${vehicleBadges}</div>
                </div>

                <div class="mt-2 text-xs text-gray-500 border-t pt-2">
                    <p><strong>Registrado por:</strong> ${recordedBy}</p>
                </div>

                ${record.descripcion ? `<p class="mt-3 text-gray-600 italic text-xs sm:text-sm border-t pt-2">${record.descripcion}</p>` : ''}
            `;
            this.recordsList.appendChild(element);
        });
    }

    renderStatistics(records) {
        const total = records.length;
        this.statsLoading?.classList.add('hidden');

        if (total === 0) {
            if (this.statsLoading) this.statsLoading.textContent = "No hay suficientes registros para generar estadísticas.";
            this.statsLoading?.classList.remove('hidden');
            this.statsViaSection?.classList.add('hidden');
            this.statsGravedadSection?.classList.add('hidden');
            this.statsVehiculosSection?.classList.add('hidden');
            return;
        }

        this.statsViaSection?.classList.remove('hidden');
        this.statsGravedadSection?.classList.remove('hidden');
        this.statsVehiculosSection?.classList.remove('hidden');

        const viaCounts = records.reduce((acc, record) => {
            const key = record.tipo_via || 'Desconocido';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        if (this.chartVia) {
            this.chartVia.innerHTML = Object.entries(viaCounts).map(([via, count]) => {
                const percentage = ((count / total) * 100).toFixed(1);
                let barColor = 'bg-teal-500';
                if (via.includes('CON Boulevard')) {
                    barColor = 'bg-red-600';
                }

                return `
                    <div class="relative w-full">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-xs sm:text-sm font-medium text-gray-800">${via}</span>
                            <span class="text-xs font-semibold ${barColor.replace('bg-', 'text-')}">${count} (${percentage}%)</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-lg overflow-hidden">
                            <div class="progress-bar ${barColor}" style="width: ${percentage}%">${percentage}%</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        const gravedadOrder = ['Fatal', 'Lesiones Graves', 'Lesiones Leves', 'Sin Lesiones'];
        const gravedadCounts = records.reduce((acc, record) => {
            const key = record.gravedad || 'Desconocido';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const sortedGravedades = Object.entries(gravedadCounts).sort(([a], [b]) => gravedadOrder.indexOf(a) - gravedadOrder.indexOf(b));

        if (this.chartGravedad) {
            this.chartGravedad.innerHTML = sortedGravedades.map(([gravedad, count]) => {
                const percentage = ((count / total) * 100).toFixed(1);
                let barColor = 'bg-gray-400';
                if (gravedad === 'Fatal') barColor = 'bg-red-800';
                else if (gravedad === 'Lesiones Graves') barColor = 'bg-orange-600';
                else if (gravedad === 'Lesiones Leves') barColor = 'bg-yellow-500';
                else if (gravedad === 'Sin Lesiones') barColor = 'bg-green-600';

                return `
                    <div class="relative w-full">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-xs sm:text-sm font-medium text-gray-800">${gravedad}</span>
                            <span class="text-xs font-semibold ${barColor.replace('bg-', 'text-')}">${count} (${percentage}%)</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-lg overflow-hidden">
                            <div class="progress-bar ${barColor}" style="width: ${percentage}%">${percentage}%</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        const vehicleCounts = {};
        records.forEach(record => {
            (record.vehicles_involved || []).forEach(vehicle => {
                vehicleCounts[vehicle] = (vehicleCounts[vehicle] || 0) + 1;
            });
        });

        const totalInvolvements = Object.values(vehicleCounts).reduce((sum, count) => sum + count, 0);
        const sortedVehicles = Object.entries(vehicleCounts).sort(([, a], [, b]) => b - a);

        if (this.chartVehiculos) {
            this.chartVehiculos.innerHTML = sortedVehicles.map(([vehicle, count]) => {
                const percentage = totalInvolvements > 0 ? ((count / totalInvolvements) * 100).toFixed(1) : 0;
                let barColor = 'bg-gray-500';
                if (vehicle === 'Moto') barColor = 'bg-red-600';
                else if (vehicle === 'Bicicleta' || vehicle === 'Peatón') barColor = 'bg-yellow-600';
                else if (vehicle === 'Camión') barColor = 'bg-blue-600';
                else if (vehicle === 'Camioneta') barColor = 'bg-purple-600';
                else if (vehicle === 'Auto') barColor = 'bg-green-600';
                else if (vehicle === 'Utilitario') barColor = 'bg-orange-600';

                return `
                    <div class="relative w-full">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-xs sm:text-sm font-medium text-gray-800">${vehicle}</span>
                            <span class="text-xs font-semibold ${barColor.replace('bg-', 'text-')}">${count} (${percentage}%)</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-lg overflow-hidden">
                            <div class="progress-bar ${barColor}" style="width: ${percentage}%">${percentage}%</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    setInitialDateTime() {
        if (!this.fechaInput) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        this.fechaInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    init() {
        this.setInitialDateTime();
        this.initializeFirebase();
    }
}

window.onload = function () {
    const app = new SiniestrosApp();
    app.init();
};