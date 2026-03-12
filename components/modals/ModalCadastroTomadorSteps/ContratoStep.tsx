'use client';

interface ContratoStepProps {
  contratoGerado: string;
  contratoAceito: boolean;
  setContratoAceito: (v: boolean) => void;
}

export function ContratoStep({
  contratoGerado,
  contratoAceito,
  setContratoAceito,
}: ContratoStepProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Leia atentamente o contrato abaixo.</strong> Você deve aceitar
          os termos para prosseguir com o cadastro.
        </p>
      </div>

      {/* Preview do Contrato */}
      <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 max-h-96 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
          {contratoGerado}
        </pre>
      </div>

      {/* Checkbox de Aceite */}
      <div className="border-t pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={contratoAceito}
            onChange={(e) => setContratoAceito(e.target.checked)}
            className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">
            <strong>
              Declaro que li e concordo com todos os termos deste contrato.
            </strong>
            <br />
            Estou ciente de que, ao aceitar, estarei firmando um compromisso
            legal com a QWORK LTDA e me comprometendo com todas as cláusulas
            acima descritas.
          </span>
        </label>
      </div>

      {!contratoAceito && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            ⚠️ Você precisa aceitar os termos do contrato para continuar
          </p>
        </div>
      )}
    </div>
  );
}
