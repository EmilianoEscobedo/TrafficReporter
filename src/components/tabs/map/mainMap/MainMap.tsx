import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { exportMapToHTML } from '@/services/export';
import { showToast } from '@/utils/sweetalert';
import type { AccidentRecord, FilterState } from '@/types';
import 'leaflet/dist/leaflet.css';
import './MainMap.css';

interface MainMapProps {
    accidents: AccidentRecord[];
    onOpenLightbox?: (recordId: string, imageIndex: number) => void;
    targetLocation?: { lat: number; lng: number; ubicacion: string } | null;
}

function MapViewController({ targetLocation }: { targetLocation: MainMapProps['targetLocation'] }) {
    const map = useMap();
    const prevTargetRef = useRef<typeof targetLocation>(null);

    useEffect(() => {
        if (targetLocation && targetLocation !== prevTargetRef.current) {
            map.setView([targetLocation.lat, targetLocation.lng], 17, {
                animate: true,
            });
            prevTargetRef.current = targetLocation;
        }
    }, [targetLocation, map]);

    return null;
}

export default function MainMap({ accidents, onOpenLightbox, targetLocation }: MainMapProps) {
    const [openPopupId, setOpenPopupId] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(true);
    const [filters, setFilters] = useState<FilterState>({
        startDate: '',
        endDate: '',
        vehicle: '',
        severity: '',
        road: '',
    });

    const defaultCenter: [number, number] = [-35.44451575376546, -60.884165667793056];
    const defaultZoom = 13;

    useEffect(() => {
        if (targetLocation) {
            const targetRecord = accidents.find(
                (a) => a.latitude === targetLocation.lat && a.longitude === targetLocation.lng
            );
            if (targetRecord) {
                setOpenPopupId(targetRecord.id);
                setTimeout(() => setOpenPopupId(null), 100);
                setTimeout(() => setOpenPopupId(targetRecord.id), 150);
            }
        }
    }, [targetLocation, accidents]);

    const filteredAccidents = useMemo(() => {
        return accidents.filter((record) => {
            if (record.fecha) {
                const recordDate = new Date(record.fecha);
                if (filters.startDate) {
                    const start = new Date(`${filters.startDate}T00:00:00`);
                    if (recordDate < start) return false;
                }
                if (filters.endDate) {
                    const end = new Date(`${filters.endDate}T23:59:59.999`);
                    if (recordDate > end) return false;
                }
            } else {
                return false;
            }

            if (filters.vehicle && (!record.vehicles_involved || !record.vehicles_involved.includes(filters.vehicle))) {
                return false;
            }

            if (filters.severity && record.gravedad !== filters.severity) {
                return false;
            }

            if (filters.road && record.tipo_via !== filters.road) {
                return false;
            }

            return true;
        });
    }, [accidents, filters]);

    const getMarkerColor = (gravedad: string): string => {
        const colors: Record<string, string> = {
            'Fatal': '#DC2626',
            'Lesiones Graves': '#EA580C',
            'Lesiones Leves': '#D97706',
            'Sin Lesiones': '#059669',
        };
        return colors[gravedad] || '#6B7280';
    };

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            vehicle: '',
            severity: '',
            road: '',
        });
    };

    const handleExportMap = () => {
        exportMapToHTML(filteredAccidents, showDetails);
        showToast('Mapa exportado exitosamente', 'success');
    };

    return (
        <div className="main-map">
            <div className="main-map__header">
                <h2 className="main-map__title">Mapa de Accidentes</h2>
                <button
                    onClick={handleExportMap}
                    className="main-map__export-btn"
                    title="Exportar mapa como HTML interactivo"
                >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar Mapa
                </button>
            </div>

            <div className="main-map__filters">
                <span className="main-map__filters-label">Filtrar:</span>
                <div className="main-map__date-range">
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="main-map__filter-input"
                    />
                    <span>-</span>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="main-map__filter-input"
                    />
                </div>
                <select
                    value={filters.vehicle}
                    onChange={(e) => handleFilterChange('vehicle', e.target.value)}
                    className="main-map__filter-select"
                >
                    <option value="">Vehículo...</option>
                    <option value="Auto">Auto</option>
                    <option value="Moto">Moto</option>
                    <option value="Camioneta">Camioneta</option>
                    <option value="Utilitario">Utilitario</option>
                    <option value="Camión">Camión</option>
                    <option value="Bicicleta">Bicicleta</option>
                    <option value="Peatón">Peatón</option>
                    <option value="Animal">Animal</option>
                </select>
                <select
                    value={filters.severity}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                    className="main-map__filter-select"
                >
                    <option value="">Gravedad...</option>
                    <option value="Sin Lesiones">Sin Lesiones</option>
                    <option value="Lesiones Leves">Lesiones Leves</option>
                    <option value="Lesiones Graves">Lesiones Graves</option>
                    <option value="Fatal">Fatal</option>
                </select>
                <select
                    value={filters.road}
                    onChange={(e) => handleFilterChange('road', e.target.value)}
                    className="main-map__filter-select"
                >
                    <option value="">Vía...</option>
                    <option value="Calle/Pasaje simple">Calle/Pasaje simple</option>
                    <option value="Avenida SIN Boulevard">Avenida SIN Boulevard</option>
                    <option value="Avenida CON Boulevard ">Avenida CON Boulevard</option>
                </select>
                <label className="main-map__toggle">
                    <input
                        type="checkbox"
                        checked={showDetails}
                        onChange={(e) => setShowDetails(e.target.checked)}
                        className="main-map__toggle-input"
                    />
                    <span className="main-map__toggle-track">
                        <span className="main-map__toggle-thumb" />
                    </span>
                    <span className="main-map__toggle-label">Incluir Detalles</span>
                </label>
                <button onClick={handleClearFilters} className="statistics-panel__clear-btn">
                    Limpiar Filtros
                </button>
            </div>

            <div className="main-map__container">
                <MapContainer center={defaultCenter} zoom={defaultZoom} className="main-map__map">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapViewController targetLocation={targetLocation} />
                    {filteredAccidents.map((record) => {
                        if (!record.latitude || !record.longitude) return null;

                        const color = getMarkerColor(record.gravedad);
                        const date = record.fecha
                            ? new Date(record.fecha).toLocaleString('es-AR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                            : 'Fecha no especificada';

                        return (
                            <CircleMarker
                                key={record.id}
                                center={[record.latitude, record.longitude]}
                                radius={8}
                                fillColor={color}
                                color="#ffffff"
                                weight={2}
                                opacity={1}
                                fillOpacity={0.8}
                                eventHandlers={{
                                    add: (e) => {
                                        if (openPopupId === record.id) {
                                            e.target.openPopup();
                                        }
                                    }
                                }}
                            >
                                <Popup maxWidth={300}>
                                    <div className="accident-popup">
                                        <h4>🚨 {record.ubicacion || 'Ubicación no disponible'}</h4>
                                        <p><strong>📅 Fecha:</strong> {date}</p>
                                        <p><strong>🚗 Tipo:</strong> {record.tipo}</p>
                                        <p><strong>⚠️ Gravedad:</strong> <span className={`severity-badge severity-${record.gravedad.toLowerCase().replace(/ /g, '-')}`}>{record.gravedad}</span></p>
                                        <p><strong>🛣️ Vía:</strong> {record.tipo_via}</p>
                                        <p><strong>🚙 Vehículos:</strong> {record.vehiculos_total || 0}</p>
                                        {record.vehicles_involved && record.vehicles_involved.length > 0 && (
                                            <p>
                                                <strong>📋 Involucrados:</strong><br />
                                                {record.vehicles_involved.map((v) => (
                                                    <span key={v} className="vehicle-badge">{v}</span>
                                                ))}
                                            </p>
                                        )}
                                        {record.images && record.images.length > 0 && onOpenLightbox && (
                                            <div className="popup-images">
                                                {record.images.map((url, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={url}
                                                        alt="Accident"
                                                        className="popup-image"
                                                        onClick={() => onOpenLightbox(record.id, idx)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {showDetails && record.descripcion && <p><strong>📝 Notas:</strong> {record.descripcion}</p>}
                                        <p className="popup-footer"><strong>Registrado por:</strong> {record.recordedBy || 'N/A'}</p>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>
            </div>

            <div className="main-map__legend">
                <div className="main-map__legend-item">
                    <div className="main-map__legend-color main-map__legend-color--fatal"></div>
                    <span>Fatal</span>
                </div>
                <div className="main-map__legend-item">
                    <div className="main-map__legend-color main-map__legend-color--grave"></div>
                    <span>Lesiones Graves</span>
                </div>
                <div className="main-map__legend-item">
                    <div className="main-map__legend-color main-map__legend-color--leve"></div>
                    <span>Lesiones Leves</span>
                </div>
                <div className="main-map__legend-item">
                    <div className="main-map__legend-color main-map__legend-color--sin"></div>
                    <span>Sin Lesiones</span>
                </div>
            </div>
        </div>
    );
};
