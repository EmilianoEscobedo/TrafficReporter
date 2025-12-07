import Swal from 'sweetalert2';

export const showSuccess = (message: string, title: string = '¡Éxito!') => {
    return Swal.fire({
        icon: 'success',
        title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#0f766e',
        timer: 3000,
        timerProgressBar: true,
    });
};

export const showError = (message: string, title: string = 'Error') => {
    return Swal.fire({
        icon: 'error',
        title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#0f766e',
    });
};

export const showWarning = (message: string, title: string = 'Atención') => {
    return Swal.fire({
        icon: 'warning',
        title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#0f766e',
    });
};

export const showInfo = (message: string, title: string = 'Información') => {
    return Swal.fire({
        icon: 'info',
        title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#0f766e',
    });
};

export const showConfirm = async (
    message: string,
    title: string = '¿Estás seguro?',
    confirmText: string = 'Sí, continuar',
    cancelText: string = 'Cancelar'
): Promise<boolean> => {
    const result = await Swal.fire({
        icon: 'question',
        title,
        text: message,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: '#0f766e',
        cancelButtonColor: '#dc2626',
        reverseButtons: true,
    });

    return result.isConfirmed;
};

export const showToast = (message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
    });

    return Toast.fire({
        icon,
        title: message,
    });
};

export const showLoading = (message: string = 'Cargando...') => {
    return Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
};

export const closeLoading = () => {
    Swal.close();
};
