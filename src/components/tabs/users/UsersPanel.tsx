import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccess, showError, showConfirm, showWarning } from '@/utils/sweetalert';
import type { UserDocument } from '@/types';
import './UsersPanel.css';

export default function UsersPanel() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<(UserDocument & { id: string })[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'visitor'>('visitor');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as UserDocument & { id: string }));
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
            showError('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const validateEmail = (email: string): boolean => {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        return gmailRegex.test(email);
    };

    const handleAddUser = async () => {
        if (!newUserEmail.trim()) {
            showWarning('Por favor ingrese un email');
            return;
        }

        if (!validateEmail(newUserEmail)) {
            showError('El email debe ser una cuenta de Gmail (@gmail.com)');
            return;
        }

        if (users.some(u => u.email === newUserEmail)) {
            showError('Este usuario ya existe');
            return;
        }

        try {
            await setDoc(doc(db, 'users', newUserEmail), {
                email: newUserEmail,
                role: newUserRole,
                createdAt: serverTimestamp(),
                createdBy: currentUser?.email || 'unknown'
            });

            showSuccess('Usuario agregado exitosamente');
            setShowAddModal(false);
            setNewUserEmail('');
            setNewUserRole('visitor');
            fetchUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            showError('Error al agregar usuario');
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'visitor') => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                updatedAt: serverTimestamp(),
                updatedBy: currentUser?.email || 'unknown'
            });

            showSuccess('Rol actualizado exitosamente');
            fetchUsers();
        } catch (error) {
            console.error('Error updating role:', error);
            showError('Error al actualizar rol');
        }
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (userEmail === currentUser?.email) {
            showWarning('No puedes eliminar tu propio usuario');
            return;
        }

        const confirmed = await showConfirm(
            `¿Estás seguro de eliminar al usuario ${userEmail}?`,
            'Esta acción no se puede deshacer'
        );

        if (confirmed) {
            try {
                await deleteDoc(doc(db, 'users', userId));
                showSuccess('Usuario eliminado exitosamente');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                showError('Error al eliminar usuario');
            }
        }
    };

    if (loading) {
        return <div className="users-panel__loading">Cargando usuarios...</div>;
    }

    return (
        <div className="users-panel">
            <div className="users-panel__header">
                <h2 className="users-panel__title">Gestión de Usuarios</h2>
                <button onClick={() => setShowAddModal(true)} className="users-panel__add-btn">
                    + Agregar Usuario
                </button>
            </div>

            <div className="users-panel__roles-info">
                <h3 className="users-panel__roles-title">Roles y Permisos</h3>
                <ul className="users-panel__roles-list">
                    <li><strong>Administrador:</strong> Puede registrar accidentes, gestionar usuarios y ver todo el contenido</li>
                    <li><strong>Visitante:</strong> Solo puede visualizar datos, sin permisos de edición o gestión</li>
                </ul>
            </div>

            <div className="users-panel__table-container">
                <table className="users-panel__table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.email}</td>
                                <td>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'visitor')}
                                        className="users-panel__role-select"
                                        disabled={user.email === currentUser?.email}
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="visitor">Visitante</option>
                                    </select>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                        className="users-panel__delete-btn"
                                        disabled={user.email === currentUser?.email}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="users-panel__modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="users-panel__modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="users-panel__modal-title">Agregar Nuevo Usuario</h3>
                        <div className="users-panel__modal-content">
                            <div className="users-panel__form-group">
                                <label>Email (debe ser @gmail.com)</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    placeholder="usuario@gmail.com"
                                    className="users-panel__input"
                                />
                            </div>
                            <div className="users-panel__form-group">
                                <label>Rol</label>
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'visitor')}
                                    className="users-panel__select"
                                >
                                    <option value="visitor">Visitante</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                        </div>
                        <div className="users-panel__modal-actions">
                            <button onClick={() => setShowAddModal(false)} className="users-panel__cancel-btn">
                                Cancelar
                            </button>
                            <button onClick={handleAddUser} className="users-panel__submit-btn">
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
