import { 
  validarCPF, 
  validarCNPJ, 
  formatarCPF, 
  formatarCNPJ,
  validarEmail,
  validarTelefone,
  formatarTelefone,
  validarUF
} from '@/lib/validators'

describe('Validadores', () => {
  describe('validarCPF', () => {
    it('deve validar CPF correto', () => {
      expect(validarCPF('12345678909')).toBe(true)
      expect(validarCPF('111.444.777-35')).toBe(true)
    })

    it('deve rejeitar CPF inválido', () => {
      expect(validarCPF('12345678900')).toBe(false)
      expect(validarCPF('00000000000')).toBe(false)
      expect(validarCPF('11111111111')).toBe(false)
    })

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(validarCPF('123456789')).toBe(false)
      expect(validarCPF('123456789012')).toBe(false)
    })
  })

  describe('validarCNPJ', () => {
    it('deve validar CNPJ correto', () => {
      expect(validarCNPJ('11222333000181')).toBe(true)
      expect(validarCNPJ('11.222.333/0001-81')).toBe(true)
    })

    it('deve rejeitar CNPJ inválido', () => {
      expect(validarCNPJ('11222333000180')).toBe(false)
      expect(validarCNPJ('00000000000000')).toBe(false)
      expect(validarCNPJ('11111111111111')).toBe(false)
    })

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      expect(validarCNPJ('1122233300018')).toBe(false)
      expect(validarCNPJ('112223330001812')).toBe(false)
    })
  })

  describe('formatarCPF', () => {
    it('deve formatar CPF corretamente', () => {
      expect(formatarCPF('12345678909')).toBe('123.456.789-09')
    })

    it('deve retornar entrada original se tamanho incorreto', () => {
      expect(formatarCPF('123456789')).toBe('123456789')
    })
  })

  describe('formatarCNPJ', () => {
    it('deve formatar CNPJ corretamente', () => {
      expect(formatarCNPJ('11222333000181')).toBe('11.222.333/0001-81')
    })

    it('deve retornar entrada original se tamanho incorreto', () => {
      expect(formatarCNPJ('1122233300018')).toBe('1122233300018')
    })
  })

  describe('validarEmail', () => {
    it('deve validar email correto', () => {
      expect(validarEmail('teste@example.com')).toBe(true)
      expect(validarEmail('user.name+tag@example.co.uk')).toBe(true)
    })

    it('deve rejeitar email inválido', () => {
      expect(validarEmail('teste')).toBe(false)
      expect(validarEmail('teste@')).toBe(false)
      expect(validarEmail('@example.com')).toBe(false)
      expect(validarEmail('teste@example')).toBe(false)
    })
  })

  describe('validarTelefone', () => {
    it('deve validar telefone fixo (10 dígitos)', () => {
      expect(validarTelefone('1133334444')).toBe(true)
      expect(validarTelefone('(11) 3333-4444')).toBe(true)
    })

    it('deve validar celular (11 dígitos)', () => {
      expect(validarTelefone('11999998888')).toBe(true)
      expect(validarTelefone('(11) 99999-8888')).toBe(true)
    })

    it('deve rejeitar telefone com tamanho incorreto', () => {
      expect(validarTelefone('113333444')).toBe(false)
      expect(validarTelefone('119999988889')).toBe(false)
    })
  })

  describe('formatarTelefone', () => {
    it('deve formatar telefone fixo corretamente', () => {
      expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444')
    })

    it('deve formatar celular corretamente', () => {
      expect(formatarTelefone('11999998888')).toBe('(11) 99999-8888')
    })

    it('deve retornar entrada original se tamanho incorreto', () => {
      expect(formatarTelefone('113333444')).toBe('113333444')
    })
  })

  describe('validarUF', () => {
    it('deve validar UF correta', () => {
      expect(validarUF('SP')).toBe(true)
      expect(validarUF('sp')).toBe(true)
      expect(validarUF('RJ')).toBe(true)
    })

    it('deve rejeitar UF inválida', () => {
      expect(validarUF('XX')).toBe(false)
      expect(validarUF('ABC')).toBe(false)
      expect(validarUF('')).toBe(false)
    })
  })
})
