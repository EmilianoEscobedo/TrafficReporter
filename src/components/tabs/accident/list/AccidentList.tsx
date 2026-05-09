import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import AccidentCard from '@/components/tabs/accident/card/AccidentCard';
import Pagination from '@/components/layout/shared/pagination/Pagination';
import { exportToCSV } from '@/services/export';
import { showConfirm, showError, showToast } from '@/utils/sweetalert';
import type { AccidentRecord, FilterState } from '@/types';
import './AccidentList.css';

interface AccidentListProps {
    onEdit: (record: AccidentRecord) => void;
    onOpenLightbox: (recordId: string, imageIndex: number) => void;
    onShowOnMap: (lat: number, lng: number, ubicacion: string) => void;
}

export default function AccidentList({ onEdit, onOpenLightbox, onShowOnMap }: AccidentListProps) {
    const { allAccidents, deleteAccident } = useData();
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<FilterState>({
        startDate: '',
        endDate: '',
        vehicle: '',
        severity: '',
        road: '',
    });

    const itemsPerPage = 5;

    const filteredAccidents = useMemo(() => {
        return allAccidents.filter((record) => {
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
    }, [allAccidents, filters]);

    const totalPages = Math.ceil(filteredAccidents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAccidents = filteredAccidents.slice(startIndex, startIndex + itemsPerPage);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            vehicle: '',
            severity: '',
            road: '',
        });
        setCurrentPage(1);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm(
            'Esta acción no se puede deshacer.',
            '¿Estás seguro de que quieres eliminar este registro?',
            'Sí, eliminar',
            'Cancelar'
        );

        if (confirmed) {
            try {
                await deleteAccident(id);
                showToast('Registro eliminado', 'success');
            } catch (error) {
                console.error('Error deleting record:', error);
                showError('Error al eliminar el registro.');
            }
        }
    };

    const handleExportCSV = () => {
        exportToCSV(filteredAccidents.length > 0 ? filteredAccidents : allAccidents);
    };

    return (
        <div className="accident-list">
            <div className="accident-list__header">
                <h2 className="accident-list__title">Accidentes Registrados</h2>
                <button onClick={handleExportCSV} className="accident-list__export-btn">
                    <svg className="accident-list__export-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar CSV
                </button>
            </div>

            <div className="accident-list__filters">
                <span className="accident-list__filters-label">Filtrar:</span>
                <div className="accident-list__date-range">
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="accident-list__filter-input"
                    />
                    <span>-</span>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="accident-list__filter-input"
                    />
                </div>
                <select
                    value={filters.vehicle}
                    onChange={(e) => handleFilterChange('vehicle', e.target.value)}
                    className="accident-list__filter-select"
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
                    className="accident-list__filter-select"
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
                    className="accident-list__filter-select"
                >
                    <option value="">Vía...</option>
                    <option value="Calle/Pasaje simple">Calle/Pasaje simple</option>
                    <option value="Avenida SIN Boulevard">Avenida SIN Boulevard</option>
                    <option value="Avenida CON Boulevard ">Avenida CON Boulevard</option>
                </select>
                <button onClick={handleClearFilters} className="accident-list__clear-btn">
                    Limpiar Filtros
                </button>
            </div>

            <div className="accident-list__content">
                {paginatedAccidents.length === 0 ? (
                    <p className="accident-list__empty">No hay registros de accidentes aún.</p>
                ) : (
                    paginatedAccidents.map((record) => (
                        <AccidentCard
                            key={record.id}
                            record={record}
                            onEdit={() => onEdit(record)}
                            onDelete={() => handleDelete(record.id)}
                            onOpenLightbox={onOpenLightbox}
                            onShowOnMap={onShowOnMap}
                        />
                    ))
                )}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
}
