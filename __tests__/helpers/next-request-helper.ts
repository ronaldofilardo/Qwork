/**
 * Helper para criar NextRequest a partir de Request em testes
 * Necessário porque Next.js espera NextRequest, não Request padrão
 */

import { NextRequest } from 'next/server';

/**
 * Converte uma Request padrão em NextRequest para uso em testes
 * @param url - URL completa da requisição
 * @param init - Opções de inicialização da Request
 * @returns NextRequest para uso em route handlers
 */
export function createNextRequest(
  url: string,
  init?: RequestInit
): NextRequest {
  return new NextRequest(url, init);
}

/**
 * Cria um NextRequest POST com JSON body
 */
export function createNextRequestPOST(
  url: string,
  body: any
): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Cria um NextRequest GET
 */
export function createNextRequestGET(url: string): NextRequest {
  return new NextRequest(url, {
    method: 'GET',
  });
}

/**
 * Cria um NextRequest com FormData
 */
export function createNextRequestWithFormData(
  url: string,
  formData: FormData
): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: formData,
  });
}
