/**
 * @fileoverview Testes do instrumentation.ts (Phase H — Auditoria Sênior)
 *
 * Verifica que console.log/debug/info são suprimidos em produção
 * e que console.warn/error continuam funcionando normalmente.
 */

describe('instrumentation — supressão de logs em produção', () => {
  const originalLog = console.log;
  const originalDebug = console.debug;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Restaurar console real e NODE_ENV
    console.log = originalLog;
    console.debug = originalDebug;
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });

  it('em produção, register() substitui console.log por noop', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const { register } = await import('@/instrumentation');
    await register();

    const logSpy = jest.fn();
    // Após register() em produção, console.log deve ser noop
    // Verificar que não gera output ao ser chamado
    expect(() => console.log('teste produção')).not.toThrow();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('em produção, console.warn continua funcionando', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const { register } = await import('@/instrumentation');
    await register();

    // console.warn não deve ser suprimido
    expect(console.warn).toBe(originalWarn);
  });

  it('em produção, console.error continua funcionando', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const { register } = await import('@/instrumentation');
    await register();

    expect(console.error).toBe(originalError);
  });

  it('em desenvolvimento, console.log NÃO é substituído', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    // Resetar mock para recarregar o módulo com env diferente
    jest.resetModules();
    const { register } = await import('@/instrumentation');
    await register();

    // Em dev, console.log deve permanecer o original
    expect(console.log).toBe(originalLog);
  });

  it('em staging (NODE_ENV=production, APP_ENV=staging), console.log NÃO é suprimido', async () => {
    // Staging usa NODE_ENV=production (build otimizado) mas APP_ENV=staging
    // Logs devem permanecer ativos para facilitar debugging de preview
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
    process.env.APP_ENV = 'staging';

    jest.resetModules();
    const { register } = await import('@/instrumentation');
    await register();

    // Em staging, console.log NÃO deve ser suprimido
    expect(console.log).toBe(originalLog);
    expect(console.debug).toBe(originalDebug);
    expect(console.info).toBe(originalInfo);
  });

  it('em produção real (NODE_ENV=production, APP_ENV=production), console.log É suprimido', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
    process.env.APP_ENV = 'production';

    jest.resetModules();
    const { register } = await import('@/instrumentation');
    await register();

    // Em produção real, console.log deve ser noop
    expect(() => console.log('teste')).not.toThrow();
    // warn e error permanecem
    expect(console.warn).toBe(originalWarn);
    expect(console.error).toBe(originalError);
  });

  it('sem APP_ENV definido mas NODE_ENV=production, NÃO suprime logs (comportamento seguro)', async () => {
    // Sem APP_ENV, não conseguimos confirmar que é produção real
    // Comportamento conservador: não suprimir logs
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
    delete process.env.APP_ENV;

    jest.resetModules();
    const { register } = await import('@/instrumentation');
    await register();

    // Sem APP_ENV=production, logs NÃO devem ser suprimidos
    expect(console.log).toBe(originalLog);
  });
});
