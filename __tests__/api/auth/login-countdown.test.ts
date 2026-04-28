/**
 * @file __tests__/api/auth/login-countdown.test.ts
 *
 * Testes para o cronômetro de bloqueio por rate limit na tela de login.
 *
 * Cobre:
 *  - Presença dos estados rateLimitUntil e rateLimitSecondsLeft na página
 *  - useEffect para o countdown
 *  - Handler 429 lê retryAfter (segundos) e retryAfterMinutes como fallback
 *  - Botão submit desabilitado durante bloqueio
 *  - Exibição de MM:SS no JSX
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const LOGIN_PAGE = path.join(ROOT, 'app', 'login', 'page.tsx');

let src: string;

beforeAll(() => {
  src = fs.readFileSync(LOGIN_PAGE, 'utf-8');
});

describe('Login page — Countdown de rate limit', () => {
  it('importa useEffect do react', () => {
    expect(src).toMatch(/import\s*\{[^}]*useEffect[^}]*\}\s*from\s*['"]react['"]/);
  });

  it('declara estado rateLimitUntil', () => {
    expect(src).toMatch(/rateLimitUntil/);
    expect(src).toMatch(/setRateLimitUntil/);
  });

  it('declara estado rateLimitSecondsLeft', () => {
    expect(src).toMatch(/rateLimitSecondsLeft/);
    expect(src).toMatch(/setRateLimitSecondsLeft/);
  });

  it('tem useEffect que depende de rateLimitUntil', () => {
    expect(src).toMatch(/useEffect\s*\([\s\S]*?\[\s*rateLimitUntil\s*\]/);
  });

  it('usa setInterval para o tick do countdown', () => {
    expect(src).toMatch(/setInterval/);
  });

  it('limpa o interval no cleanup (clearInterval)', () => {
    expect(src).toMatch(/clearInterval/);
  });

  it('handler 429 lê retryAfter (segundos) da resposta', () => {
    expect(src).toMatch(/retryAfter/);
  });

  it('handler 429 usa retryAfterMinutes como fallback', () => {
    expect(src).toMatch(/retryAfterMinutes/);
  });

  it('handler 429 chama setRateLimitUntil com Date.now() + seconds * 1000', () => {
    expect(src).toMatch(/setRateLimitUntil\s*\(\s*Date\.now\(\)\s*\+\s*seconds\s*\*\s*1000\s*\)/);
  });

  it('handler 429 limpa o erro principal (setError(""))', () => {
    expect(src).toMatch(/setError\s*\(\s*['"]{2}\s*\)/);
  });

  it('JSX exibe formato MM:SS usando padStart(2, "0")', () => {
    expect(src).toMatch(/padStart\s*\(\s*2\s*,\s*['"]0['"]\s*\)/);
  });

  it('JSX exibe divisão de minutos (Math.floor(... / 60))', () => {
    expect(src).toMatch(/Math\.floor\s*\([^)]*60\s*\)/);
  });

  it('JSX exibe resto de segundos (... % 60)', () => {
    expect(src).toMatch(/%\s*60/);
  });

  it('botão submit fica disabled quando rateLimitUntil !== null e há segundos restantes', () => {
    expect(src).toMatch(/rateLimitUntil\s*!==\s*null[\s\S]{0,100}rateLimitSecondsLeft\s*>\s*0/);
  });

  it('exibe bloco de countdown quando rateLimitUntil !== null', () => {
    expect(src).toMatch(/rateLimitUntil\s*!==\s*null/);
  });

  it('exibe erro normal apenas quando rateLimitUntil === null', () => {
    expect(src).toMatch(/error\s*&&\s*rateLimitUntil\s*===\s*null/);
  });
});
