# Política de Testes — Senhas (TESTING-SENHAS)

⚠️ Objetivo

Este documento registra a política de testes relacionada ao manuseio de senhas e operações sensíveis em toda a base de código. Ele é parte do processo de auditoria do repositório e deve ser referenciado por todos os testes que lidem com autenticação, hashes e operações sobre `entidades_senhas`.

Proibições absolutas

- É EXPRESSAMENTE PROIBIDO executar seeds, escritas ou quaisquer operações em bancos de produção (ex.: nr-bps_db) durante testes automatizados.
- É EXPRESSAMENTE PROIBIDO usar senhas reais, hashes reais de produção ou referências a dados reais de contratantes/funcionários dentro dos testes.
- Testes não devem conter literais com o nome do banco de produção.

Condições obrigatórias para testes de senha

- Todos os testes devem usar mocks para o banco (`@/lib/db`) e para a biblioteca de hashing (`bcryptjs` ou mock adequado).
- Os dados usados nos testes devem ser 100% fictícios (senhas, CPFs, cnpjs, nomes).
- Devem existir asserções que garantam que o `TEST_DATABASE_URL` aponta para um banco de teste (ex: contém `_test`).
- Se um teste precisa simular limpeza de dados, a função só pode ser permitida sob NODE_ENV=test e deve ser feita via função segura mockada (ex.: `fn_limpar_senhas_teste()`), nunca executando deletes em produção.

Boas práticas

- Incluir o cabeçalho de política (ou referenciar este documento) em qualquer arquivo de teste que opere com senhas.
- Escrever testes que validem explicitamente que nenhuma SQL contendo `entidades_senhas` está sendo usada para escrita nos testes.
- Documentar quaisquer exceções (aprovadas por revisor senior) no PR que introduzir a exceção.

Auditoria e monitoramento

- Este documento deve ser mantido e revisado sempre que houver mudanças nas políticas de segurança ou no esquema de senhas.
- Alterações significativas exigem revisão de segurança e assinatura do PR por membro senior.

---

Arquivo gerado automaticamente em 2025-12-23 por ferramentas de garantia de qualidade.
