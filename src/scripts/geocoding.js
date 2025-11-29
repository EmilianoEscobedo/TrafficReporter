class GeocodingService {
    static async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`,
                {
                    headers: {
                        'User-Agent': 'SiniestrosVialesApp/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data && data.display_name) {
                const address = data.address || {};
                let formattedAddress = '';

                if (address.road || address.pedestrian) {
                    formattedAddress += (address.road || address.pedestrian);
                    if (address.house_number) {
                        formattedAddress += ' ' + address.house_number;
                    }
                } else if (address.hamlet || address.village || address.suburb) {
                    formattedAddress += (address.hamlet || address.village || address.suburb);
                }

                if (address.city || address.town || address.municipality) {
                    if (formattedAddress) formattedAddress += ', ';
                    formattedAddress += (address.city || address.town || address.municipality);
                }

                if (address.state) {
                    if (formattedAddress) formattedAddress += ', ';
                    formattedAddress += address.state;
                }

                if (!formattedAddress) {
                    const parts = data.display_name.split(',').slice(0, 2);
                    formattedAddress = parts.join(', ').trim();
                }

                return formattedAddress || data.display_name;
            }

            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch (error) {
            console.warn('Geocoding failed:', error);
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }

    static async forwardGeocode(query) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
                {
                    headers: {
                        'User-Agent': 'SiniestrosVialesApp/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.length > 0 ? data[0] : null;
        } catch (error) {
            console.warn('Forward geocoding failed:', error);
            return null;
        }
    }
}

window.GeocodingService = GeocodingService;