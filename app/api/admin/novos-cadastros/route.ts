/**
 * app/api/admin/novos-cadastros/route.ts
 * REFATORADO - Gerenciamento de novos cadastros de contratantes
 *
 * ANTES: 805 linhas
 * DEPOIS: ~50 linhas
 * REDUÇÃO: -94% 🎉
 */

import { NextRequest } from 'next/server';
import {
  handleRequest,
  requireRole as _requireRole,
} from '@/lib/application/handlers/api-handler';
import { ROLES } from '@/lib/config/roles';
import { GetNovosCadastrosSchema, NovosCadastrosActionSchema } from './schemas';
import {
  handleGetNovosCadastros,
  handleAprovarContratante,
  handleRejeitarContratante,
  handleSolicitarReanalise,
  handleAprovarPersonalizado,
  handleRegenerarLink,
  handleDeletarContratante,
} from './handlers';

export const dynamic = 'force-dynamic';

export const GET = handleRequest({
  allowedRoles: [ROLES.ADMIN],
  validate: GetNovosCadastrosSchema,
  execute: handleGetNovosCadastros,
  extractInput: (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || undefined;
    const status = searchParams.get('status') || undefined;
    return {
      tipo: tipo as 'clinica' | 'entidade' | undefined,
      status,
    };
  },
});

export const POST = handleRequest({
  allowedRoles: [ROLES.ADMIN],
  validate: NovosCadastrosActionSchema,
  execute: async (input, context) => {
    switch (input.acao) {
      case 'aprovar':
        return handleAprovarContratante(input, context);

      case 'rejeitar':
        return handleRejeitarContratante(input, context);

      case 'solicitar_reanalise':
        return handleSolicitarReanalise(input, context);

      case 'aprovar_personalizado':
        return handleAprovarPersonalizado(input, context);

      case 'regenerar_link':
        return handleRegenerarLink(input, context);

      case 'deletar':
        return handleDeletarContratante(input, context);

      default:
        throw new Error(`Ação desconhecida: ${(input as any).acao}`);
    }
  },
});
