class GeocodingService {
    private static cache: Map<string, { result: any; timestamp: number }> = new Map();
    private static lastRequestTime: number = 0;
    private static readonly MIN_REQUEST_INTERVAL = 1000;
    private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000;

    private static async waitForRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
            const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    private static getCachedResult(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
            return cached.result;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    private static setCachedResult(key: string, result: any): void {
        this.cache.set(key, {
            result,
            timestamp: Date.now()
        });
    }

    static async reverseGeocode(lat: number, lng: number): Promise<string> {
        const cacheKey = `reverse:${lat.toFixed(6)},${lng.toFixed(6)}`;
        const cached = this.getCachedResult(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            await this.waitForRateLimit();

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`,
                {
                    headers: {
                        'User-Agent': 'TrafficReporter/1.0',
                        'Referer': window.location.origin
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

                const result = formattedAddress || data.display_name;
                this.setCachedResult(cacheKey, result);
                return result;
            }

            const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            this.setCachedResult(cacheKey, fallback);
            return fallback;
        } catch (error) {
            console.warn('Geocoding failed:', error);
            const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            return fallback;
        }
    }

    static async forwardGeocode(query: string): Promise<any> {
        const cacheKey = `forward:${query.toLowerCase()}`;
        const cached = this.getCachedResult(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            await this.waitForRateLimit();

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
                {
                    headers: {
                        'User-Agent': 'TrafficReporter/1.0',
                        'Referer': window.location.origin
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const result = data.length > 0 ? data[0] : null;

            this.setCachedResult(cacheKey, result);
            return result;
        } catch (error) {
            console.warn('Forward geocoding failed:', error);
            return null;
        }
    }
}

export default GeocodingService;
