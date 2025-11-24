import {initializeApp} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    addDoc,
    collection,
    getFirestore,
    onSnapshot,
    query,
    serverTimestamp,
    setLogLevel
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

setLogLevel('Debug');

function getEnvironmentVars() {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    let firebaseConfig = {};
    let initialAuthToken = null;

    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        initialAuthToken = __initial_auth_token;
    }

    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        try {
            if (typeof __firebase_config === 'string') {
                firebaseConfig = JSON.parse(__firebase_config);
            } else if (typeof __firebase_config === 'object') {
                firebaseConfig = __firebase_config;
            } else {
                console.error("ERROR: __firebase_config no es una cadena ni un objeto válido. Tipo:", typeof __firebase_config);
            }
        } catch (e) {
            console.error("Error Crítico al intentar parsear __firebase_config como JSON:", e, "Valor recibido:", __firebase_config);
            displayMessage("Error Crítico: La configuración de Firebase está corrupta. No se puede conectar.", false);
        }
    }

    return { appId, firebaseConfig, initialAuthToken };
}

const { appId, firebaseConfig, initialAuthToken } = getEnvironmentVars();

const form = document.getElementById('accident-form');
const recordsList = document.getElementById('records-list');
const accidentCount = document.getElementById('accident-count');
const userIdDisplay = document.getElementById('user-id');
const emptyState = document.getElementById('empty-state');
const submitBtn = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const loadingSpinner = document.getElementById('loading-spinner');
const messageArea = document.getElementById('message-area');
const fechaInput = document.getElementById('fecha');
const statsLoading = document.getElementById('stats-loading');
const statsViaSection = document.getElementById('stats-via');
const statsGravedadSection = document.getElementById('stats-gravedad');
const statsVehiculosSection = document.getElementById('stats-vehiculos');
const chartVia = document.getElementById('chart-via');
const chartGravedad = document.getElementById('chart-gravedad');
const chartVehiculos = document.getElementById('chart-vehiculos');

let app;
let db;
let auth;
let currentUserId = null;
let isAuthReady = false;
let allAccidentRecords = [];

function displayMessage(text, isSuccess = true) {
    messageArea.textContent = text;
    messageArea.classList.remove('hidden', 'message-success', 'message-error');
    if (isSuccess) {
        messageArea.classList.add('message-success');
        messageArea.classList.remove('message-error');
    } else {
        messageArea.classList.add('message-error');
        messageArea.classList.remove('message-success');
    }
    setTimeout(() => {
        messageArea.classList.add('hidden');
    }, 8000);
}

window.showTab = function(tabName) {
    const tabs = ['registro', 'estadisticas'];
    tabs.forEach(tab => {
        document.getElementById(`content-${tab}`).classList.add('hidden');
        document.getElementById(`tab-${tab}`).classList.remove('border-teal-500', 'text-teal-600');
        document.getElementById(`tab-${tab}`).classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    });

    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('border-teal-500', 'text-teal-600');
    document.getElementById(`tab-${tabName}`).classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');

    if (tabName === 'estadisticas') {
        renderStatistics(allAccidentRecords);
    }
}

async function initializeFirebase() {
    try {
        if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.apiKey) {
            console.error("FATAL ERROR: Firebase Config is incomplete or missing. Cannot connect to database.");
            userIdDisplay.textContent = 'ERROR_CONFIG';
            displayMessage("Error Crítico: La configuración de la base de datos no está disponible. Los datos no se guardarán.", false);
            return;
        }

        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUserId = user.uid;
                userIdDisplay.textContent = currentUserId;
                isAuthReady = true;
                console.log("Auth State Changed: Usuario autenticado. UserID:", currentUserId);
                loadAccidentRecords();
            } else {
                currentUserId = null;
                userIdDisplay.textContent = 'Auth en Progreso/Falló';
                isAuthReady = false;
                console.log("Auth State Changed: Usuario desautenticado/anónimo.");
            }
        });

        if (initialAuthToken) {
            try {
                await signInWithCustomToken(auth, initialAuthToken);
                console.log("Autenticación con Custom Token exitosa.");
            } catch(e) {
                console.warn("Fallo signInWithCustomToken, intentando signInAnonymously:", e);
                await signInAnonymously(auth);
                console.log("Autenticación anónima fallback exitosa.");
            }
        } else {
            await signInAnonymously(auth);
            console.log("Autenticación anónima directa exitosa.");
        }

    } catch (error) {
        console.error("Error al inicializar o autenticar en Firebase:", error);
        displayMessage(`Error Crítico de DB: ${error.message}. Verifica las reglas de seguridad.`, false);
        userIdDisplay.textContent = 'FALLO_CRÍTICO';
        isAuthReady = false;
    }
}

function getSelectedVehicles() {
    const checkboxes = document.querySelectorAll('input[name="vehicles_involved"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isAuthReady || !currentUserId || !db) {
        console.error("Firebase no está listo. isAuthReady:", isAuthReady, " currentUserId:", currentUserId);
        displayMessage("Base de datos no disponible. Por favor, espera o recarga la página. Revisar la consola para ver errores de autenticación.", false);
        return;
    }

    const selectedVehicles = getSelectedVehicles();
    if (selectedVehicles.length === 0) {
        displayMessage("Por favor, selecciona al menos un tipo de vehículo implicado.", false);
        return;
    }

    const tipoVia = document.getElementById('tipo_via').value;
    const tipoSiniestro = document.getElementById('tipo').value;
    const gravedad = document.getElementById('gravedad').value;
    if (!tipoVia || !tipoSiniestro || !gravedad) {
        displayMessage("Por favor, completa todos los campos obligatorios del formulario (Tipo de Vía, Tipo de Siniestro, Gravedad).", false);
        return;
    }

    const formData = new FormData(form);

    const vehiculosTotalValue = formData.get('vehiculos_total');

    const data = {
        fecha: formData.get('fecha'),
        ubicacion: formData.get('ubicacion'),
        tipo_via: tipoVia,
        tipo: tipoSiniestro,
        gravedad: gravedad,
        vehiculos_total: parseInt(vehiculosTotalValue || '0'),
        vehicles_involved: selectedVehicles,
        descripcion: formData.get('descripcion'),
        createdAt: serverTimestamp(),
        recordedBy: currentUserId,
    };

    submitText.textContent = 'Guardando...';
    loadingSpinner.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        const collectionPath = `artifacts/${appId}/users/${currentUserId}/accident_records`;
        await addDoc(collection(db, collectionPath), data);

        form.reset();
        setInitialDateTime();
        document.querySelectorAll('input[name="vehicles_involved"]:checked').forEach(cb => cb.checked = false);

        displayMessage(`Registro exitoso. Nuevo accidente guardado.`, true);

    } catch (error) {
        console.error("Error al agregar documento:", error);
        displayMessage(`Error al guardar: ${error.message}. Esto puede ser un problema de permisos.`, false);

    } finally {
        submitText.textContent = 'Registrar Accidente';
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
});

function loadAccidentRecords() {
    if (!isAuthReady || !currentUserId || !db) return;

    const collectionPath = `artifacts/${appId}/users/${currentUserId}/accident_records`;
    const q = query(collection(db, collectionPath));

    onSnapshot(q, (snapshot) => {
        const records = [];
        snapshot.forEach((doc) => {
            records.push({ id: doc.id, ...doc.data() });
        });

        allAccidentRecords = records;

        records.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });

        renderRecords(records);
        accidentCount.textContent = records.length;

        if (!document.getElementById('content-estadisticas').classList.contains('hidden')) {
            renderStatistics(records);
        }
    }, (error) => {
        console.error("Error al escuchar los registros:", error);
        displayMessage(`Error al cargar registros: ${error.message}. Revisa la consola.`, false);
    });
}

function getVehicleBadge(vehicle) {
    let color = 'bg-gray-200 text-gray-800';
    if (vehicle === 'Moto') color = 'bg-red-100 text-red-700';
    else if (vehicle === 'Bicicleta' || vehicle === 'Peatón') color = 'bg-yellow-100 text-yellow-700';
    else if (vehicle === 'Camión') color = 'bg-blue-100 text-blue-700';
    else if (vehicle === 'Camioneta') color = 'bg-purple-100 text-purple-700';
    else if (vehicle === 'Auto') color = 'bg-green-100 text-green-700';

    return `<span class="badge ${color}">${vehicle}</span>`;
}

function renderRecords(records) {
    recordsList.innerHTML = '';

    if (records.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    records.forEach(record => {
        const date = record.fecha ? new Date(record.fecha).toLocaleString('es-AR') : 'Fecha no especificada';
        const vehicleBadges = (record.vehicles_involved || []).map(getVehicleBadge).join('');

        let severityColor = 'text-green-600';
        if (record.gravedad === 'Lesiones Leves') severityColor = 'text-yellow-600';
        else if (record.gravedad === 'Lesiones Graves') severityColor = 'text-orange-600';
        else if (record.gravedad === 'Fatal') severityColor = 'text-red-600';

        let viaHighlightClass = 'text-gray-700 font-normal';
        let recordWrapperClass = 'bg-gray-50 p-4 rounded-lg border border-gray-200';

        if (record.tipo_via && record.tipo_via.includes('CON Boulevard')) {
            viaHighlightClass = 'bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold text-xs';
            recordWrapperClass = 'bg-red-50 p-4 rounded-lg border-2 border-red-400 shadow-lg';
        }

        const element = document.createElement('div');
        element.className = recordWrapperClass;

        element.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 mb-2">
                <span class="text-sm text-gray-400 font-medium">${date}</span>
                <span class="font-bold text-lg text-gray-800">${record.ubicacion}</span>
            </div>
            
            <div class="grid grid-cols-2 text-sm gap-2">
                <p><strong>Tipo de Siniestro:</strong> ${record.tipo}</p>
                <p><strong>Total Vehículos:</strong> ${record.vehiculos_total || 0}</p>
                <p><strong>Gravedad:</strong> <span class="${severityColor} font-semibold">${record.gravedad}</span></p>
                <p><strong>Vía:</strong> <span class="${viaHighlightClass}">${record.tipo_via}</span></p>
            </div>
            
            <div class="mt-3 border-t pt-2">
                <p class="text-xs font-semibold text-gray-500 mb-1">Vehículos Implicados:</p>
                <div class="flex flex-wrap">${vehicleBadges}</div>
            </div>

            ${record.descripcion ? `<p class="mt-3 text-gray-600 italic text-sm border-t pt-2 mt-2">${record.descripcion}</p>` : ''}
        `;
        recordsList.appendChild(element);
    });
}

function renderStatistics(records) {
    const total = records.length;
    statsLoading.classList.add('hidden');

    if (total === 0) {
        statsLoading.textContent = "No hay suficientes registros para generar estadísticas.";
        statsLoading.classList.remove('hidden');
        statsViaSection.classList.add('hidden');
        statsGravedadSection.classList.add('hidden');
        statsVehiculosSection.classList.add('hidden');
        return;
    }

    statsViaSection.classList.remove('hidden');
    statsGravedadSection.classList.remove('hidden');
    statsVehiculosSection.classList.remove('hidden');

    const viaCounts = records.reduce((acc, record) => {
        const key = record.tipo_via || 'Desconocido';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    chartVia.innerHTML = Object.entries(viaCounts).map(([via, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        let barColor = 'bg-teal-500';
        if (via.includes('CON Boulevard')) {
            barColor = 'bg-red-600';
        }

        return `
            <div class="relative w-full">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-gray-800">${via}</span>
                    <span class="text-xs font-semibold ${barColor.replace('bg-', 'text-')}">${count} (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-lg overflow-hidden">
                    <div class="progress-bar ${barColor}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    const gravedadOrder = ['Fatal', 'Lesiones Graves', 'Lesiones Leves', 'Sin Lesiones'];
    const gravedadCounts = records.reduce((acc, record) => {
        const key = record.gravedad || 'Desconocido';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const sortedGravedades = Object.entries(gravedadCounts).sort(([a], [b]) => gravedadOrder.indexOf(a) - gravedadOrder.indexOf(b));

    chartGravedad.innerHTML = sortedGravedades.map(([gravedad, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        let barColor = 'bg-gray-400';
        if (gravedad === 'Fatal') barColor = 'bg-red-800';
        else if (gravedad === 'Lesiones Graves') barColor = 'bg-orange-600';
        else if (gravedad === 'Lesiones Leves') barColor = 'bg-yellow-500';
        else if (gravedad === 'Sin Lesiones') barColor = 'bg-green-600';

        return `
            <div class="relative w-full">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-gray-800">${gravedad}</span>
                    <span class="text-xs font-semibold ${barColor.replace('bg-', 'text-')}">${count} (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-lg overflow-hidden">
                    <div class="progress-bar ${barColor}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    const vehicleCounts = {};
    records.forEach(record => {
        (record.vehicles_involved || []).forEach(vehicle => {
            vehicleCounts[vehicle] = (vehicleCounts[vehicle] || 0) + 1;
        });
    });

    const totalInvolvements = Object.values(vehicleCounts).reduce((sum, count) => sum + count, 0);

    const sortedVehicles = Object.entries(vehicleCounts).sort(([, a], [, b]) => b - a);

    chartVehiculos.innerHTML = sortedVehicles.map(([vehicle, count]) => {
        const percentage = ((count / totalInvolvements) * 100).toFixed(1);
        let barColor = 'bg-gray-500';
        if (vehicle === 'Moto') barColor = 'bg-red-600';
        else if (vehicle === 'Bicicleta' || vehicle === 'Peatón') barColor = 'bg-yellow-600';
        else if (vehicle === 'Camión') barColor = 'bg-blue-600';
        else if (vehicle === 'Camioneta') barColor = 'bg-purple-600';
        else if (vehicle === 'Auto') barColor = 'bg-green-600';

        return `
            <div class="relative w-full">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-gray-800">${vehicle}</span>
                    <span class="text-xs font-semibold ${barColor.replace('bg-', 'text-')}">${count} Implicaciones (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-lg overflow-hidden">
                    <div class="progress-bar ${barColor}" style="width: ${percentage}%">${vehicle}</div>
                </div>
            </div>
        `;
    }).join('');
}

function setInitialDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    fechaInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

window.onload = function () {
    setInitialDateTime();
    initializeFirebase();
};