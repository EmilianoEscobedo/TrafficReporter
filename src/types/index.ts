export interface AccidentRecord {
    id: string;
    fecha: string;
    ubicacion: string;
    tipo_via: string;
    tipo: string;
    gravedad: 'Sin Lesiones' | 'Lesiones Leves' | 'Lesiones Graves' | 'Fatal';
    vehiculos_total: number;
    vehicles_involved: string[];
    descripcion?: string;
    latitude: number;
    longitude: number;
    images?: string[];
    recordedBy?: string;
    recordedByUid?: string;
    createdAt?: any;
    updatedAt?: any;
    updatedBy?: string;
}

export interface User {
    uid: string;
    email: string | null;
    displayName?: string | null;
    role: 'admin' | 'visitor' | null;
}

export interface UserDocument {
    email: string;
    role: 'admin' | 'visitor';
    createdAt: any;
    createdBy: string;
    updatedAt?: any;
    updatedBy?: string;
}

export interface FilterState {
    startDate: string;
    endDate: string;
    vehicle: string;
    severity: string;
    road: string;
}

export interface MapLocation {
    lat: number;
    lng: number;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
}

export interface AppConfig {
    firebaseConfig: FirebaseConfig;
    appId: string;
    allowedEmails: string[];
}
