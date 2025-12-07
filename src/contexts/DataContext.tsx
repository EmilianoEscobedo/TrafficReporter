import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/services/firebase';
import { useAuth } from './AuthContext';
import type { AccidentRecord } from '@/types';

interface DataContextType {
    allAccidents: AccidentRecord[];
    isLoading: boolean;
    addAccident: (data: Partial<AccidentRecord>, images: File[]) => Promise<void>;
    updateAccident: (id: string, data: Partial<AccidentRecord>, newImages: File[], imagesToDelete: string[]) => Promise<void>;
    deleteAccident: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { currentUser, isAuthReady } = useAuth();
    const [allAccidents, setAllAccidents] = useState<AccidentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady || !currentUser) {
            setAllAccidents([]);
            setIsLoading(false);
            return;
        }

        const q = query(collection(db, 'shared_accident_reports'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const records: AccidentRecord[] = [];
                snapshot.forEach((doc) => {
                    records.push({ id: doc.id, ...doc.data() } as AccidentRecord);
                });
                setAllAccidents(records);
                setIsLoading(false);
            },
            (error) => {
                console.error('Error loading records:', error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [isAuthReady, currentUser]);

    const uploadImages = async (images: File[]): Promise<string[]> => {
        const uploadedUrls: string[] = [];
        for (const file of images) {
            const storageRef = ref(storage, `accident_images/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            uploadedUrls.push(url);
        }
        return uploadedUrls;
    };

    const deleteImages = async (imageUrls: string[]): Promise<void> => {
        for (const url of imageUrls) {
            try {
                const imageRef = ref(storage, url);
                await deleteObject(imageRef);
            } catch (error) {
                console.warn('Error deleting image:', error);
            }
        }
    };

    const addAccident = async (data: Partial<AccidentRecord>, images: File[]): Promise<void> => {
        if (!currentUser) throw new Error('User not authenticated');

        const uploadedImageUrls = await uploadImages(images);

        const accidentData = {
            ...data,
            images: uploadedImageUrls,
            createdAt: serverTimestamp(),
            recordedBy: currentUser.email,
            recordedByUid: currentUser.uid,
        };

        await addDoc(collection(db, 'shared_accident_reports'), accidentData);
    };

    const updateAccident = async (
        id: string,
        data: Partial<AccidentRecord>,
        newImages: File[],
        imagesToDelete: string[]
    ): Promise<void> => {
        if (!currentUser) throw new Error('User not authenticated');

        await deleteImages(imagesToDelete);

        const uploadedImageUrls = await uploadImages(newImages);

        const existingRecord = allAccidents.find((r) => r.id === id);
        const keptImages = (existingRecord?.images || []).filter((url) => !imagesToDelete.includes(url));

        const updatedData = {
            ...data,
            images: [...keptImages, ...uploadedImageUrls],
            updatedAt: serverTimestamp(),
            updatedBy: currentUser.email,
        };

        await updateDoc(doc(db, 'shared_accident_reports', id), updatedData);
    };

    const deleteAccident = async (id: string): Promise<void> => {
        const record = allAccidents.find((r) => r.id === id);
        if (record && record.images && record.images.length > 0) {
            await deleteImages(record.images);
        }
        await deleteDoc(doc(db, 'shared_accident_reports', id));
    };

    const value: DataContextType = {
        allAccidents,
        isLoading,
        addAccident,
        updateAccident,
        deleteAccident,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
