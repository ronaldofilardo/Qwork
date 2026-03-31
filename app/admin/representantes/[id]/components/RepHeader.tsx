'use client';

import Link from 'next/link';
import type { RepProfile } from '../types';
import {
  STATUS_BADGE,
  TRANSICOES,
  ACAO_LABEL,
  formatCNPJ,
  formatCPF,
  formatDate,
} from '../constants';

interface RepHeaderProps {
  rep: RepProfile;
  sucesso: string;
  onSetAcaoPendente: (v: { novoStatus: string }) => void;
}

export function RepHeader({ rep, sucesso, onSetAcaoPendente }: RepHeaderProps) {
  return (
    <>
      {/* Barra superior */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/representantes"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Representantes
        </Link>
        {sucesso && (
          <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            {sucesso}
          </span>
        )}
      </div>

      {/* Header do representante */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{rep.nome}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  STATUS_BADGE[rep.status] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {rep.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {rep.tipo_pessoa === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>{rep.email}</span>
              {rep.telefone && <span>{rep.telefone}</span>}
              <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                Código: {rep.codigo}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
              <span>
                {rep.tipo_pessoa === 'pf' ? 'CPF' : 'CNPJ'}:{' '}
                {rep.tipo_pessoa === 'pf'
                  ? formatCPF(rep.cpf)
                  : formatCNPJ(rep.cnpj)}
              </span>
              <span>Cadastrado em {formatDate(rep.criado_em)}</span>
              {rep.aprovado_em && (
                <span>Aprovado em {formatDate(rep.aprovado_em)}</span>
              )}
            </div>

            {/* Dados bancários */}
            {rep.banco_codigo || rep.pix_chave || rep.dados_bancarios_status ? (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Dados Bancários
                  </span>
                  {rep.dados_bancarios_status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        rep.dados_bancarios_status === 'confirmado'
                          ? 'bg-green-100 text-green-700'
                          : rep.dados_bancarios_status === 'solicitado'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {rep.dados_bancarios_status === 'confirmado'
                        ? '✅ Confirmado'
                        : rep.dados_bancarios_status === 'solicitado'
                          ? '⏳ Solicitado'
                          : rep.dados_bancarios_status}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {rep.banco_codigo && (
                    <span>
                      Banco:{' '}
                      <span className="text-gray-700 font-medium">
                        {rep.banco_codigo}
                      </span>
                    </span>
                  )}
                  {rep.agencia && (
                    <span>
                      Agência:{' '}
                      <span className="text-gray-700 font-medium">
                        {rep.agencia}
                      </span>
                    </span>
                  )}
                  {rep.conta && (
                    <span>
                      Conta:{' '}
                      <span className="text-gray-700 font-medium">
                        {rep.conta}
                        {rep.tipo_conta ? ` (${rep.tipo_conta})` : ''}
                      </span>
                    </span>
                  )}
                  {rep.titular_conta && (
                    <span>
                      Titular:{' '}
                      <span className="text-gray-700 font-medium">
                        {rep.titular_conta}
                      </span>
                    </span>
                  )}
                  {rep.pix_chave && (
                    <span>
                      PIX:{' '}
                      <span className="text-gray-700 font-medium">
                        {rep.pix_chave}
                        {rep.pix_tipo ? ` (${rep.pix_tipo})` : ''}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400 italic">
                  Dados bancários não informados
                </span>
              </div>
            )}
          </div>

          {/* Ações de status */}
          <div className="flex flex-col gap-2">
            {(TRANSICOES[rep.status] ?? []).map((s) => (
              <button
                key={s}
                onClick={() => onSetAcaoPendente({ novoStatus: s })}
                className="text-sm px-4 py-1.5 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors text-left"
              >
                {ACAO_LABEL[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
