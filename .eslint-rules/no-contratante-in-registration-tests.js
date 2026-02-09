/**
 * ESLint Rule: Detectar terminologia "tomador" em arquivos de teste de cadastro
 *
 * Validação: Garante que "tomador" não seja usado em testes de registro/cadastro
 * que já foram refatorados para usar "tomador"
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Detecta uso de terminologia "tomador" em testes de cadastro refatorados',
      category: 'Naming Conventions',
      recommended: true,
    },
  },
  create(context) {
    const filename = context.getFilename();

    // Apenas validar testes de registration
    if (!filename.includes('__tests__/registration')) {
      return {};
    }

    return {
      Identifier(node) {
        if (node.name.toLowerCase().includes('tomador')) {
          context.report({
            node,
            message: `Use "tomador" em vez de "tomador" em testes de cadastro. Encontrado: "${node.name}"`,
          });
        }
      },
      Literal(node) {
        if (typeof node.value === 'string') {
          const str = node.value.toLowerCase();
          if (
            str.includes('tomador') &&
            !str.includes('deprecated') &&
            !filename.includes('deprecated')
          ) {
            context.report({
              node,
              message: `String contém "tomador". Use "tomador" em vez disso.`,
            });
          }
        }
      },
    };
  },
};
