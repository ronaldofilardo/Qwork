const fs = require('fs');
const path = require('path');

const filePath = path.resolve(
  __dirname,
  '..',
  'components',
  'admin',
  'AuditoriasContent.tsx'
);
const original = fs.readFileSync(filePath, 'utf8');
const originalLines = original.split('\n').length;

const lines = [
  "import { AuditoriaSubNav } from './auditorias/AuditoriaSubNav';",
  'import {',
  '  TabelaAcessosRH,',
  '  TabelaAcessosFuncionarios,',
  '  TabelaAvaliacoes,',
  '  TabelaLotes,',
  '  TabelaLaudos,',
  "} from './auditorias/AuditoriaTables';",
  "import type { AuditoriasContentProps } from './auditorias/types';",
  '',
  'export type { AuditoriasContentProps };',
  "export type { AuditoriaSubTab } from './auditorias/types';",
  '',
  'export function AuditoriasContent({',
  '  auditoriaSubTab,',
  '  setAuditoriaSubTab,',
  '  acessosRH,',
  '  acessosFuncionarios,',
  '  auditoriaAvaliacoes,',
  '  auditoriaLotes,',
  '  auditoriaLaudos,',
  '}: AuditoriasContentProps) {',
  '  return (',
  '    <div>',
  '      <AuditoriaSubNav',
  '        auditoriaSubTab={auditoriaSubTab}',
  '        setAuditoriaSubTab={setAuditoriaSubTab}',
  '      />',
  '',
  "      {auditoriaSubTab === 'acessos-rh' && <TabelaAcessosRH data={acessosRH} />}",
  "      {auditoriaSubTab === 'acessos-funcionarios' && <TabelaAcessosFuncionarios data={acessosFuncionarios} />}",
  "      {auditoriaSubTab === 'avaliacoes' && <TabelaAvaliacoes data={auditoriaAvaliacoes} />}",
  "      {auditoriaSubTab === 'lotes' && <TabelaLotes data={auditoriaLotes} />}",
  "      {auditoriaSubTab === 'laudos' && <TabelaLaudos data={auditoriaLaudos} />}",
  '    </div>',
  '  );',
  '}',
];

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
const newLines = lines.length;
console.log(
  `AuditoriasContent.tsx rewritten: ${newLines} lines (was ${originalLines})`
);
