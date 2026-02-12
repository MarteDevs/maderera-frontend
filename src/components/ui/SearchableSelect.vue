<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ChevronDown, Check, X } from 'lucide-vue-next';

interface Option {
    [key: string]: any;
}

const props = defineProps({
    modelValue: {
        type: [String, Number, Object],
        default: null
    },
    options: {
        type: Array as () => Option[],
        required: true
    },
    labelKey: {
        type: String,
        default: 'label'
    },
    valueKey: {
        type: String,
        default: 'value'
    },
    placeholder: {
        type: String,
        default: 'Seleccionar...'
    },
    disabled: {
        type: Boolean,
        default: false
    },
    dense: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'change', 'select', 'next']);

const isOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const highlightedIndex = ref(-1);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' });

// Initialize search query with selected option label if exists
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        const selected = props.options.find(opt => opt[props.valueKey] === newVal);
        if (selected) {
            searchQuery.value = selected[props.labelKey];
        } else if (!isOpen.value) {
            searchQuery.value = '';
        }
    } else if (!isOpen.value) {
        searchQuery.value = '';
    }
}, { immediate: true });

const filteredOptions = computed(() => {
    if (!searchQuery.value) return props.options;
    
    const selected = props.options.find(opt => opt[props.valueKey] === props.modelValue);
    if (selected && selected[props.labelKey] === searchQuery.value) {
        return props.options;
    }

    const query = searchQuery.value.toLowerCase();
    return props.options.filter(option => 
        String(option[props.labelKey]).toLowerCase().includes(query)
    );
});

watch(filteredOptions, (newOptions) => {
    // Auto-highlight first option when filtering changes to allow quick "Enter" selection
    if (newOptions.length > 0 && searchQuery.value) {
        highlightedIndex.value = 0;
    } else {
        highlightedIndex.value = -1;
    }
});

const updateDropdownPosition = () => {
    if (isOpen.value && containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect();
        dropdownStyle.value = {
            top: `${rect.bottom + window.scrollY + 4}px`,
            left: `${rect.left + window.scrollX}px`,
            width: `${rect.width}px`
        };
    }
};

const toggleDropdown = async (event?: Event) => {
    if (props.disabled) return;
    
    // Prevent closing if we clicked the input itself (since focus handles opening)
    if (event && event.target === inputRef.value) {
        return;
    }

    if (!isOpen.value) {
        isOpen.value = true;
        updateDropdownPosition();
        await nextTick();
        inputRef.value?.focus();
    } else {
        isOpen.value = false;
    }
};

const selectOption = (option: Option) => {
    emit('update:modelValue', option[props.valueKey]);
    emit('change', option);
    emit('select', option);
    searchQuery.value = option[props.labelKey];
    isOpen.value = false;
    highlightedIndex.value = -1;
};

const clearSelection = (e: Event) => {
    e.stopPropagation();
    emit('update:modelValue', null);
    emit('change', null);
    searchQuery.value = '';
    isOpen.value = false;
    inputRef.value?.focus();
};

const scrollSelectedIntoView = (index: number) => {
    if (!dropdownRef.value) return;
    const el = dropdownRef.value.querySelector(`.dropdown-item:nth-child(${index + 1})`);
    if (el) {
        el.scrollIntoView({ block: 'nearest' });
    }
};

const onKeydown = (e: KeyboardEvent) => {
    if (props.disabled) return;

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (!isOpen.value) {
                toggleDropdown();
                highlightedIndex.value = 0;
            } else {
                if (highlightedIndex.value < filteredOptions.value.length - 1) {
                    highlightedIndex.value++;
                    scrollSelectedIntoView(highlightedIndex.value);
                }
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (isOpen.value) {
                if (highlightedIndex.value > 0) {
                    highlightedIndex.value--;
                    scrollSelectedIntoView(highlightedIndex.value);
                }
            }
            break;
        case 'Enter':
            e.preventDefault();
            if (isOpen.value) {
                const optionToSelect = filteredOptions.value[highlightedIndex.value] || filteredOptions.value[0];
                if (optionToSelect) {
                    selectOption(optionToSelect);
                }
            } else {
                // If closed and enter is pressed, emit next to move focus
                emit('next'); 
            }
            break;
        case 'Escape':
            isOpen.value = false;
            inputRef.value?.blur();
            break;
        case 'Tab':
            isOpen.value = false;
            break;
    }
};

// Handle Click Outside
const handleClickOutside = (event: MouseEvent) => {
    // Check if click is inside container OR inside the teleported dropdown
    const isClickInsideContainer = containerRef.value && containerRef.value.contains(event.target as Node);
    const isClickInsideDropdown = dropdownRef.value && dropdownRef.value.contains(event.target as Node);

    if (!isClickInsideContainer && !isClickInsideDropdown) {
        isOpen.value = false;
        const selected = props.options.find(opt => opt[props.valueKey] === props.modelValue);
        if (selected) {
            searchQuery.value = selected[props.labelKey];
        } else {
            searchQuery.value = '';
        }
    }
};

// Handle Scroll/Resize to update position
const handleScrollResize = () => {
    if (isOpen.value) {
        updateDropdownPosition();
    }
};

onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);
});

onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside);
    window.removeEventListener('scroll', handleScrollResize, true);
    window.removeEventListener('resize', handleScrollResize);
});

const onFocus = () => {
    if (!props.disabled) {
        isOpen.value = true;
        updateDropdownPosition();
    }
};

const focus = () => {
    inputRef.value?.focus();
};

defineExpose({ focus });
</script>

<template>
    <div class="searchable-select" ref="containerRef" :class="{ 'disabled': disabled, 'dense': dense }">
        <div class="input-wrapper" @click="toggleDropdown($event)">
            <input 
                ref="inputRef"
                type="text" 
                v-model="searchQuery" 
                :placeholder="placeholder"
                :disabled="disabled"
                @focus="onFocus"
                @keydown="onKeydown"
                class="search-input"
            />
            <div class="controls">
                <button 
                    v-if="modelValue && !disabled" 
                    @click="clearSelection" 
                    class="btn-clear" 
                    type="button"
                >
                    <X class="icon-xs" />
                </button>
                <ChevronDown class="icon-chevron" :class="{ 'rotated': isOpen }" />
            </div>
        </div>

        <Teleport to="body">
            <div 
                v-if="isOpen" 
                ref="dropdownRef"
                class="dropdown-menu-teleported"
                :style="dropdownStyle"
            >
                <template v-if="filteredOptions.length > 0">
                    <div 
                        v-for="(option, index) in filteredOptions" 
                        :key="option[valueKey]"
                        class="dropdown-item"
                        :class="{ 
                            'selected': option[valueKey] === modelValue,
                            'highlighted': index === highlightedIndex
                        }"
                        @click="selectOption(option)"
                    >
                        <span>{{ option[labelKey] }}</span>
                        <Check v-if="option[valueKey] === modelValue" class="icon-check" />
                    </div>
                </template>
                <div v-else class="no-results">
                    No se encontraron resultados
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.searchable-select {
    position: relative;
    width: 100%;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    transition: all 0.2s;
    cursor: text;
}

.searchable-select:not(.disabled) .input-wrapper:hover {
    border-color: #9ca3af;
}

.searchable-select:not(.disabled) .input-wrapper:focus-within {
    border-color: #8B1E1E;
    box-shadow: 0 0 0 3px rgba(139, 30, 30, 0.1);
}

.search-input {
    width: 100%;
    border: none;
    background: transparent;
    padding: 0.75rem 1rem;
    padding-right: 3.5rem;
    font-size: 0.95rem;
    color: #111827;
    outline: none;
    border-radius: 8px;
}

/* Dense Mode Polish */
.dense .search-input {
    padding: 0.4rem 0.75rem;
    padding-right: 3rem;
    font-size: 0.85rem;
}

.controls {
    position: absolute;
    right: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.btn-clear {
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0.25rem;
    border-radius: 50%;
    transition: all 0.2s;
}

.btn-clear:hover {
    background: #f3f4f6;
    color: #4b5563;
}

.icon-chevron {
    width: 14px;
    height: 14px;
    color: #9ca3af;
    transition: transform 0.2s;
    pointer-events: none;
}

.icon-chevron.rotated {
    transform: rotate(180deg);
}

.icon-xs {
    width: 14px;
    height: 14px;
}

/* Disabled state */
.searchable-select.disabled .input-wrapper {
    background: #f9fafb;
    cursor: not-allowed;
}

.searchable-select.disabled .search-input {
    color: #9ca3af;
    cursor: not-allowed;
}
</style>

<style>
/* Global styles for teleported dropdown */
.dropdown-menu-teleported {
    position: absolute; /* Relative to body/window due to teleport */
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    max-height: 250px;
    overflow-y: auto;
    z-index: 9999; /* High z-index to sit on top of everything */
    padding: 0.25rem;
    box-sizing: border-box;
}

.dropdown-menu-teleported .dropdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    color: #374151;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.1s;
}

.dropdown-menu-teleported .dropdown-item:hover,
.dropdown-menu-teleported .dropdown-item.highlighted {
    background: #f3f4f6;
}

.dropdown-menu-teleported .dropdown-item.selected {
    background: #fef2f2;
    color: #8B1E1E;
    font-weight: 500;
}

.dropdown-menu-teleported .no-results {
    padding: 0.75rem;
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
}

.dropdown-menu-teleported .icon-check {
    width: 16px;
    height: 16px;
    color: #8B1E1E;
}
</style>
