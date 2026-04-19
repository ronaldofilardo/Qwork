# Audit de Testes — QWork
> Gerado em: 2026-04-19T10:08:55.660Z

## Resumo
| Métrica | Valor |
|---------|-------|
| Total arquivos de teste | 651 |
| Total .skip() | 73 |
| describe.skip | 15 |
| it.skip / test.skip | 58 |
| Arquivos obsoletos | 3 |
| Endpoints duplicados | 47 |

## Contagem por Categoria
| Categoria | Arquivos |
|-----------|----------|
| api | 218 |
| integration | 48 |
| database | 41 |
| regression | 30 |
| unit | 5 |
| lib | 93 |
| components | 117 |
| hooks | 7 |
| e2e-jest | 3 |
| security | 20 |
| rls-rbac | 20 |
| cypress | 49 |

## Testes Skipped
| Arquivo | Linha | Tipo | Descrição |
|---------|-------|------|-----------|
| __tests__/api/admin/leads-documentos.test.ts | 174 | it.skip | deve retornar 401 para não autenticado |
| __tests__/api/admin/leads-documentos.test.ts | 178 | it.skip | deve retornar 403 para não admin |
| __tests__/api/admin/leads-documentos.test.ts | 182 | it.skip | deve retornar 400 para ID inválido |
| __tests__/api/auth/login-gestor.test.ts | 48 | it.skip | deve autenticar gestor via entidades_senhas e retornar perfil gestor (temporaria |
| __tests__/api/entidade/lote-detalhes-grupos.test.ts | 209 | it.skip | deve calcular corretamente grupos para avaliação concluída |
| __tests__/api/rh/funcionarios-edit.test.ts | 131 | it.skip | deve atualizar funcionário com sucesso |
| __tests__/api/rh/funcionarios-edit.test.ts | 177 | it.skip | deve retornar erro quando funcionário não existe |
| __tests__/auth/login.test.tsx | 466 | it.skip | deve focar no primeiro campo com erro |
| __tests__/clinica/clinica-spa-integration.test.tsx | 116 | it.skip | toggles sidebar collapse state (feature not implemented) |
| __tests__/components/admin/ModalReativarTomador.test.tsx | 496 | it.skip | deve chamar clipboard.writeText ao copiar login |
| __tests__/components/admin/ModalReativarTomador.test.tsx | 518 | it.skip | deve chamar clipboard.writeText ao copiar senha |
| __tests__/components/clinica/EmpresaFormModal.test.tsx | 257 | it.skip | valida formato de email do representante |
| __tests__/components/EmissorDashboard.test.tsx | 492 | it.skip | deve fazer download do PDF quando botão  |
| __tests__/components/NotificationCenterClinica.test.tsx | 282 | it.skip | deve aplicar ícones corretos para cada tipo de notificação |
| __tests__/components/NotificationCenterClinica.test.tsx | 362 | it.skip | deve fechar painel após navegar |
| __tests__/database/migrations-database-correcoes.integration.test.ts | 67 | it.skip | função deve declarar v_emissor_cpf |
| __tests__/database/migrations-database-correcoes.integration.test.ts | 71 | it.skip | função deve buscar emissor com WHERE ativo = true |
| __tests__/database/migrations-database-correcoes.integration.test.ts | 75 | it.skip | função deve ter fallback para notificacoes_admin |
| __tests__/emissor/emissor-vercel-pdf-integration.test.ts | 298 | it.skip | deve existir ANALYSIS-VERCEL-PDF-ISSUE.md |
| __tests__/emissor/emissor-vercel-pdf-integration.test.ts | 311 | it.skip | deve existir IMPLEMENTATION-CLIENT-SIDE-PDF.md |
| __tests__/emissor/emissor-workflow-improvements.test.ts | 115 | describe.skip | Frontend - Página de Detalhes do Lote (Entidade) |
| __tests__/emissor/emissor-workflow-improvements.test.ts | 166 | describe.skip | Backend - API /api/entidade/lote/[id] |
| __tests__/emissor/emissor-workflow-improvements.test.ts | 233 | describe.skip | Integração - Validação de Estrutura |
| __tests__/emissor/laudo-hash-display.test.tsx | 51 | it.skip | deve exibir hash SHA-256 quando laudo está emitido |
| __tests__/emissor/laudo-hash-display.test.tsx | 191 | it.skip | deve exibir hash quando laudo foi enviado (para auditoria histórica) |
| __tests__/emissor/laudo-hash-display.test.tsx | 255 | it.skip | deve exibir botões corretos quando laudo está emitido |
| __tests__/emissor/laudo-hash-display.test.tsx | 317 | it.skip | deve bloquear edição e emissão quando API indicar bloqueio (emissão automática) |
| __tests__/entidade/lote-detalhes.test.tsx | 92 | it.skip | bloqueia inativação quando lote foi emitido e não mostra opção de forçar |
| __tests__/lib/criarContaResponsavel.integration.test.ts | 17 | it.skip | Deve inserir senha e criar funcionário quando não existir (DB real) |
| __tests__/lib/criarContaResponsavel.integration.test.ts | 96 | it.skip | Deve atualizar senha quando já existir (DB real) |
| __tests__/lib/db-admin-scripts.test.ts | 115 | describe.skip | atualizarSenhaAdmin |
| __tests__/lib/db-admin-scripts.test.ts | 154 | it.skip | deve atualizar a senha com sucesso |
| __tests__/lib/db-emissor.test.ts | 22 | it.skip | deve criar emissor com clinica_id NULL |
| __tests__/lib/db-transaction.test.ts | 95 | it.skip | deve fazer rollback automático se callback lançar erro |
| __tests__/lib/db-transaction.test.ts | 158 | it.skip | deve fazer commit se callback completar com sucesso |
| __tests__/lib/laudo-calculos.test.ts | 380 | it.skip | deve lançar erro se lote não encontrado |
| __tests__/lib/relatorio-dados.test.ts | 163 | it.skip | deve mencionar COPSOQ em recomendações de acompanhamento |
| __tests__/lib/requireRHWithEmpresaAccess.test.ts | 207 | describe.skip | requireRHWithEmpresaAccess - Controle de Acesso Seguro |
| __tests__/lib/session-representante.test.ts | 53 | describe.skip | criarSessaoRepresentante |
| __tests__/representante/representantes-leads-cadastro.test.ts | 1030 | it.skip | busca representantes ativos para o badge |
| __tests__/representante/representantes-leads-cadastro.test.ts | 1035 | it.skip | badge de leads pendentes está na página de representantes (não no admin geral) |
| __tests__/rh/empresa-dashboard-ui.test.tsx | 186 | describe.skip | Paginação Inteligente |
| __tests__/rh/empresa-dashboard-ui.test.tsx | 329 | describe.skip | Busca em Tempo Real |
| __tests__/rh/empresa-dashboard-ui.test.tsx | 499 | describe.skip | Contadores Dinâmicos |
| __tests__/rh/empresa-dashboard-ui.test.tsx | 632 | describe.skip | Estados de Loading |
| __tests__/rh/empresa-dashboard-ui.test.tsx | 755 | it.skip | deve adaptar layout para mobile |
| __tests__/rh/empresa-dashboard-ui.test.tsx | 780 | it.skip | deve exibir paginação em mobile |
| __tests__/rh/empresa-dashboard.test.tsx | 198 | it.skip | deve exibir header com layout horizontal responsivo |
| __tests__/rh/empresa-dashboard.test.tsx | 286 | it.skip | deve exibir lista de funcionários da empresa |
| __tests__/rh/empresa-dashboard.test.tsx | 345 | it.skip | deve usar ID da empresa da URL |
| __tests__/rh/empresa-dashboard.test.tsx | 434 | it.skip | deve filtrar funcionários por empresa específica |
| __tests__/rh/empresa-dashboard.test.tsx | 438 | it.skip | deve atualizar dashboard quando empresa muda |
| __tests__/rh/empresa-dashboard.test.tsx | 533 | describe.skip | Tabela de funcionários otimizada |
| __tests__/rh/funcionarios-bulk.test.tsx | 186 | it.skip | combina múltiplos filtros (setor + nível de cargo) |
| __tests__/rh/funcionarios-bulk.test.tsx | 275 | it.skip | preserva filtros ao navegar entre páginas |
| __tests__/rh/funcionarios-bulk.test.tsx | 383 | it.skip | processa mais de 50 funcionários em massa sem limite |
| __tests__/rh/funcionarios-bulk.test.tsx | 498 | it.skip | exibe mensagem de erro quando operação em massa falha |
| __tests__/rh/funcionarios-bulk.test.tsx | 725 | it.skip | exibe cards individuais de empresas com estatísticas corretas |
| __tests__/rh/lote-detalhes.test.tsx | 232 | it.skip | deve carregar dados do lote após verificação de sessão |
| __tests__/rh/lote-detalhes.test.tsx | 336 | describe.skip | Filtros e Busca |
| __tests__/rh/lote-detalhes.test.tsx | 423 | it.skip | deve voltar para dashboard ao clicar em Voltar |
| __tests__/rh/lote-detalhes.test.tsx | 447 | describe.skip | Geração de Relatório |
| __tests__/rh/lote-detalhes.test.tsx | 506 | describe.skip | Tratamento de Erros |
| __tests__/rh/lote-detalhes.test.tsx | 584 | describe.skip | Campos Opcionais |
| __tests__/rh/lote-relatorio-funcionario.test.tsx | 147 | it.skip | deve renderizar coluna de Ações com botões de relatório |
| __tests__/rh/lote-relatorio-funcionario.test.tsx | 159 | it.skip | deve habilitar botão PDF apenas para avaliações concluídas |
| __tests__/rh/lote-relatorio-funcionario.test.tsx | 180 | it.skip | deve gerar relatório individual quando botão PDF é clicado |
| __tests__/rh/lote-relatorio-funcionario.test.tsx | 212 | it.skip | não deve gerar relatório se usuário cancelar confirmação |
| __tests__/rh/lote-relatorio-funcionario.test.tsx | 241 | it.skip | deve criar link de download com nome correto do arquivo |
| __tests__/rh/lote-relatorio-funcionario.test.tsx | 283 | it.skip | deve mostrar tooltip explicativo em botões desabilitados |
| __tests__/rh/lote-relatorio-funcionario.test.tsx | 301 | it.skip | deve exibir alerta em caso de erro na geração do relatório |
| __tests__/rh/lotes-avaliacao.test.tsx | 189 | it.skip | deve exibir lotes recentes na sidebar |
| __tests__/ui/responsividade-funcionario.test.tsx | 61 | it.skip | deve ter campo data de nascimento com inputMode= |

## Arquivos Obsoletos
| Arquivo | Razão |
|---------|-------|
| __tests__/regression/zapsign-pdf-gerado-assinar-fluxo.test.ts | Marcado como @deprecated/OBSOLETO |
| __tests__/security/audit-senior-implementations.test.ts | Marcado como @deprecated/OBSOLETO |
| __tests__/security/route-auth-guards.test.ts | Marcado como @deprecated/OBSOLETO |

## Duplicatas API vs Integration
| Endpoint | API Test | Integration Test |
|----------|----------|-----------------|
| /api/rh/relatorio-individual-pdf | __tests__/api/rh/relatorio-individual-pdf.test.ts | __tests__/integration/arquitetura-segregada-rh-entidade.test.ts |
| /api/rh/relatorio-individual-pdf/route | __tests__/api/rh/relatorio-individual-pdf.test.ts | __tests__/integration/arquitetura-segregada-rh-entidade.test.ts |
| /api/rh/relatorio-lote-pdf | __tests__/api/rh/relatorio-lote-pdf-corrections.test.ts | __tests__/integration/arquitetura-segregada-rh-entidade.test.ts |
| /api/rh/relatorio-lote-pdf/route | __tests__/api/rh/relatorio-lote-pdf-corrections.test.ts | __tests__/integration/arquitetura-segregada-rh-entidade.test.ts |
| /api/entidade/relatorio-individual-pdf | __tests__/api/entidade/migration-1008-corrections.test.ts | __tests__/integration/arquitetura-segregada-rh-entidade.test.ts |
| /api/entidade/relatorio-individual-pdf/route | __tests__/api/entidade/relatorio-individual-pdf-corrections.test.ts | __tests__/integration/arquitetura-segregada-rh-entidade.test.ts |
| /api/entidade/relatorio-lote-pdf | __tests__/api/entidade/migration-1008-corrections.test.ts | __tests__/integration/arquitetura-segregada-rh-entidade.test.ts |
| /api/entidade/lote/ | __tests__/api/entidade/lote-avaliacoes-inativar.test.ts | __tests__/integration/arquitetura-segregada-rh-entidade.test.ts |
| /api/entidade/relatorio-lote-pdf/route | __tests__/api/entidade/relatorio-lote-pdf-corrections.test.ts | __tests__/integration/arquitetura-segregada-rh-entidade.test.ts |
| /api/pagamento/asaas/criar/route | __tests__/api/pagamento/asaas-criar-isento.test.ts | __tests__/integration/asaas-webhook-lote-sync.test.ts |
| /api/auth/session | __tests__/api/auth/session.test.ts | __tests__/integration/avaliacao-q37-modal.test.tsx |
| /api/avaliacao/todas | __tests__/api/rbac/avaliacao-role-check.test.ts | __tests__/integration/avaliacao-q37-modal.test.tsx |
| /api/avaliacao/status | __tests__/api/avaliacao/status.test.ts | __tests__/integration/avaliacao-q37-modal.test.tsx |
| /api/avaliacao/respostas-all | __tests__/api/avaliacao/respostas-all.test.ts | __tests__/integration/avaliacao-q37-modal.test.tsx |
| /api/pagamento/iniciar | __tests__/api/pagamento/iniciar.test.ts | __tests__/integration/cleanup-seed-payment-flow.test.ts |
| /api/entidade/account-info/route | __tests__/api/entidade/account-info.enum-fallback.test.ts | __tests__/integration/correcoes-completas.test.ts |
| /api/entidade/account-info | __tests__/api/entidade/account-info.enum-fallback.test.ts | __tests__/integration/correcoes-completas.test.ts |
| /api/emissor/laudos/ | __tests__/api/emissor/fluxo-emissao-laudo.test.ts | __tests__/integration/emissor/emissao-manual-fluxo.test.ts |
| /api/auth/session | __tests__/api/auth/session.test.ts | __tests__/integration/empresa-dashboard-refatorada.test.tsx |
| /api/rh/empresas | __tests__/api/rh/empresas-security-validation.test.ts | __tests__/integration/empresa-dashboard-refatorada.test.tsx |
| /api/rh/dashboard | __tests__/api/rh/dashboard.test.ts | __tests__/integration/empresa-dashboard-refatorada.test.tsx |
| /api/rh/funcionarios | __tests__/api/rh/funcionarios-access-map.test.ts | __tests__/integration/empresa-dashboard-refatorada.test.tsx |
| /api/rh/lotes | __tests__/api/rh/lotes-fila-emissao-compat.test.ts | __tests__/integration/empresa-dashboard-refatorada.test.tsx |
| /api/rh/laudos | __tests__/api/rh/laudos.test.ts | __tests__/integration/empresa-dashboard-refatorada.test.tsx |
| /api/rh/pendencias | __tests__/api/rh/pendencias.block-admin.test.ts | __tests__/integration/empresa-dashboard-refatorada.test.tsx |
| /api/rh/empresas | __tests__/api/rh/empresas-security-validation.test.ts | __tests__/integration/empresa-modal-interaction.test.tsx |
| /api/rh/dashboard | __tests__/api/rh/dashboard.test.ts | __tests__/integration/empresa-modal-interaction.test.tsx |
| /api/auth/session | __tests__/api/auth/session.test.ts | __tests__/integration/empresa-status-display.test.tsx |
| /api/rh/empresas | __tests__/api/rh/empresas-security-validation.test.ts | __tests__/integration/empresa-status-display.test.tsx |
| /api/entidade/funcionarios/route | __tests__/api/entidade/funcionarios-auth.test.ts | __tests__/integration/entidade-create-funcionario.e2e.test.ts |
| /api/entidade/funcionarios | __tests__/api/entidade/funcionarios-auth.test.ts | __tests__/integration/entidade-create-funcionario.e2e.test.ts |
| /api/entidade/lotes/route | __tests__/api/entidade/lotes-fila-emissao-compat.test.ts | __tests__/integration/entidade-lotes-contratante.integration.test.ts |
| /api/entidade/lotes/route | __tests__/api/entidade/lotes-fila-emissao-compat.test.ts | __tests__/integration/entidade-lotes-tomador.integration.test.ts |
| /api/entidade/liberar-lote | __tests__/api/entidade/liberar-lote.test.ts | __tests__/integration/gestor/gestor-refactoring.test.ts |
| /api/entidade/liberar-lote/route | __tests__/api/avaliacoes-status-iniciada.test.ts | __tests__/integration/gestor/gestor-refactoring.test.ts |
| /api/rh/liberar-lote/route | __tests__/api/avaliacoes-status-iniciada.test.ts | __tests__/integration/liberar-lote-rh-resilience.test.ts |
| /api/pagamento/iniciar | __tests__/api/pagamento/iniciar.test.ts | __tests__/integration/pagamento-iniciar-fallback.test.ts |
| /api/pagamento/iniciar/route | __tests__/api/pagamento/iniciar.test.ts | __tests__/integration/pagamento-iniciar-fallback.test.ts |
| /api/representante/cadastro/route | __tests__/api/representante/cadastro.test.ts | __tests__/integration/representante-flows.test.ts |
| /api/representante/cadastro | __tests__/api/representante/cadastro.test.ts | __tests__/integration/representante-flows.test.ts |
| /api/representante/me/route | __tests__/api/representante/me.test.ts | __tests__/integration/representante-flows.test.ts |
| /api/representante/leads/route | __tests__/api/representante/leads.test.ts | __tests__/integration/representante-flows.test.ts |
| /api/representante/leads | __tests__/api/representante/leads.test.ts | __tests__/integration/representante-flows.test.ts |
| /api/admin/representantes/ | __tests__/api/admin/representantes-status.test.ts | __tests__/integration/representante-flows.test.ts |
| /api/admin/representantes/1/status | __tests__/api/admin/representantes-status.test.ts | __tests__/integration/representante-flows.test.ts |
| /api/admin/comissoes/ | __tests__/api/admin/comissoes-acao.test.ts | __tests__/integration/representante-flows.test.ts |
| /api/admin/comissoes/1 | __tests__/api/admin/comissoes-acao.test.ts | __tests__/integration/representante-flows.test.ts |