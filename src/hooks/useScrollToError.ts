import { useCallback } from 'react';
import type { FieldErrors } from 'react-hook-form';

export interface UseScrollToErrorOptions {
  tabIndex?: number;
  setTabIndex?: (tabIndex: number) => void;
  setActiveTab?: (tabIndex: number) => void;
  tabFieldMap?: Record<number, string[]>;
  fieldLabels?: Record<string, string>;
}

export function useScrollToError(options: UseScrollToErrorOptions = {}) {
  const { tabFieldMap, setTabIndex, setActiveTab, fieldLabels = {} } = options;
  const switchTab = setTabIndex || setActiveTab;

  /**
   * Navega a la pestaña correspondiente y enfoca/scrollea al campo específico
   */
  const scrollToField = useCallback((fieldName: string) => {
    // 1. Si el formulario tiene pestañas, cambiar a la pestaña donde reside el campo
    if (tabFieldMap && switchTab) {
      for (const [tabIndexStr, fieldList] of Object.entries(tabFieldMap)) {
        if (fieldList.includes(fieldName)) {
          switchTab(Number(tabIndexStr));
          break;
        }
      }
    }

    // 2. Dar tiempo para que el DOM de la pestaña se monte o despliegue
    window.setTimeout(() => {
      let targetElement = document.querySelector(`[name="${fieldName}"]`) as HTMLElement | null;

      if (!targetElement) {
        targetElement = document.getElementById(fieldName);
      }

      if (!targetElement) {
        targetElement = document.querySelector(`[data-fieldname="${fieldName}"]`) as HTMLElement | null;
      }

      if (!targetElement) {
        targetElement = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
      }

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const focusable = targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'SELECT'
          ? targetElement
          : targetElement.querySelector('input, textarea, select, [tabindex="0"]') as HTMLElement | null;

        if (focusable) {
          focusable.focus();
        } else {
          targetElement.focus();
        }
      }
    }, 120);
  }, [tabFieldMap, switchTab]);

  /**
   * Manejador para clics en los chips de error del banner resumen
   */
  const handleFieldClick = useCallback((fieldName: string) => {
    scrollToField(fieldName);
  }, [scrollToField]);

  /**
   * Manejador estándar de onError en handleSubmit(onSubmit, onError)
   */
  const scrollToFirstError = useCallback((errors: FieldErrors<any>) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;
    scrollToField(errorKeys[0]);
  }, [scrollToField]);

  return {
    scrollToFirstError,
    scrollToField,
    handleFieldClick,
    fieldLabels
  };
}
