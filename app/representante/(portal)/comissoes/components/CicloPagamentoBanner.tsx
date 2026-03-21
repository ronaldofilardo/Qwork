'use client';

export default function CicloPagamentoBanner() {
  const spFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = spFormatter.formatToParts(new Date());
  const get = (t: string) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? '0');
  const ano = get('year');
  const mes = get('month') - 1;
  const diaAtual = get('day');
  const horaAtual = get('hour');

  const dentroDoPrazo = diaAtual < 5 || (diaAtual === 5 && horaAtual < 18);

  let mesAlvo = dentroDoPrazo ? mes : mes + 1;
  let anoAlvo = ano;
  if (mesAlvo > 11) {
    anoAlvo = ano + 1;
    mesAlvo = 0;
  }

  const prazoNf = new Date(anoAlvo, mesAlvo, 5, 18, 0);
  const dataPagamento = new Date(anoAlvo, mesAlvo, 15);
  const agora = new Date();
  const fmtData = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const diasRestantes = Math.max(
    0,
    Math.ceil((prazoNf.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Ciclo de Pagamento
            </p>
            <p className="text-xs text-gray-600">
              Envie sua NF/RPA até <strong>18h de {fmtData(prazoNf)}</strong>{' '}
              para receber em <strong>{fmtData(dataPagamento)}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {diasRestantes <= 3 && diasRestantes > 0 && (
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              ⚠️ {diasRestantes} dia{diasRestantes > 1 ? 's' : ''} restante
              {diasRestantes > 1 ? 's' : ''}
            </span>
          )}
          {diasRestantes === 0 && (
            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              ⏰ Prazo encerra hoje!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
