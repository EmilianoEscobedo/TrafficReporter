class MapManager {
    constructor() {
        this.formMap = null;
        this.mainMap = null;
        this.selectedLatLng = null;
        this.accidentMarkers = [];
        this.defaultLat = -34.6118;
        this.defaultLng = -58.3960;
        this.defaultZoom = 13;

        // Resize observer to fix partial loading/grey tiles
        this.resizeObserver = new ResizeObserver(() => {
            this.invalidateSize();
        });
    }

    initializeMaps() {
        this.initFormMap();
        this.initMainMap();
    }

    initFormMap() {
        const formMapElement = document.getElementById('form-map');
        if (!this.formMap && formMapElement) {
            this.formMap = L.map('form-map').setView([this.defaultLat, this.defaultLng], this.defaultZoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.formMap);

            this.formMap.on('click', async (e) => {
                this.selectedLatLng = e.latlng;

                // Show temporary marker while loading
                this.formMap.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        this.formMap.removeLayer(layer);
                    }
                });

                const tempMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(this.formMap);
                const address = await this.updateSelectedLocation(e.latlng);

                // Update marker with address
                tempMarker.bindPopup(address || '📍 Ubicación seleccionada').openPopup();
            });

            // Observe for size changes
            this.resizeObserver.observe(formMapElement);
        }
    }

    initMainMap() {
        const mainMapElement = document.getElementById('main-map');
        if (!this.mainMap && mainMapElement) {
            this.mainMap = L.map('main-map').setView([this.defaultLat, this.defaultLng], this.defaultZoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.mainMap);

            // Observe for size changes
            this.resizeObserver.observe(mainMapElement);
        }
    }

    async updateSelectedLocation(latlng) {
        const coordsSpan = document.getElementById('selected-coords');
        const addressSpan = document.getElementById('selected-address');
        const hiddenLocationInput = document.getElementById('ubicacion');
        let addressResult = '';

        if (coordsSpan) {
            coordsSpan.textContent = `Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`;
        }

        if (addressSpan) {
            addressSpan.textContent = 'Obteniendo dirección...';
            addressSpan.className = 'italic text-blue-600';
        }

        try {
            const address = await window.GeocodingService.reverseGeocode(latlng.lat, latlng.lng);
            addressResult = address;

            if (hiddenLocationInput) {
                hiddenLocationInput.value = address;
            }

            if (addressSpan) {
                addressSpan.textContent = address;
                addressSpan.className = 'italic text-green-600 font-medium';
            }

            console.log('Address updated:', address);
        } catch (error) {
            console.warn('Could not get address:', error);
            const fallbackAddress = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
            addressResult = fallbackAddress;

            if (hiddenLocationInput) {
                hiddenLocationInput.value = fallbackAddress;
            }

            if (addressSpan) {
                addressSpan.textContent = fallbackAddress;
                addressSpan.className = 'italic text-orange-600';
            }
        }
        return addressResult;
    }

    async getCurrentLocation() {
        const locateBtn = document.getElementById('locate-me-btn');

        if (navigator.geolocation) {
            if (locateBtn) locateBtn.textContent = '📍 Obteniendo...';

            try {
                const position = await this.getCurrentPositionPromise();
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                this.selectedLatLng = { lat, lng };
                const address = await this.updateSelectedLocation({ lat, lng });

                if (this.formMap) {
                    this.formMap.setView([lat, lng], 16);

                    this.formMap.eachLayer(layer => {
                        if (layer instanceof L.Marker) {
                            this.formMap.removeLayer(layer);
                        }
                    });

                    L.marker([lat, lng])
                        .addTo(this.formMap)
                        .bindPopup(address || '📍 Tu ubicación')
                        .openPopup();
                }
            } catch (error) {
                console.error('Error getting location:', error);
                if (window.displayMessage) {
                    window.displayMessage('No se pudo obtener tu ubicación. Selecciona manualmente en el mapa.', false);
                }
            } finally {
                if (locateBtn) locateBtn.textContent = '📍 Mi Ubicación';
            }
        } else {
            if (window.displayMessage) {
                window.displayMessage('La geolocalización no está soportada en este navegador.', false);
            }
        }
    }

    async searchLocation(query) {
        const result = await window.GeocodingService.forwardGeocode(query);
        if (result) {
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            const latlng = { lat, lng };

            this.selectedLatLng = latlng;
            await this.updateSelectedLocation(latlng);

            if (this.formMap) {
                this.formMap.setView([lat, lng], 16);

                this.formMap.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        this.formMap.removeLayer(layer);
                    }
                });

                L.marker([lat, lng])
                    .addTo(this.formMap)
                    .bindPopup(result.display_name || '📍 Ubicación buscada')
                    .openPopup();
            }
            return true;
        }
        return false;
    }

    getCurrentPositionPromise() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });
    }

    getMarkerColor(gravedad) {
        const colors = {
            'Fatal': '#DC2626',
            'Lesiones Graves': '#EA580C',
            'Lesiones Leves': '#D97706',
            'Sin Lesiones': '#059669'
        };
        return colors[gravedad] || '#6B7280';
    }

    createAccidentMarker(record) {
        if (!record.latitude || !record.longitude) return null;

        const color = this.getMarkerColor(record.gravedad);
        const marker = L.circleMarker([record.latitude, record.longitude], {
            radius: 8,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });

        const date = record.fecha ? new Date(record.fecha).toLocaleString('es-AR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Fecha no especificada';

        const vehicleBadges = (record.vehicles_involved || []).map(vehicle =>
            `<span style="background: #e5e7eb; color: #374151; padding: 2px 6px; border-radius: 12px; font-size: 10px; margin-right: 4px;">${vehicle}</span>`
        ).join('');

        const severityClass = {
            'Fatal': 'severity-fatal',
            'Lesiones Graves': 'severity-grave',
            'Lesiones Leves': 'severity-leve',
            'Sin Lesiones': 'severity-sin'
        }[record.gravedad] || 'severity-sin';

        const popupContent = `
            <div class="accident-popup">
                <h4>🚨 ${record.ubicacion || 'Ubicación no disponible'}</h4>
                <p><strong>📅 Fecha:</strong> ${date}</p>
                <p><strong>🚗 Tipo:</strong> ${record.tipo}</p>
                <p><strong>⚠️ Gravedad:</strong> <span class="severity-badge ${severityClass}">${record.gravedad}</span></p>
                <p><strong>🛣️ Vía:</strong> ${record.tipo_via}</p>
                <p><strong>🚙 Vehículos:</strong> ${record.vehiculos_total || 0}</p>
                ${vehicleBadges ? `<p><strong>📋 Involucrados:</strong><br>${vehicleBadges}</p>` : ''}
                ${record.descripcion ? `<p><strong>📝 Notas:</strong> ${record.descripcion}</p>` : ''}
                <p style="margin-top: 8px; font-size: 10px; color: #9CA3AF;"><strong>Registrado por:</strong> ${record.recordedBy || 'N/A'}</p>
            </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });
        return marker;
    }

    loadAccidentMarkers(records) {
        if (!this.mainMap) return;

        this.accidentMarkers.forEach(marker => this.mainMap.removeLayer(marker));
        this.accidentMarkers = [];

        records.forEach(record => {
            const marker = this.createAccidentMarker(record);
            if (marker) {
                marker.addTo(this.mainMap);
                this.accidentMarkers.push(marker);
                marker.recordData = record;
            }
        });
    }

    filterAccidentMarkers(showOnlyFatal = false) {
        if (!this.mainMap) return;

        this.accidentMarkers.forEach(marker => {
            if (showOnlyFatal) {
                if (marker.recordData.gravedad === 'Fatal') {
                    marker.addTo(this.mainMap);
                } else {
                    this.mainMap.removeLayer(marker);
                }
            } else {
                marker.addTo(this.mainMap);
            }
        });
    }

    showRecordOnMap(lat, lng, ubicacion) {
        if (window.showTab) {
            window.showTab('mapa');
        }

        setTimeout(() => {
            if (this.mainMap) {
                this.mainMap.setView([lat, lng], 16);
                this.accidentMarkers.forEach(marker => {
                    if (Math.abs(marker.getLatLng().lat - lat) < 0.0001 &&
                        Math.abs(marker.getLatLng().lng - lng) < 0.0001) {
                        marker.openPopup();
                    }
                });
            }
        }, 200);
    }

    resetFormMap() {
        this.selectedLatLng = null;
        const coordsSpan = document.getElementById('selected-coords');
        const addressSpan = document.getElementById('selected-address');
        const hiddenLocationInput = document.getElementById('ubicacion');
        const manualInput = document.getElementById('manual-address');

        if (coordsSpan) {
            coordsSpan.textContent = 'Seleccione una ubicación en el mapa';
        }

        if (addressSpan) {
            addressSpan.textContent = 'La dirección aparecerá aquí cuando seleccione una ubicación';
            addressSpan.className = 'italic text-gray-600';
        }

        if (hiddenLocationInput) {
            hiddenLocationInput.value = '';
        }

        if (manualInput) {
            manualInput.value = '';
        }

        if (this.formMap) {
            this.formMap.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    this.formMap.removeLayer(layer);
                }
            });
        }
    }

    invalidateSize() {
        if (this.mainMap) {
            this.mainMap.invalidateSize();
        }
        if (this.formMap) {
            this.formMap.invalidateSize();
        }
    }
}

window.MapManager = MapManager;