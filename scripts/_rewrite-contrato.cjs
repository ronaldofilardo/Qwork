const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'components',
  'terms',
  'ContratopadraO.tsx'
);
const original = fs.readFileSync(target, 'utf8');
const oldLines = original.split('\n').length;

const newContent = `'use client';

import React from 'react';
import { SecaoIdentificacao } from './contrato/SecaoIdentificacao';
import { SecaoFuncionamento } from './contrato/SecaoFuncionamento';
import { SecaoOperacional } from './contrato/SecaoOperacional';
import { SecaoFinal } from './contrato/SecaoFinal';

export default function ContratoPadrao() {
  return (
    <div className="prose prose-slate max-w-none mx-auto p-6">
      <SecaoIdentificacao />
      <SecaoFuncionamento />
      <SecaoOperacional />
      <SecaoFinal />
    </div>
  );
}
`;

fs.writeFileSync(target, newContent, 'utf8');
const newLines = newContent.split('\n').length;
console.log(
  `ContratoPadrao.tsx rewritten: ${newLines} lines (was ${oldLines})`
);
