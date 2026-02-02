// Script para testar a lógica de findIndex

const todasQuestoesCarregadas = [
  {
    grupoId: 1,
    grupoTitulo: 'G1',
    itemId: 'Q1',
    texto: 'Pergunta 1',
    inversa: false,
  },
  {
    grupoId: 1,
    grupoTitulo: 'G1',
    itemId: 'Q2',
    texto: 'Pergunta 2',
    inversa: false,
  },
  {
    grupoId: 1,
    grupoTitulo: 'G1',
    itemId: 'Q3',
    texto: 'Pergunta 3',
    inversa: false,
  },
];

// Cenário 1: Nenhuma resposta
console.log('\n=== Cenário 1: Nenhuma resposta ===');
const respondidas1 = [];
const proximo1 = todasQuestoesCarregadas.findIndex(
  (q) => !respondidas1.includes(String(q.itemId))
);
console.log('proximo:', proximo1); // Deve ser 0
console.log(
  'currentIndex seria:',
  proximo1 === -1 ? todasQuestoesCarregadas.length : proximo1
);

// Cenário 2: Todas respondidas
console.log('\n=== Cenário 2: Todas respondidas ===');
const respondidas2 = ['Q1', 'Q2', 'Q3'];
const proximo2 = todasQuestoesCarregadas.findIndex(
  (q) => !respondidas2.includes(String(q.itemId))
);
console.log('proximo:', proximo2); // Deve ser -1
console.log(
  'currentIndex seria:',
  proximo2 === -1 ? todasQuestoesCarregadas.length : proximo2
);

// Cenário 3: Array vazio de questões (BUG POTENCIAL)
console.log('\n=== Cenário 3: Array vazio de questões ===');
const todasQuestoesVazio = [];
const respondidas3 = [];
const proximo3 = todasQuestoesVazio.findIndex(
  (q) => !respondidas3.includes(String(q.itemId))
);
console.log('proximo:', proximo3); // -1 porque array está vazio!
console.log(
  'currentIndex seria:',
  proximo3 === -1 ? todasQuestoesVazio.length : proximo3
);
console.log(
  'questaoAtual seria:',
  todasQuestoesVazio[proximo3 === -1 ? todasQuestoesVazio.length : proximo3]
);
console.log(
  '!questaoAtual?',
  !todasQuestoesVazio[proximo3 === -1 ? todasQuestoesVazio.length : proximo3]
);
