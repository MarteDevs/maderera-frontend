import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable para manejar el estado del menú móvil
 * Detecta el tamaño de pantalla y controla la visibilidad del sidebar
 */
export function useMobileMenu() {
    const isMobileMenuOpen = ref(false);
    const isMobile = ref(false);

    const MOBILE_BREAKPOINT = 768;

    const checkScreenSize = () => {
        isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
        // Cerrar menú automáticamente si cambiamos a desktop
        if (!isMobile.value && isMobileMenuOpen.value) {
            isMobileMenuOpen.value = false;
        }
    };

    const toggleMenu = () => {
        isMobileMenuOpen.value = !isMobileMenuOpen.value;

        // Prevenir scroll del body cuando el menú está abierto en móvil
        if (isMobileMenuOpen.value) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    const closeMenu = () => {
        isMobileMenuOpen.value = false;
        document.body.style.overflow = '';
    };

    onMounted(() => {
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', checkScreenSize);
        document.body.style.overflow = '';
    });

    return {
        isMobile,
        isMobileMenuOpen,
        toggleMenu,
        closeMenu,
    };
}
