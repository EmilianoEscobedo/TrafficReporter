import type { AccidentRecord } from '@/types';
import { showWarning, showError } from '@/utils/sweetalert';

export const exportToCSV = (records: AccidentRecord[]): void => {
    if (records.length === 0) {
        showWarning('No hay datos para exportar.');
        return;
    }

    const headers = [
        'Fecha',
        'Ubicación',
        'Tipo de Siniestro',
        'Gravedad',
        'Tipo de Vía',
        'Total Vehículos',
        'Vehículos Involucrados',
        'Descripción',
        'Registrado Por',
        'Imágenes'
    ];

    const rows = records.map(record => {
        const date = record.fecha ? new Date(record.fecha).toLocaleString('es-AR') : 'N/A';
        const vehicles = (record.vehicles_involved || []).join('; ');
        const description = (record.descripcion || '').replace(/(\r\n|\n|\r)/gm, ' ');
        const images = (record.images || []).join('; ');

        return [
            `"${date}"`,
            `"${record.ubicacion || ''}"`,
            `"${record.tipo || ''}"`,
            `"${record.gravedad || ''}"`,
            `"${record.tipo_via || ''}"`,
            `"${record.vehiculos_total || 0}"`,
            `"${vehicles}"`,
            `"${description}"`,
            `"${record.recordedBy || ''}"`,
            `"${images}"`
        ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `siniestros_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportStatisticsToPDF = async (
    elementId: string,
    startDate: string,
    endDate: string
): Promise<void> => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalWidth = element.style.width;
    const originalMargin = element.style.margin;

    element.style.width = '670px';
    element.style.margin = '0';

    const hiddenSections = element.querySelectorAll('.hidden');
    hiddenSections.forEach(el => el.classList.remove('hidden'));

    const loadingMsg = document.getElementById('stats-loading');
    if (loadingMsg) loadingMsg.style.display = 'none';

    const headerId = 'temp-pdf-header';
    let headerDiv = document.getElementById(headerId);
    if (!headerDiv) {
        headerDiv = document.createElement('div');
        headerDiv.id = headerId;
        headerDiv.className = 'mb-6';

        const title = document.createElement('h1');
        title.className = 'text-2xl font-bold text-gray-800 mb-2 border-b-2 border-teal-500 pb-2';
        title.textContent = 'Estadísticas de Siniestros Viales';

        const subtitle = document.createElement('p');
        subtitle.className = 'text-sm text-gray-500';
        subtitle.textContent = 'Registro de Siniestros Viales - DOE Prensa';

        const subtitle1 = document.createElement('p');
        subtitle1.className = 'text-sm text-gray-600 mb-1';

        const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y}`;
        };

        if (!startDate && !endDate) {
            subtitle1.textContent = 'Histórico';
        } else {
            const s = startDate ? formatDate(startDate) : 'Inicio';
            const e = endDate ? formatDate(endDate) : 'Presente';
            subtitle1.textContent = `Desde ${s} al ${e}`;
        }

        headerDiv.appendChild(title);
        headerDiv.appendChild(subtitle);
        headerDiv.appendChild(subtitle1);
        element.prepend(headerDiv);
    }

    const opt = {
        margin: 0.5,
        filename: `estadisticas_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    window.scrollTo(0, 0);

    try {
        await (window as any).html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error('Error exporting PDF:', err);
        showError('Error al generar el PDF.');
    } finally {
        element.style.width = originalWidth;
        element.style.margin = originalMargin;
        hiddenSections.forEach(el => el.classList.add('hidden'));
        if (loadingMsg) loadingMsg.style.display = '';
        if (headerDiv) headerDiv.remove();
    }
};

export const exportMapToPDF = async (elementId: string): Promise<void> => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const actions = document.getElementById('map-actions');
    const mapTitle = element.querySelector('h2');

    if (actions) actions.style.display = 'none';

    const originalTitleClass = mapTitle?.className;
    if (mapTitle) {
        mapTitle.className = 'text-2xl font-bold text-gray-800 mb-2 border-b-2 border-teal-500 pb-2';
    }

    element.scrollIntoView();

    const opt = {
        margin: 0.2,
        filename: `mapa_siniestros_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    setTimeout(async () => {
        try {
            await (window as any).html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error('Error exporting Map PDF:', err);
            showError('Error al generar el PDF del mapa.');
        } finally {
            if (actions) actions.style.display = 'flex';
            if (mapTitle && originalTitleClass) mapTitle.className = originalTitleClass;
        }
    }, 500);
};

export const exportMapToHTML = (records: AccidentRecord[]): void => {
    if (records.length === 0) {
        showWarning('No hay accidentes para exportar en el mapa.');
        return;
    }

    const getSeverityColor = (severity: string): string => {
        if (severity === 'Fatal') return '#dc2626';
        if (severity === 'Lesiones Graves') return '#ea580c';
        if (severity === 'Lesiones Leves') return '#eab308';
        return '#22c55e';
    };

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const escapeHtml = (text: string): string => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const markers = records.map(record => {
        const vehicles = (record.vehicles_involved || []).join(', ');
        const popupContent = `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${escapeHtml(record.tipo || 'Siniestro')}</h3>
                <p style="margin: 4px 0; font-size: 12px; color: #4b5563;"><strong>Fecha:</strong> ${formatDate(record.fecha)}</p>
                <p style="margin: 4px 0; font-size: 12px; color: #4b5563;"><strong>Ubicación:</strong> ${escapeHtml(record.ubicacion || 'N/A')}</p>
                <p style="margin: 4px 0; font-size: 12px; color: #4b5563;"><strong>Gravedad:</strong> ${escapeHtml(record.gravedad || 'N/A')}</p>
                <p style="margin: 4px 0; font-size: 12px; color: #4b5563;"><strong>Tipo de Vía:</strong> ${escapeHtml(record.tipo_via || 'N/A')}</p>
                <p style="margin: 4px 0; font-size: 12px; color: #4b5563;"><strong>Vehículos:</strong> ${escapeHtml(vehicles || 'N/A')}</p>
                ${record.descripcion ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">${escapeHtml(record.descripcion)}</p>` : ''}
            </div>
        `;

        return {
            lat: record.latitude,
            lng: record.longitude,
            popup: popupContent.replace(/\n/g, ''),
            color: getSeverityColor(record.gravedad || '')
        };
    });

    const htmlContent = `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mapa de Accidentes Viales</title>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background-color: #f7f9fb;
                }
                .header {
                    background-color: white;
                    padding: 2rem 1.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    border-bottom: 4px solid #0f766e;
                }
                .header h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 0.5rem;
                }
                .header p {
                    font-size: 1rem;
                    color: #6b7280;
                }
                #map {
                    height: calc(100vh - 140px);
                    width: 100%;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 8px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Mapa de Accidentes Viales</h1>
                <p>Registro de Siniestros Viales - DOE Prensa</p>
            </div>
            <div id="map"></div>
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <script>
                const map = L.map('map').setView([-27.4692, -58.8306], 13);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(map);

                const markers = ${JSON.stringify(markers)};

                markers.forEach(marker => {
                    L.circleMarker([marker.lat, marker.lng], {
                        radius: 8,
                        fillColor: marker.color,
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    })
                    .bindPopup(marker.popup)
                    .addTo(map);
                });

                if (markers.length > 0) {
                    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            </script>
        </body>
        </html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mapa_accidentes_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
