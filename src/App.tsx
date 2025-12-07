import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider, useData } from '@/contexts/DataContext';
import LoginScreen from '@/components/auth/LoginScreen';
import Header from '@/components/layout/header/Header';
import Footer from '@/components/layout/footer/Footer';
import TabNavigation from '@/components/layout/tab/TabNavigation';
import AccidentForm from '@/components/tabs/accident/form/AccidentForm';
import AccidentList from '@/components/tabs/accident/list/AccidentList';
import MainMap from '@/components/tabs/map/mainMap/MainMap';
import StatisticsPanel from '@/components/tabs/statistics/data/StatisticsPanel';
import UsersPanel from '@/components/tabs/users/UsersPanel';
import Lightbox from '@/components/layout/shared/lightBox/Lightbox';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import LoadingSpinner from '@/components/layout/shared/spinner/LoadingSpinner';
import type { AccidentRecord } from '@/types';
import '@/styles/variables.css';
import '@/styles/global.css';
import './App.css';

function AppContent() {
  const { isAuthReady, isCheckingAuth } = useAuth();
  const { allAccidents } = useData();
  const [activeTab, setActiveTab] = useState('registro');
  const [editingRecord, setEditingRecord] = useState<AccidentRecord | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number; ubicacion: string } | null>(null);

  const handleEdit = (record: AccidentRecord) => {
    setEditingRecord(record);
    setActiveTab('registro');
    setTimeout(() => {
      document.getElementById('form-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  const handleOpenLightbox = (recordId: string, imageIndex: number) => {
    const record = allAccidents.find((r) => r.id === recordId);
    if (record && record.images && record.images.length > 0) {
      setLightboxImages(record.images);
      setLightboxIndex(imageIndex);
      setShowLightbox(true);
    }
  };

  const handleCloseLightbox = () => {
    setShowLightbox(false);
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  const handleLightboxNext = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const handleLightboxPrevious = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const handleShowOnMap = (lat: number, lng: number, ubicacion: string) => {
    setTargetLocation({ lat, lng, ubicacion });
    setActiveTab('mapa');
  };

  if (isCheckingAuth) {
    return (
      <div className="app__loading">
        <LoadingSpinner />
        <p className="app__loading-text">Cargando Panel...</p>
      </div>
    );
  }

  if (!isAuthReady) {
    return <LoginScreen />;
  }

  return (
    <div className="app">
      <Header />
      <main className="app__main">
        <div className="app__container">
          <div className="app__stats">
            <div className="app__stats-card">
              <div className="app__stats-content">
                Accidentes Registrados: <span className="app__stats-count">{allAccidents.length}</span>
              </div>
            </div>
          </div>

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'registro' && (
            <div className="app__tab-content">
              <div id="form-container" className="app__form-section">
                <AccidentForm editingRecord={editingRecord} onCancelEdit={handleCancelEdit} />
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="app__tab-content">
              <div className="app__list-section">
                <AccidentList
                  onEdit={handleEdit}
                  onOpenLightbox={handleOpenLightbox}
                  onShowOnMap={handleShowOnMap}
                />
              </div>
            </div>
          )}

          {activeTab === 'mapa' && (
            <div className="app__tab-content">
              <MainMap accidents={allAccidents} onOpenLightbox={handleOpenLightbox} targetLocation={targetLocation} />
            </div>
          )}

          {activeTab === 'estadisticas' && (
            <div className="app__tab-content">
              <StatisticsPanel accidents={allAccidents} />
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div className="app__tab-content">
              <UsersPanel />
            </div>
          )}
        </div>
      </main>
      <InstallPrompt />
      <Footer />

      {showLightbox && (
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNext={handleLightboxNext}
          onPrevious={handleLightboxPrevious}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
