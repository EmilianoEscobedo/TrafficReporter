import type { AccidentRecord } from '@/types';
import './AccidentCard.css';

interface AccidentCardProps {
    record: AccidentRecord;
    onEdit: () => void;
    onDelete: () => void;
    onOpenLightbox: (recordId: string, imageIndex: number) => void;
    onShowOnMap: (lat: number, lng: number, ubicacion: string) => void;
}

export default function AccidentCard({ record, onEdit, onDelete, onOpenLightbox, onShowOnMap }: AccidentCardProps) {
    const date = record.fecha ? new Date(record.fecha).toLocaleString('es-AR') : 'Fecha no especificada';

    const getVehicleBadgeClass = (vehicle: string): string => {
        const classes: Record<string, string> = {
            'Moto': 'accident-card__vehicle-badge--moto',
            'Bicicleta': 'accident-card__vehicle-badge--bici',
            'Peatón': 'accident-card__vehicle-badge--peaton',
            'Camión': 'accident-card__vehicle-badge--camion',
            'Camioneta': 'accident-card__vehicle-badge--camioneta',
            'Auto': 'accident-card__vehicle-badge--auto',
            'Utilitario': 'accident-card__vehicle-badge--utilitario',
        };
        return classes[vehicle] || '';
    };

    const getSeverityClass = (): string => {
        const classes: Record<string, string> = {
            'Sin Lesiones': 'accident-card__severity--sin',
            'Lesiones Leves': 'accident-card__severity--leves',
            'Lesiones Graves': 'accident-card__severity--graves',
            'Fatal': 'accident-card__severity--fatal',
        };
        return classes[record.gravedad] || '';
    };

    const isHighRisk = record.tipo_via?.includes('CON Boulevard');

    return (
        <div className={`accident-card ${isHighRisk ? 'accident-card--high-risk' : ''}`}>
            <div className="accident-card__header">
                <span className="accident-card__date">{date}</span>
                {record.latitude && record.longitude && (
                    <button
                        onClick={() => onShowOnMap(record.latitude, record.longitude, record.ubicacion)}
                        className="accident-card__map-btn"
                    >
                        📍 Ver en Mapa
                    </button>
                )}
            </div>

            <div className="accident-card__location">
                <span className="accident-card__location-text">{record.ubicacion}</span>
            </div>

            <div className="accident-card__details">
                <p><strong>Tipo de Siniestro:</strong> {record.tipo}</p>
                <p><strong>Total Vehículos:</strong> {record.vehiculos_total || 0}</p>
                <p>
                    <strong>Gravedad:</strong>{' '}
                    <span className={`accident-card__severity ${getSeverityClass()}`}>{record.gravedad}</span>
                </p>
                <p>
                    <strong>Vía:</strong>{' '}
                    <span className={isHighRisk ? 'accident-card__road--high-risk' : ''}>{record.tipo_via}</span>
                </p>
            </div>

            <div className="accident-card__vehicles">
                <p className="accident-card__vehicles-label">Vehículos Implicados:</p>
                <div className="accident-card__vehicle-badges">
                    {(record.vehicles_involved || []).map((vehicle) => (
                        <span key={vehicle} className={`accident-card__vehicle-badge ${getVehicleBadgeClass(vehicle)}`}>
                            {vehicle}
                        </span>
                    ))}
                </div>
            </div>

            {record.images && record.images.length > 0 && (
                <div className="accident-card__images">
                    {record.images.map((url, idx) => (
                        <img
                            key={idx}
                            src={url}
                            alt="Accident"
                            className="accident-card__image"
                            onClick={() => onOpenLightbox(record.id, idx)}
                        />
                    ))}
                </div>
            )}

            <div className="accident-card__footer">
                <p className="accident-card__recorded-by">
                    <strong>Registrado por:</strong> {record.recordedBy || 'Usuario no identificado'}
                </p>
            </div>

            {record.descripcion && (
                <p className="accident-card__description">{record.descripcion}</p>
            )}

            <div className="accident-card__actions">
                <button onClick={onEdit} className="accident-card__action-btn accident-card__action-btn--edit" title="Editar">
                    ✏️
                </button>
                <button onClick={onDelete} className="accident-card__action-btn accident-card__action-btn--delete" title="Eliminar">
                    🗑️
                </button>
            </div>
        </div>
    );
}
