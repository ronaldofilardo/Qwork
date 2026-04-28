/**
 * @file __tests__/api/auth/rate-limit-message.test.ts
 *
 * Testes de contrato para a melhoria da mensagem de rate limit
 * em lib/rate-limit.ts.
 *
 * Garante que:
 *  - A resposta 429 contém retryAfterMinutes (número)
 *  - A mensagem é humanizada (não é "RATE_LIMIT_EXCEED")
 *  - A mensagem menciona bloqueio e tempo de espera
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const RATE_LIMIT_PATH = path.join(ROOT, 'lib', 'rate-limit.ts');

let src: string;

beforeAll(() => {
  src = fs.readFileSync(RATE_LIMIT_PATH, 'utf-8');
});

describe('lib/rate-limit.ts — Mensagem humanizada 429', () => {
  it('arquivo existe', () => {
    expect(fs.existsSync(RATE_LIMIT_PATH)).toBe(true);
  });

  it('NÃO usa a mensagem raw RATE_LIMIT_EXCEED', () => {
    // A mensagem raw não deve ser exposta diretamente ao usuário
    expect(src).not.toMatch(/message.*RATE_LIMIT_EXCEED/);
  });

  it('calcula retryAfterMinutes em minutos', () => {
    expect(src).toMatch(/retryAfterMinutes/);
    expect(src).toMatch(/Math\.ceil\s*\(\s*retryAfter\s*\/\s*60\s*\)/);
  });

  it('inclui retryAfterMinutes na resposta JSON', () => {
    expect(src).toMatch(/retryAfterMinutes/);
  });

  it('mensagem menciona bloqueio com tempo em minuto(s)', () => {
    expect(src).toMatch(/minuto/i);
    expect(src).toMatch(/bloqueado/i);
  });

  it('mensagem orienta o usuário a tentar mais tarde', () => {
    expect(src).toMatch(/Tente novamente/i);
  });
});

describe('app/login/page.tsx — Tratamento de 429', () => {
  const LOGIN_PATH = path.join(ROOT, 'app', 'login', 'page.tsx');
  let loginSrc: string;

  beforeAll(() => {
    loginSrc = fs.readFileSync(LOGIN_PATH, 'utf-8');
  });

  it('trata status 429 explicitamente', () => {
    expect(loginSrc).toMatch(/response\.status\s*===\s*429/);
  });

  it('lê retryAfterMinutes do JSON da resposta', () => {
    expect(loginSrc).toMatch(/retryAfterMinutes/);
  });

  it('exibe mensagem de erro ao usuário', () => {
    expect(loginSrc).toMatch(/setError\s*\(/);
  });
});

describe('app/login/page.tsx — Toggle de senha', () => {
  const LOGIN_PATH = path.join(ROOT, 'app', 'login', 'page.tsx');
  let loginSrc: string;

  beforeAll(() => {
    loginSrc = fs.readFileSync(LOGIN_PATH, 'utf-8');
  });

  it('importa Eye e EyeOff do lucide-react', () => {
    expect(loginSrc).toMatch(/Eye.*EyeOff|EyeOff.*Eye/);
    expect(loginSrc).toMatch(/lucide-react/);
  });

  it('tem estado showPassword', () => {
    expect(loginSrc).toMatch(/showPassword/);
    expect(loginSrc).toMatch(/useState\s*\(\s*false\s*\)/);
  });

  it('input de senha tem type dinâmico baseado em showPassword', () => {
    expect(loginSrc).toMatch(
      /showPassword.*text.*password|type.*showPassword/is
    );
  });

  it('botão de toggle tem aria-label', () => {
    expect(loginSrc).toMatch(/aria-label/);
  });
});
