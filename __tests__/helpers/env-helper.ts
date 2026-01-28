/**
 * Utility para modificar process.env.NODE_ENV em testes
 * Resolve erro de readonly property
 */

export function setNodeEnv(env: 'test' | 'development' | 'production') {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: env,
    configurable: true,
    writable: true,
  });
}

export function getNodeEnv(): string | undefined {
  return process.env.NODE_ENV;
}
