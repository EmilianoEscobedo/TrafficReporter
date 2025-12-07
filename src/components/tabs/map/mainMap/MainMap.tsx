import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { exportMapToHTML } from '@/services/export';
import { showToast } from '@/utils/sweetalert';
import type { AccidentRecord } from '@/types';
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
    const [filterFatal, setFilterFatal] = useState(false);
    const [openPopupId, setOpenPopupId] = useState<string | null>(null);
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

    const getMarkerColor = (gravedad: string): string => {
        const colors: Record<string, string> = {
            'Fatal': '#DC2626',
            'Lesiones Graves': '#EA580C',
            'Lesiones Leves': '#D97706',
            'Sin Lesiones': '#059669',
        };
        return colors[gravedad] || '#6B7280';
    };

    const handleExportMap = () => {
        exportMapToHTML(filteredAccidents);
        showToast('Mapa exportado exitosamente', 'success');
    };

    const filteredAccidents = filterFatal
        ? accidents.filter((a) => a.gravedad === 'Fatal')
        : accidents;

    return (
        <div className="main-map">
            <div className="main-map__header">
                <h2 className="main-map__title">Mapa de Accidentes</h2>
                <div className="main-map__actions">
                    <button
                        onClick={() => setFilterFatal(false)}
                        className="main-map__filter-btn main-map__filter-btn--all"
                    >
                        Mostrar Todos
                    </button>
                    <button
                        onClick={() => setFilterFatal(true)}
                        className="main-map__filter-btn main-map__filter-btn--fatal"
                    >
                        Solo Fatales
                    </button>
                    <button
                        onClick={handleExportMap}
                        className="main-map__export-btn"
                        title="Exportar mapa como HTML interactivo"
                    >
                        📥 Exportar Mapa
                    </button>
                </div>
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
                                        {record.descripcion && <p><strong>📝 Notas:</strong> {record.descripcion}</p>}
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
