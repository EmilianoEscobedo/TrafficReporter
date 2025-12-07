import { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { AccidentRecord } from '@/types';
import './TrendsPanel.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface TrendsPanelProps {
    accidents: AccidentRecord[];
}

export default function TrendsPanel({ accidents }: TrendsPanelProps) {
    const trendsData = useMemo(() => {
        // Group accidents by date
        const byDate: Record<string, number> = {};
        const bySeverity: Record<string, Record<string, number>> = {};
        const byVehicle: Record<string, Record<string, number>> = {};

        accidents.forEach(accident => {
            if (!accident.fecha) return;

            const date = new Date(accident.fecha);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            // Count by date
            byDate[monthKey] = (byDate[monthKey] || 0) + 1;

            // Count by severity over time
            if (!bySeverity[monthKey]) bySeverity[monthKey] = {};
            bySeverity[monthKey][accident.gravedad] = (bySeverity[monthKey][accident.gravedad] || 0) + 1;

            // Count by vehicle over time
            if (!byVehicle[monthKey]) byVehicle[monthKey] = {};
            accident.vehicles_involved?.forEach(vehicle => {
                byVehicle[monthKey][vehicle] = (byVehicle[monthKey][vehicle] || 0) + 1;
            });
        });

        return { byDate, bySeverity, byVehicle };
    }, [accidents]);

    const timeSeriesData = useMemo(() => {
        const labels = Object.keys(trendsData.byDate).sort();
        const data = labels.map(label => trendsData.byDate[label]);

        return {
            labels,
            datasets: [
                {
                    label: 'Siniestros por Mes',
                    data,
                    borderColor: '#0f766e',
                    backgroundColor: 'rgba(15, 118, 110, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };
    }, [trendsData]);

    const severityTrendsData = useMemo(() => {
        const labels = Object.keys(trendsData.bySeverity).sort();
        const severities = ['Fatal', 'Lesiones Graves', 'Lesiones Leves', 'Sin Lesiones'];
        const colors = {
            'Fatal': '#dc2626',
            'Lesiones Graves': '#ea580c',
            'Lesiones Leves': '#eab308',
            'Sin Lesiones': '#22c55e'
        };

        return {
            labels,
            datasets: severities.map(severity => ({
                label: severity,
                data: labels.map(label => trendsData.bySeverity[label]?.[severity] || 0),
                backgroundColor: colors[severity as keyof typeof colors],
                borderColor: colors[severity as keyof typeof colors],
                borderWidth: 2
            }))
        };
    }, [trendsData]);

    const vehicleTrendsData = useMemo(() => {
        const labels = Object.keys(trendsData.byVehicle).sort();
        const vehicles = ['Auto', 'Moto', 'Camioneta'];
        const colors = {
            'Auto': '#10b981',
            'Moto': '#dc2626',
            'Camioneta': '#8b5cf6'
        };

        return {
            labels,
            datasets: vehicles.map(vehicle => ({
                label: vehicle,
                data: labels.map(label => trendsData.byVehicle[label]?.[vehicle] || 0),
                borderColor: colors[vehicle as keyof typeof colors],
                backgroundColor: colors[vehicle as keyof typeof colors],
                tension: 0.4
            }))
        };
    }, [trendsData]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    return (
        <div className="trends-panel">
            <div className="trends-panel__section">
                <h3 className="trends-panel__title">Evolución Temporal de Siniestros</h3>
                <div className="trends-panel__chart">
                    <Line data={timeSeriesData} options={chartOptions} />
                </div>
            </div>

            <div className="trends-panel__section">
                <h3 className="trends-panel__title">Tendencia por Gravedad</h3>
                <div className="trends-panel__chart">
                    <Bar data={severityTrendsData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'top' as const } } }} />
                </div>
            </div>

            <div className="trends-panel__section">
                <h3 className="trends-panel__title">Comparativa de Vehículos Implicados</h3>
                <div className="trends-panel__chart">
                    <Line data={vehicleTrendsData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
}
