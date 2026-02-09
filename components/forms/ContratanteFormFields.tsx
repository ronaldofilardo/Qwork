/**
 * components/forms/ContatanteFormFields.tsx
 *
 * Componente de campos do formulário de tomador (apresentacional)
 *
 * EXTRAÍDO DE: components/modals/ModalCadastrotomador.tsx
 * BENEFÍCIO: Componente puro, facilmente testável, sem lógica de negócio
 */

import React from 'react';

interface tomadorFormFieldsProps {
  formData: {
    tipo?: 'clinica' | 'entidade';
    nome?: string;
    cnpj?: string;
    responsavel_nome?: string;
    responsavel_cpf?: string;
    responsavel_email?: string;
    responsavel_telefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    plano_id?: number;
  };
  errors: Record<string, string>;
  planos: Array<{ id: number; nome: string; tipo: string }>;
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export function tomadorFormFields({
  formData,
  errors,
  planos,
  onChange,
  disabled = false,
}: tomadorFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Tipo de tomador *
        </label>
        <select
          value={formData.tipo || 'clinica'}
          onChange={(e) => onChange('tipo', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="clinica">Clínica</option>
          <option value="entidade">Entidade</option>
        </select>
        {errors.tipo && (
          <span className="text-red-500 text-sm">{errors.tipo}</span>
        )}
      </div>

      {/* Nome */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Nome {formData.tipo === 'clinica' ? 'da Clínica' : 'da Entidade'} *
        </label>
        <input
          type="text"
          value={formData.nome || ''}
          onChange={(e) => onChange('nome', e.target.value)}
          disabled={disabled}
          placeholder="Nome completo"
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.nome && (
          <span className="text-red-500 text-sm">{errors.nome}</span>
        )}
      </div>

      {/* CNPJ */}
      <div>
        <label className="block text-sm font-medium mb-1">CNPJ *</label>
        <input
          type="text"
          value={formData.cnpj || ''}
          onChange={(e) => onChange('cnpj', e.target.value.replace(/\D/g, ''))}
          disabled={disabled}
          placeholder="00000000000000"
          maxLength={14}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.cnpj && (
          <span className="text-red-500 text-sm">{errors.cnpj}</span>
        )}
      </div>

      {/* Responsável - Nome */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Nome do Responsável *
        </label>
        <input
          type="text"
          value={formData.responsavel_nome || ''}
          onChange={(e) => onChange('responsavel_nome', e.target.value)}
          disabled={disabled}
          placeholder="Nome completo"
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.responsavel_nome && (
          <span className="text-red-500 text-sm">
            {errors.responsavel_nome}
          </span>
        )}
      </div>

      {/* Responsável - CPF */}
      <div>
        <label className="block text-sm font-medium mb-1">
          CPF do Responsável *
        </label>
        <input
          type="text"
          value={formData.responsavel_cpf || ''}
          onChange={(e) =>
            onChange('responsavel_cpf', e.target.value.replace(/\D/g, ''))
          }
          disabled={disabled}
          placeholder="00000000000"
          maxLength={11}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.responsavel_cpf && (
          <span className="text-red-500 text-sm">{errors.responsavel_cpf}</span>
        )}
      </div>

      {/* Responsável - Email */}
      <div>
        <label className="block text-sm font-medium mb-1">
          E-mail do Responsável *
        </label>
        <input
          type="email"
          value={formData.responsavel_email || ''}
          onChange={(e) => onChange('responsavel_email', e.target.value)}
          disabled={disabled}
          placeholder="email@exemplo.com"
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.responsavel_email && (
          <span className="text-red-500 text-sm">
            {errors.responsavel_email}
          </span>
        )}
      </div>

      {/* Responsável - Telefone */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Telefone do Responsável *
        </label>
        <input
          type="tel"
          value={formData.responsavel_telefone || ''}
          onChange={(e) =>
            onChange('responsavel_telefone', e.target.value.replace(/\D/g, ''))
          }
          disabled={disabled}
          placeholder="11999999999"
          maxLength={11}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.responsavel_telefone && (
          <span className="text-red-500 text-sm">
            {errors.responsavel_telefone}
          </span>
        )}
      </div>

      {/* Plano */}
      <div>
        <label className="block text-sm font-medium mb-1">Plano *</label>
        <select
          value={formData.plano_id || ''}
          onChange={(e) => onChange('plano_id', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Selecione um plano</option>
          {planos
            .filter((p) => p.tipo === formData.tipo)
            .map((plano) => (
              <option key={plano.id} value={plano.id}>
                {plano.nome}
              </option>
            ))}
        </select>
        {errors.plano_id && (
          <span className="text-red-500 text-sm">{errors.plano_id}</span>
        )}
      </div>

      {/* Campos opcionais: Endereço, Cidade, Estado, CEP */}
      <div className="pt-4 border-t">
        <h3 className="font-medium mb-3">Endereço (opcional)</h3>

        <div className="space-y-3">
          <input
            type="text"
            value={formData.endereco || ''}
            onChange={(e) => onChange('endereco', e.target.value)}
            disabled={disabled}
            placeholder="Rua, número, complemento"
            className="w-full px-3 py-2 border rounded-lg"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={formData.cidade || ''}
              onChange={(e) => onChange('cidade', e.target.value)}
              disabled={disabled}
              placeholder="Cidade"
              className="w-full px-3 py-2 border rounded-lg"
            />

            <input
              type="text"
              value={formData.estado || ''}
              onChange={(e) => onChange('estado', e.target.value.toUpperCase())}
              disabled={disabled}
              placeholder="UF"
              maxLength={2}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <input
            type="text"
            value={formData.cep || ''}
            onChange={(e) => onChange('cep', e.target.value.replace(/\D/g, ''))}
            disabled={disabled}
            placeholder="CEP (8 dígitos)"
            maxLength={8}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
