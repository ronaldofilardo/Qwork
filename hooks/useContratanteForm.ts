/**
 * hooks/usetomadorForm.ts
 *
 * Hook customizado para gerenciar estado e validação do formulário de tomador
 *
 * EXTRAÍDO DE: components/modals/ModalCadastrotomador.tsx (1892 linhas)
 * BENEFÍCIO: Reutilizável, testável isoladamente, separação de responsabilidades
 */

import { useState, useCallback } from 'react';
import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const ContracanteFormSchema = z.object({
  tipo: z.enum(['clinica', 'entidade']),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ inválido (14 dígitos)'),
  responsavel_nome: z.string().min(3, 'Nome do responsável obrigatório'),
  responsavel_cpf: z.string().regex(/^\d{11}$/, 'CPF inválido (11 dígitos)'),
  responsavel_email: z.string().email('E-mail inválido'),
  responsavel_telefone: z.string().min(10, 'Telefone inválido'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  cep: z
    .string()
    .regex(/^\d{8}$/, 'CEP inválido (8 dígitos)')
    .optional(),
  plano_id: z.number().int().positive('Plano obrigatório'),
});

export type tomadorFormData = z.infer<typeof ContracanteFormSchema>;

// ============================================================================
// HOOK
// ============================================================================

export function usetomadorForm(initialData?: Partial<tomadorFormData>) {
  const [formData, setFormData] = useState<Partial<tomadorFormData>>(
    initialData || { tipo: 'clinica' }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (field: keyof tomadorFormData, value: any) => {
      try {
        const fieldSchema = ContracanteFormSchema.shape[field];
        fieldSchema.parse(value);

        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });

        return true;
      } catch (err) {
        if (err instanceof z.ZodError) {
          setErrors((prev) => ({
            ...prev,
            [field]: err.errors[0].message,
          }));
        }
        return false;
      }
    },
    []
  );

  const validateAll = useCallback(() => {
    try {
      ContracanteFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData]);

  const updateField = useCallback(
    (field: keyof tomadorFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      validateField(field, value);
    },
    [validateField]
  );

  const resetForm = useCallback(() => {
    setFormData(initialData || { tipo: 'clinica' });
    setErrors({});
    setIsSubmitting(false);
  }, [initialData]);

  const submitForm = useCallback(
    async (onSubmit: (data: tomadorFormData) => Promise<void>) => {
      if (!validateAll()) {
        return false;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(formData as tomadorFormData);
        return true;
      } catch (error) {
        console.error('Erro ao submeter formulário:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateAll]
  );

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    validateField,
    validateAll,
    resetForm,
    submitForm,
  };
}
