import { useMemo, useState } from 'react';
import type { AccidentRecord, FilterState } from '@/types';
import { exportStatisticsToPDF } from '@/services/export';
import TrendsPanel from '../trends/TrendsPanel';
import './StatisticsPanel.css';

interface StatisticsPanelProps {
    accidents: AccidentRecord[];
}

export default function StatisticsPanel({ accidents }: StatisticsPanelProps) {
    const [activeTab, setActiveTab] = useState<'agregados' | 'tendencias'>('agregados');
    const [filters, setFilters] = useState<FilterState>({
        startDate: '',
        endDate: '',
        vehicle: '',
        severity: '',
        road: '',
    });

    const filteredAccidents = useMemo(() => {
        return accidents.filter((record) => {
            if (record.fecha) {
                const recordDate = new Date(record.fecha);
                if (filters.startDate) {
                    const start = new Date(filters.startDate);
                    if (recordDate < start) return false;
                }
                if (filters.endDate) {
                    const end = new Date(filters.endDate);
                    end.setHours(23, 59, 59, 999);
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

    const statistics = useMemo(() => {
        const total = filteredAccidents.length;

        const viaCounts: Record<string, number> = {};
        const gravedadCounts: Record<string, number> = {};
        const vehicleCounts: Record<string, number> = {};
        const horaCounts: Record<string, number> = {};
        const diaCounts: Record<string, number> = {};
        const mesCounts: Record<string, number> = {};
        const anioCounts: Record<string, number> = {};

        filteredAccidents.forEach((record) => {
            const via = record.tipo_via || 'Desconocido';
            viaCounts[via] = (viaCounts[via] || 0) + 1;

            const gravedad = record.gravedad || 'Desconocido';
            gravedadCounts[gravedad] = (gravedadCounts[gravedad] || 0) + 1;

            (record.vehicles_involved || []).forEach((vehicle) => {
                vehicleCounts[vehicle] = (vehicleCounts[vehicle] || 0) + 1;
            });

            if (record.fecha) {
                const date = new Date(record.fecha);

                const hour = date.getHours();
                let hourRange = '';
                if (hour >= 0 && hour < 6) hourRange = 'Madrugada (00-06)';
                else if (hour >= 6 && hour < 12) hourRange = 'Mañana (06-12)';
                else if (hour >= 12 && hour < 18) hourRange = 'Tarde (12-18)';
                else hourRange = 'Noche (18-24)';
                horaCounts[hourRange] = (horaCounts[hourRange] || 0) + 1;

                const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const dayName = days[date.getDay()];
                diaCounts[dayName] = (diaCounts[dayName] || 0) + 1;

                const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const monthName = months[date.getMonth()];
                mesCounts[monthName] = (mesCounts[monthName] || 0) + 1;

                const year = date.getFullYear().toString();
                anioCounts[year] = (anioCounts[year] || 0) + 1;
            }
        });

        return { total, viaCounts, gravedadCounts, vehicleCounts, horaCounts, diaCounts, mesCounts, anioCounts };
    }, [filteredAccidents]);

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

    const handleExportPDF = () => {
        exportStatisticsToPDF('statistics-output', filters.startDate, filters.endDate);
    };

    const getVehicleColorClass = (vehicleName: string): string => {
        const normalizedName = vehicleName.toLowerCase();
        if (normalizedName.includes('moto')) return 'stats-bar__fill--vehicle-moto';
        if (normalizedName.includes('bici')) return 'stats-bar__fill--vehicle-bicicleta';
        if (normalizedName.includes('peatón')) return 'stats-bar__fill--vehicle-peatón';
        if (normalizedName.includes('camión')) return 'stats-bar__fill--vehicle-camión';
        if (normalizedName.includes('camioneta')) return 'stats-bar__fill--vehicle-camioneta';
        if (normalizedName.includes('auto')) return 'stats-bar__fill--vehicle-auto';
        if (normalizedName.includes('utilitario')) return 'stats-bar__fill--vehicle-utilitario';
        if (normalizedName.includes('animal')) return 'stats-bar__fill--vehicle-animal';
        return '';
    };

    const getSeverityColorClass = (severityName: string): string => {
        const normalizedName = severityName.toLowerCase();
        if (normalizedName.includes('fatal')) return 'stats-bar__fill--severity-fatal';
        if (normalizedName.includes('graves')) return 'stats-bar__fill--severity-graves';
        if (normalizedName.includes('leves')) return 'stats-bar__fill--severity-leves';
        if (normalizedName.includes('sin')) return 'stats-bar__fill--severity-sin';
        return '';
    };

    const getRoadTypeColorClass = (roadName: string): string => {
        const normalizedName = roadName.toLowerCase();
        if (normalizedName.includes('boulevard') && normalizedName.includes('con')) return 'stats-bar__fill--via-avenida-con';
        if (normalizedName.includes('avenida') && normalizedName.includes('sin')) return 'stats-bar__fill--via-avenida-sin';
        if (normalizedName.includes('calle') || normalizedName.includes('pasaje')) return 'stats-bar__fill--via-calle';
        return '';
    };

    const renderBarChart = (data: Record<string, number>, colorClass?: string | ((label: string) => string)) => {
        const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
        const total = Object.values(data).reduce((sum, count) => sum + count, 0);

        return entries.map(([label, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            const finalColorClass = typeof colorClass === 'function' ? colorClass(label) : colorClass || '';
            return (
                <div key={label} className="stats-bar">
                    <div className="stats-bar__header">
                        <span className="stats-bar__label">{label}</span>
                        <span className="stats-bar__value">
                            {count} ({percentage}%)
                        </span>
                    </div>
                    <div className="stats-bar__container">
                        <div className={`stats-bar__fill ${finalColorClass}`} style={{ width: `${percentage}%` }}>
                            {percentage}%
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="statistics-panel">
            <div className="statistics-panel__tabs">
                <button
                    onClick={() => setActiveTab('agregados')}
                    className={`statistics-panel__tab ${activeTab === 'agregados' ? 'statistics-panel__tab--active' : ''}`}
                >
                    Datos Agregados
                </button>
                <button
                    onClick={() => setActiveTab('tendencias')}
                    className={`statistics-panel__tab ${activeTab === 'tendencias' ? 'statistics-panel__tab--active' : ''}`}
                >
                    Tendencias
                </button>
            </div>

            <div className="statistics-panel__filters">
                <span className="statistics-panel__filters-label">Filtrar:</span>
                <div className="statistics-panel__date-range">
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="statistics-panel__filter-input"
                    />
                    <span>-</span>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="statistics-panel__filter-input"
                    />
                </div>
                <select
                    value={filters.vehicle}
                    onChange={(e) => handleFilterChange('vehicle', e.target.value)}
                    className="statistics-panel__filter-select"
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
                    className="statistics-panel__filter-select"
                >
                    <option value="">Gravedad...</option>
                    <option value="Fatal">Fatal</option>
                    <option value="Lesiones Graves">Lesiones Graves</option>
                    <option value="Lesiones Leves">Lesiones Leves</option>
                    <option value="Sin Lesiones">Sin Lesiones</option>
                </select>
                <select
                    value={filters.road}
                    onChange={(e) => handleFilterChange('road', e.target.value)}
                    className="statistics-panel__filter-select"
                >
                    <option value="">Tipo de Vía...</option>
                    <option value="Avenida">Avenida</option>
                    <option value="Calle">Calle</option>
                    <option value="Boulevard">Boulevard</option>
                </select>
                <button onClick={handleClearFilters} className="statistics-panel__clear-btn">
                    Limpiar Filtros
                </button>
            </div>

            {activeTab === 'agregados' ? (
                <>
                    <div className="statistics-panel__header">
                        <h2 className="statistics-panel__title">Análisis de Datos Agregados</h2>
                        <button onClick={handleExportPDF} className="statistics-panel__export-btn">
                            <svg className="statistics-panel__export-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Exportar PDF
                        </button>
                    </div>

                    <div id="statistics-output" className="statistics-panel__content">
                        {statistics.total === 0 ? (
                            <p id="stats-loading" className="statistics-panel__empty">
                                No hay registros en el rango seleccionado.
                            </p>
                        ) : (
                            <div className="statistics-panel__grid">
                                <section className="statistics-panel__section">
                                    <h3 className="statistics-panel__section-title">1. Frecuencia por Tipo de Vía</h3>
                                    <div className="statistics-panel__charts">{renderBarChart(statistics.viaCounts, getRoadTypeColorClass)}</div>
                                </section>

                                <section className="statistics-panel__section">
                                    <h3 className="statistics-panel__section-title">2. Distribución por Gravedad</h3>
                                    <div className="statistics-panel__charts">{renderBarChart(statistics.gravedadCounts, getSeverityColorClass)}</div>
                                </section>

                                <section className="statistics-panel__section">
                                    <h3 className="statistics-panel__section-title">3. Vehículos más Implicados</h3>
                                    <div className="statistics-panel__charts">{renderBarChart(statistics.vehicleCounts, getVehicleColorClass)}</div>
                                </section>

                                <section className="statistics-panel__section statistics-panel__section--page-break">
                                    <h3 className="statistics-panel__section-title">4. Hora del Siniestro</h3>
                                    <div className="statistics-panel__charts">{renderBarChart(statistics.horaCounts)}</div>
                                </section>

                                <section className="statistics-panel__section">
                                    <h3 className="statistics-panel__section-title">5. Siniestros por Día de la Semana</h3>
                                    <div className="statistics-panel__charts">{renderBarChart(statistics.diaCounts)}</div>
                                </section>

                                {Object.keys(statistics.mesCounts).length > 0 && (
                                    <section className="statistics-panel__section">
                                        <h3 className="statistics-panel__section-title">6. Siniestros por Mes</h3>
                                        <div className="statistics-panel__charts">{renderBarChart(statistics.mesCounts)}</div>
                                    </section>
                                )}

                                {Object.keys(statistics.anioCounts).length > 0 && (
                                    <section className="statistics-panel__section">
                                        <h3 className="statistics-panel__section-title">7. Siniestros por Año</h3>
                                        <div className="statistics-panel__charts">{renderBarChart(statistics.anioCounts)}</div>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <TrendsPanel accidents={filteredAccidents} />
            )}
        </div>
    );
};
