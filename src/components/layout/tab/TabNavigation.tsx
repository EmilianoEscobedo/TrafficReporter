import { useAuth } from '@/contexts/AuthContext';
import './TabNavigation.css';

interface TabNavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
    const { isAdmin } = useAuth();

    const tabs = [
        { id: 'registro', label: 'Registro', visible: isAdmin() },
        { id: 'historial', label: 'Historial', visible: true },
        { id: 'mapa', label: 'Mapa', visible: true },
        { id: 'estadisticas', label: 'Estadísticas', visible: true },
        { id: 'usuarios', label: 'Usuarios', visible: isAdmin(), position: 'right' },
    ].filter(tab => tab.visible);

    const leftTabs = tabs.filter(t => !t.position);
    const rightTabs = tabs.filter(t => t.position === 'right');

    return (
        <div className="tab-navigation">
            <div className="tab-navigation__left">
                {leftTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`tab-navigation__tab ${activeTab === tab.id ? 'tab-navigation__tab--active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {rightTabs.length > 0 && (
                <div className="tab-navigation__right">
                    {rightTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`tab-navigation__tab ${activeTab === tab.id ? 'tab-navigation__tab--active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
