/**
 * Componente CPF Mascarado
 *
 * Exibe CPF com mascaramento conforme LGPD
 * Mostra apenas os últimos 4 dígitos por padrão
 */

'use client';

import { useState } from 'react';
import { mascararCPF, formatarCPF } from '@/lib/cpf-utils';

interface CPFMascaradoProps {
  cpf: string;
  /** Permitir revelação completa (apenas para admin) */
  revelarCompleto?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

export default function CPFMascarado({
  cpf,
  revelarCompleto = false,
  className = '',
}: CPFMascaradoProps) {
  const [revelado, setRevelado] = useState(false);

  if (!cpf) {
    return <span className={className}>CPF não informado</span>;
  }

  const cpfExibido = revelado ? formatarCPF(cpf) : mascararCPF(cpf);

  return (
    <span className={`font-mono ${className}`}>
      {cpfExibido}
      {revelarCompleto && (
        <button
          type="button"
          onClick={() => setRevelado(!revelado)}
          className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
          title={revelado ? 'Ocultar CPF' : 'Revelar CPF completo'}
        >
          {revelado ? '🔒 Ocultar' : '👁️ Ver'}
        </button>
      )}
    </span>
  );
}

/**
 * Badge de Status de Consentimento
 */
interface ConsentimentoBadgeProps {
  baseLegal?:
    | 'contrato'
    | 'obrigacao_legal'
    | 'consentimento'
    | 'interesse_legitimo';
  dataConsentimento?: string;
}

export function ConsentimentoBadge({
  baseLegal,
  dataConsentimento,
}: ConsentimentoBadgeProps) {
  if (!baseLegal) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        ⚠️ Sem base legal
      </span>
    );
  }

  const labels = {
    contrato: { text: '📄 Contrato', color: 'bg-blue-100 text-blue-800' },
    obrigacao_legal: {
      text: '⚖️ Obrigação Legal',
      color: 'bg-green-100 text-green-800',
    },
    consentimento: {
      text: '✅ Consentimento',
      color: 'bg-purple-100 text-purple-800',
    },
    interesse_legitimo: {
      text: '🏢 Interesse Legítimo',
      color: 'bg-gray-100 text-gray-800',
    },
  };

  const label = labels[baseLegal] || labels.contrato;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${label.color}`}
      title={
        dataConsentimento
          ? `Registrado em: ${new Date(dataConsentimento).toLocaleDateString('pt-BR')}`
          : undefined
      }
    >
      {label.text}
    </span>
  );
}

/**
 * Indicador de Dados Anonimizados
 */
interface DadosAnonimizadosProps {
  anonimizada: boolean;
  dataAnonimizacao?: string;
}

export function DadosAnonimizados({
  anonimizada,
  dataAnonimizacao,
}: DadosAnonimizadosProps) {
  if (!anonimizada) return null;

  return (
    <div className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300">
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <span>
        Dados Anonimizados
        {dataAnonimizacao && (
          <span className="ml-1 text-xs text-gray-500">
            ({new Date(dataAnonimizacao).toLocaleDateString('pt-BR')})
          </span>
        )}
      </span>
    </div>
  );
}
