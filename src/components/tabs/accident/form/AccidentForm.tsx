import { useState, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import FormMap from '@/components/tabs/map/formMap/FormMap';
import LoadingSpinner from '@/components/layout/shared/spinner/LoadingSpinner';
import { showError, showToast } from '@/utils/sweetalert';
import type { MapLocation, AccidentRecord } from '@/types';
import './AccidentForm.css';

interface AccidentFormProps {
    editingRecord?: AccidentRecord | null;
    onCancelEdit?: () => void;
}

export default function AccidentForm({ editingRecord, onCancelEdit }: AccidentFormProps) {
    const { addAccident, updateAccident } = useData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fecha, setFecha] = useState('');
    const [tipoVia, setTipoVia] = useState('');
    const [tipo, setTipo] = useState('');
    const [gravedad, setGravedad] = useState('');
    const [vehiculosTotal, setVehiculosTotal] = useState(1);
    const [vehiclesInvolved, setVehiclesInvolved] = useState<string[]>([]);
    const [descripcion, setDescripcion] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
    const [address, setAddress] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

    useEffect(() => {
        if (editingRecord) {
            setFecha(editingRecord.fecha || '');
            setTipoVia(editingRecord.tipo_via || '');
            setTipo(editingRecord.tipo || '');
            setGravedad(editingRecord.gravedad || '');
            setVehiculosTotal(editingRecord.vehiculos_total || 1);
            setVehiclesInvolved(editingRecord.vehicles_involved || []);
            setDescripcion(editingRecord.descripcion || '');
            setSelectedLocation({ lat: editingRecord.latitude, lng: editingRecord.longitude });
            setAddress(editingRecord.ubicacion || '');
            setExistingImages(editingRecord.images || []);
            setImagesToDelete([]);
        } else {
            resetForm();
        }
    }, [editingRecord]);

    useEffect(() => {
        if (!editingRecord) {
            setInitialDateTime();
        }
    }, [editingRecord]);

    const setInitialDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setFecha(`${year}-${month}-${day}T${hours}:${minutes}`);
    };

    const resetForm = () => {
        setFecha('');
        setTipoVia('');
        setTipo('');
        setGravedad('');
        setVehiculosTotal(1);
        setVehiclesInvolved([]);
        setDescripcion('');
        setSelectedLocation(null);
        setAddress('');
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setImagesToDelete([]);
        setInitialDateTime();
    };

    const handleVehicleToggle = (vehicle: string) => {
        setVehiclesInvolved((prev) =>
            prev.includes(vehicle) ? prev.filter((v) => v !== vehicle) : [...prev, vehicle]
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        setImageFiles((prev) => [...prev, ...newFiles]);

        const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
        setImagePreviews((prev) => [...prev, ...newPreviews]);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveNewImage = (index: number) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleDeleteExistingImage = (url: string) => {
        setImagesToDelete((prev) => [...prev, url]);
        setExistingImages((prev) => prev.filter((img) => img !== url));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (vehiclesInvolved.length === 0) {
            showError('Por favor, selecciona al menos un tipo de vehículo implicado.');
            return;
        }

        if (!tipoVia || !tipo || !gravedad) {
            showError('Por favor, completa todos los campos obligatorios.');
            return;
        }

        if (!selectedLocation) {
            showError('Por favor, selecciona la ubicación en el mapa.');
            return;
        }

        if (!address) {
            showError('Por favor, ingresa o selecciona una dirección.');
            return;
        }

        setIsSubmitting(true);

        try {
            const accidentData = {
                fecha,
                ubicacion: address,
                tipo_via: tipoVia,
                tipo,
                gravedad: gravedad as AccidentRecord['gravedad'],
                vehiculos_total: vehiculosTotal,
                vehicles_involved: vehiclesInvolved,
                descripcion,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
            };

            if (editingRecord) {
                await updateAccident(editingRecord.id, accidentData, imageFiles, imagesToDelete);
                showToast('Registro actualizado exitosamente', 'success');
                if (onCancelEdit) onCancelEdit();
            } else {
                await addAccident(accidentData, imageFiles);
                showToast('Registro creado exitosamente', 'success');
                resetForm();
            }
        } catch (error: any) {
            console.error('Error saving record:', error);
            showError(`Error al guardar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const vehicleOptions = [
        { label: 'Auto', emoji: '🚗' },
        { label: 'Moto', emoji: '🏍️' },
        { label: 'Camioneta', emoji: '🚙' },
        { label: 'Utilitario', emoji: '🚐' },
        { label: 'Camión', emoji: '🚚' },
        { label: 'Bicicleta', emoji: '🚲' },
        { label: 'Peatón', emoji: '🚶' },
        { label: 'Animal', emoji: '🐴' }
    ];

    return (
        <div className="accident-form">
            <div className="accident-form__header">
                <h2 className="accident-form__title">
                    {editingRecord ? 'Editar Accidente' : 'Registrar Nuevo Accidente'}
                </h2>
                {editingRecord && onCancelEdit && (
                    <button onClick={onCancelEdit} className="accident-form__cancel">
                        Cancelar Edición
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="accident-form__form">
                <div className="accident-form__grid accident-form__grid--two">
                    <div className="accident-form__field">
                        <label htmlFor="fecha" className="accident-form__label">
                            Fecha y Hora
                        </label>
                        <input
                            type="datetime-local"
                            id="fecha"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            required
                            className="accident-form__input"
                        />
                    </div>

                    <div className="accident-form__field">
                        <label htmlFor="tipo_via" className="accident-form__label">
                            Tipo de Vía
                        </label>
                        <select
                            id="tipo_via"
                            value={tipoVia}
                            onChange={(e) => setTipoVia(e.target.value)}
                            required
                            className="accident-form__select"
                        >
                            <option value="">Seleccione...</option>
                            <option value="Calle/Pasaje simple">Calle/Pasaje simple</option>
                            <option value="Avenida SIN Boulevard">Avenida SIN Boulevard</option>
                            <option value="Avenida CON Boulevard">Avenida CON Boulevard</option>
                        </select>
                    </div>
                </div>

                <div className="accident-form__grid accident-form__grid--three">
                    <div className="accident-form__field">
                        <label htmlFor="tipo" className="accident-form__label">
                            Tipo de Siniestro
                        </label>
                        <select
                            id="tipo"
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            required
                            className="accident-form__select"
                        >
                            <option value="">Seleccione...</option>
                            <option value="Colisión Lateral">Colisión Lateral</option>
                            <option value="Colisión Frontal">Colisión Frontal</option>
                            <option value="Atropello Peatón">Atropello Peatón</option>
                            <option value="Vuelco">Vuelco</option>
                            <option value="Choque Objeto Fijo">Choque contra Objeto Fijo</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>

                    <div className="accident-form__field">
                        <label htmlFor="gravedad" className="accident-form__label">
                            Gravedad
                        </label>
                        <select
                            id="gravedad"
                            value={gravedad}
                            onChange={(e) => setGravedad(e.target.value)}
                            required
                            className="accident-form__select"
                        >
                            <option value="">Seleccione...</option>
                            <option value="Sin Lesiones">Sin Lesiones</option>
                            <option value="Lesiones Leves">Lesiones Leves</option>
                            <option value="Lesiones Graves">Lesiones Graves</option>
                            <option value="Fatal">Fatal</option>
                        </select>
                    </div>

                    <div className="accident-form__field">
                        <label htmlFor="vehiculos_total" className="accident-form__label">
                            Total de Vehículos
                        </label>
                        <input
                            type="number"
                            id="vehiculos_total"
                            value={vehiculosTotal}
                            onChange={(e) => setVehiculosTotal(parseInt(e.target.value) || 1)}
                            min="1"
                            required
                            className="accident-form__input"
                        />
                    </div>
                </div>

                <FormMap
                    selectedLocation={selectedLocation}
                    onLocationSelect={setSelectedLocation}
                    address={address}
                    onAddressChange={setAddress}
                />

                <div className="accident-form__vehicles">
                    <label className="accident-form__label">Tipos de Vehículos Implicados:</label>
                    <div className="accident-form__vehicle-grid">
                        {vehicleOptions.map((vehicle) => (
                            <label key={vehicle.label} className="accident-form__checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={vehiclesInvolved.includes(vehicle.label)}
                                    onChange={() => handleVehicleToggle(vehicle.label)}
                                    className="accident-form__checkbox"
                                />
                                <span className="accident-form__vehicle-emoji">{vehicle.emoji}</span>
                                <span className="accident-form__vehicle-text">{vehicle.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="accident-form__field">
                    <label htmlFor="image-input" className="accident-form__label">
                        Imágenes:
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        id="image-input"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="accident-form__file-input"
                    />
                    <div className="accident-form__image-previews">
                        {existingImages.map((url) => (
                            <div key={url} className="accident-form__image-preview">
                                <img src={url} alt="Existing" className="accident-form__image" />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteExistingImage(url)}
                                    className="accident-form__image-delete"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {imagePreviews.map((preview, idx) => (
                            <div key={idx} className="accident-form__image-preview">
                                <img src={preview} alt="Preview" className="accident-form__image accident-form__image--new" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveNewImage(idx)}
                                    className="accident-form__image-delete"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="accident-form__field">
                    <label htmlFor="descripcion" className="accident-form__label">
                        Descripción Breve / Notas
                    </label>
                    <textarea
                        id="descripcion"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        rows={3}
                        placeholder="Detalles clave, factores contribuyentes o fuentes..."
                        className="accident-form__textarea"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`accident-form__submit ${editingRecord ? 'accident-form__submit--edit' : ''}`}
                >
                    <span>{isSubmitting ? (editingRecord ? 'Actualizando...' : 'Guardando...') : (editingRecord ? 'Actualizar Registro' : 'Registrar Accidente')}</span>
                    {isSubmitting && <LoadingSpinner size="small" />}
                </button>
            </form>
        </div>
    );
}
