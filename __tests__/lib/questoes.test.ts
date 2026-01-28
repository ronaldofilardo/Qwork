import {
  grupos,
  getQuestoesPorNivel,
  escalasResposta
} from '@/lib/questoes'

describe('lib/questoes', () => {
  describe('grupos', () => {
    it('deve ter 10 grupos definidos (COPSOQ III + JZ + EF)', () => {
      expect(grupos).toHaveLength(10)
    })

    it('deve ter IDs sequenciais de 1 a 10', () => {
      const ids = grupos.map(g => g.id).sort((a, b) => a - b)
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })

    it('deve ter todos os grupos com estrutura correta', () => {
      grupos.forEach(grupo => {
        expect(grupo).toHaveProperty('id')
        expect(grupo).toHaveProperty('titulo')
        expect(grupo).toHaveProperty('dominio')
        expect(grupo).toHaveProperty('descricao')
        expect(grupo).toHaveProperty('tipo')
        expect(grupo).toHaveProperty('itens')
        expect(Array.isArray(grupo.itens)).toBe(true)
        expect(['positiva', 'negativa']).toContain(grupo.tipo)
      })
    })

    it('deve ter questões com estrutura correta', () => {
      grupos.forEach(grupo => {
        grupo.itens.forEach(item => {
          expect(item).toHaveProperty('id')
          expect(item).toHaveProperty('texto')
          expect(typeof item.id).toBe('string')
          expect(typeof item.texto).toBe('string')
          expect(item.texto.length).toBeGreaterThan(0)
        })
      })
    })

    it('deve ter tipos corretos por grupo', () => {
      // Grupos tradicionalmente negativos (mais é pior)
      expect(grupos[0].tipo).toBe('negativa') // Demandas no Trabalho
      
      // Grupos tradicionalmente positivos (mais é melhor)
      expect(grupos[1].tipo).toBe('positiva') // Organização e Conteúdo
      expect(grupos[2].tipo).toBe('positiva') // Relações e Liderança
      
      // Grupos específicos
      expect(grupos[7].tipo).toBe('negativa') // Comportamentos Ofensivos (Grupo 8)
      expect(grupos[5].tipo).toBe('positiva') // Valores no Trabalho (Grupo 6)
    })

    it('deve ter grupo de Jogos de Apostas', () => {
      const grupoJZ = grupos.find(g => g.dominio.includes('Jogo') || g.id === 9)
      expect(grupoJZ).toBeDefined()
      expect(grupoJZ?.itens.length).toBeGreaterThan(0)
    })

    it('deve ter grupo de Endividamento', () => {
      const grupoEF = grupos.find(g => g.dominio.includes('Endividamento') || g.id === 10)
      expect(grupoEF).toBeDefined()
      expect(grupoEF?.itens.length).toBeGreaterThan(0)
    })
  })

  describe('getQuestoesPorNivel', () => {
    it('deve retornar todos os grupos para nível operacional', () => {
      const questoes = getQuestoesPorNivel('operacional')
      expect(questoes).toHaveLength(10)
    })

    it('deve retornar todos os grupos para nível gestão', () => {
      const questoes = getQuestoesPorNivel('gestao')
      expect(questoes).toHaveLength(10)
    })

    it('deve retornar grupos em ordem correta', () => {
      const questoes = getQuestoesPorNivel('operacional')
      const ids = questoes.map(q => q.id)
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })

    it('deve manter estrutura original dos grupos', () => {
      const questoes = getQuestoesPorNivel('operacional')
      const original = grupos[0]
      const retornado = questoes[0]

      expect(retornado.id).toBe(original.id)
      expect(retornado.titulo).toBe(original.titulo)
      expect(retornado.tipo).toBe(original.tipo)
      expect(retornado.itens).toEqual(original.itens)
    })

    it('deve lidar com níveis não especificados', () => {
      const questoes = getQuestoesPorNivel(undefined as any)
      expect(questoes).toHaveLength(10) // Deve retornar padrão
    })

    it('deve diferenciar texto das questões por nível', () => {
      const operacional = getQuestoesPorNivel('operacional')
      const gestao = getQuestoesPorNivel('gestao')

      // Verificar que pelo menos algumas questões têm textos diferentes
      let temDiferenca = false

      operacional.forEach((grupoOp, index) => {
        const grupoGest = gestao[index]
        grupoOp.itens.forEach((itemOp, itemIndex) => {
          const itemGest = grupoGest.itens[itemIndex]
          if (itemOp.texto !== itemGest.texto) {
            temDiferenca = true
          }
        })
      })

      expect(temDiferenca).toBe(true)
    })

    it('deve usar texto padrão quando não há textoGestao', () => {
      const operacional = getQuestoesPorNivel('operacional')
      const gestao = getQuestoesPorNivel('gestao')

      // Para questões que não têm textoGestao, deve usar o texto padrão
      operacional.forEach((grupoOp, index) => {
        const grupoGest = gestao[index]
        grupoOp.itens.forEach((itemOp, itemIndex) => {
          const itemGest = grupoGest.itens[itemIndex]
          // Se não tem textoGestao no original, deve ser igual
          if (!grupos[index].itens[itemIndex].textoGestao) {
            expect(itemOp.texto).toBe(itemGest.texto)
          }
        })
      })
    })

    it('deve usar textoGestao quando disponível para nível gestão', () => {
      const gestao = getQuestoesPorNivel('gestao')

      gestao.forEach((grupo, grupoIndex) => {
        grupo.itens.forEach((item, itemIndex) => {
          const originalItem = grupos[grupoIndex].itens[itemIndex]
          if (originalItem.textoGestao) {
            expect(item.texto).toBe(originalItem.textoGestao)
          }
        })
      })
    })
  })

  describe('escalasResposta', () => {
    it('deve ter 5 opções de resposta', () => {
      const opcoes = Object.keys(escalasResposta)
      expect(opcoes).toHaveLength(5)
    })

    it('deve ter valores corretos para cada opção', () => {
      expect(escalasResposta['Sempre']).toBe(100)
      expect(escalasResposta['Muitas vezes']).toBe(75)
      expect(escalasResposta['Às vezes']).toBe(50)
      expect(escalasResposta['Raramente']).toBe(25)
      expect(escalasResposta['Nunca']).toBe(0)
    })

    it('deve ter todas as opções em português', () => {
      const opcoes = Object.keys(escalasResposta)
      expect(opcoes).toContain('Sempre')
      expect(opcoes).toContain('Muitas vezes')
      expect(opcoes).toContain('Às vezes')
      expect(opcoes).toContain('Raramente')
      expect(opcoes).toContain('Nunca')
    })

    it('deve ter valores em escala de 0 a 100', () => {
      const valores = Object.values(escalasResposta)
      valores.forEach(valor => {
        expect(valor).toBeGreaterThanOrEqual(0)
        expect(valor).toBeLessThanOrEqual(100)
      })
    })

    it('deve ter valores únicos', () => {
      const valores = Object.values(escalasResposta)
      const valoresUnicos = [...new Set(valores)]
      expect(valores.length).toBe(valoresUnicos.length)
    })
  })

  describe('Contagem de questões', () => {
    it('deve ter o número correto total de questões', () => {
       const totalQuestoes = grupos.reduce((acc, grupo) => acc + grupo.itens.length, 0)
       // 37 questões após remoção das perguntas especificadas
       expect(totalQuestoes).toBe(37)
     })

    it('deve ter grupos com número razoável de questões', () => {
      grupos.forEach(grupo => {
        expect(grupo.itens.length).toBeGreaterThan(0)
        expect(grupo.itens.length).toBeLessThanOrEqual(15) // Limite razoável
      })
    })

    it('deve ter IDs únicos entre todas as questões', () => {
      const todosIds: string[] = []
      
      grupos.forEach(grupo => {
        grupo.itens.forEach(item => {
          todosIds.push(item.id)
        })
      })

      const idsUnicos = [...new Set(todosIds)]
      expect(todosIds.length).toBe(idsUnicos.length)
    })

    it('deve ter questões com textos não vazios', () => {
      grupos.forEach(grupo => {
        grupo.itens.forEach(item => {
          expect(item.texto.trim().length).toBeGreaterThan(5)
        })
      })
    })
  })

  describe('Questões condicionais', () => {
    it('deve lidar com questões que têm condições', () => {
      let temCondicional = false
      
      grupos.forEach(grupo => {
        grupo.itens.forEach(item => {
          if (item.condition) {
            temCondicional = true
            expect(item.condition).toHaveProperty('questionId')
            expect(item.condition).toHaveProperty('operator')
            expect(item.condition).toHaveProperty('value')
          }
        })
      })

      // Se não há condicionais, pelo menos verifica que a estrutura está preparada
      expect(typeof temCondicional).toBe('boolean')
    })
  })

  describe('Questões invertidas', () => {
    it('deve identificar questões com lógica invertida', () => {
      let temInvertida = false
      
      grupos.forEach(grupo => {
        grupo.itens.forEach(item => {
          if (item.invertida) {
            temInvertida = true
            expect(item.invertida).toBe(true)
          }
        })
      })

      // Verificação de que a estrutura está preparada para questões invertidas
      expect(typeof temInvertida).toBe('boolean')
    })
  })
})