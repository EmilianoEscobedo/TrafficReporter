import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import GeocodingService from '@/services/geocoding';
import { showError, showWarning } from '@/utils/sweetalert';
import type { MapLocation } from '@/types';
import 'leaflet/dist/leaflet.css';
import './FormMap.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FormMapProps {
    selectedLocation: MapLocation | null;
    onLocationSelect: (location: MapLocation) => void;
    address: string;
    onAddressChange: (address: string) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (location: MapLocation) => void }) {
    useMapEvents({
        click: (e) => {
            onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

function MapController({ selectedLocation }: { selectedLocation: MapLocation | null }) {
    const map = useMap();

    useEffect(() => {
        if (selectedLocation) {
            map.setView([selectedLocation.lat, selectedLocation.lng], 16, {
                animate: true,
            });
        }
    }, [selectedLocation, map]);

    return null;
}

export default function FormMap({ selectedLocation, onLocationSelect, onAddressChange }: FormMapProps) {
    const [manualAddress, setManualAddress] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [displayAddress, setDisplayAddress] = useState('La dirección aparecerá aquí cuando seleccione una ubicación');
    const [coords, setCoords] = useState('Seleccione una ubicación en el mapa');

    const defaultCenter: [number, number] = [-35.44451575376546, -60.884165667793056];
    const defaultZoom = 13;

    useEffect(() => {
        if (selectedLocation) {
            setCoords(`Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}`);
            fetchAddress(selectedLocation.lat, selectedLocation.lng);
        }
    }, [selectedLocation]);

    const fetchAddress = async (lat: number, lng: number) => {
        setDisplayAddress('Obteniendo dirección...');
        try {
            const addr = await GeocodingService.reverseGeocode(lat, lng);
            setDisplayAddress(addr);
            setManualAddress(addr);
            onAddressChange(addr);
        } catch (error) {
            const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setDisplayAddress(fallback);
            setManualAddress(fallback);
            onAddressChange(fallback);
        }
    };

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    onLocationSelect(location);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    showError('No se pudo obtener tu ubicación. Selecciona manualmente en el mapa.');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000,
                }
            );
        } else {
            showError('La geolocalización no está soportada en este navegador.');
        }
    };

    const handleSearchAddress = async () => {
        if (!manualAddress.trim()) {
            showWarning('Por favor ingresa una dirección.');
            return;
        }

        setIsSearching(true);
        const query = `${manualAddress}, 9 de Julio, Buenos Aires, Argentina`;

        try {
            const result = await GeocodingService.forwardGeocode(query);
            if (result) {
                const location = {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                };
                onLocationSelect(location);
            } else {
                showError('No se pudo encontrar la dirección.');
            }
        } catch (error) {
            console.error('Error searching address:', error);
            showError('Error al buscar la dirección.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchAddress();
        }
    };

    return (
        <div className="form-map">
            <div className="form-map__header">
                <label className="form-map__label">Seleccione una ubicación en el mapa:</label>
                <button type="button" onClick={handleLocateMe} className="form-map__locate-btn">
                    📍 Mi Ubicación
                </button>
            </div>

            <div className="form-map__search">
                <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => {
                        setManualAddress(e.target.value);
                        onAddressChange(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: Lagos 999"
                    className="form-map__search-input"
                />
                <button
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={isSearching}
                    className="form-map__search-btn"
                >
                    {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
            </div>

            <div className="form-map__container">
                <MapContainer
                    center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter}
                    zoom={selectedLocation ? 16 : defaultZoom}
                    className="form-map__map"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController selectedLocation={selectedLocation} />
                    <MapClickHandler onLocationSelect={onLocationSelect} />
                    {selectedLocation && <Marker position={[selectedLocation.lat, selectedLocation.lng]} />}
                </MapContainer>
            </div>

            <div className="form-map__info">
                <div className="form-map__coords">{coords}</div>
                <div className="form-map__address">{displayAddress}</div>
            </div>
        </div>
    );
}
