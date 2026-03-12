'use client';

import React from 'react';

/**
 * ContratoRepresentante
 *
 * Contrato de Representação Comercial Independente — DOCUMENTO PROVISÓRIO.
 * Este conteúdo foi gerado para uso temporário e deverá ser substituído
 * pelo texto elaborado pelo departamento jurídico da empresa.
 *
 * Data de vigência provisória: março/2026
 */
export default function ContratoRepresentante() {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="prose prose-slate max-w-none text-sm leading-relaxed">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">
          Contrato de Representação Comercial Independente
        </h1>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1 inline-block mt-2">
          DOCUMENTO PROVISÓRIO — Sujeito a revisão pelo departamento jurídico
        </p>
      </div>

      {/* Preâmbulo */}
      <section className="mb-6">
        <p className="text-gray-700">
          Pelo presente instrumento particular, as partes a seguir identificadas
          celebram o presente{' '}
          <strong>Contrato de Representação Comercial Independente</strong>,
          regido pelas disposições da Lei nº 4.886/1965 (com as alterações da
          Lei nº 8.420/1992) e demais normas aplicáveis, nos termos e condições
          adiante estabelecidos.
        </p>
      </section>

      {/* Partes */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-800 uppercase mb-3">
          1. Das Partes
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <p className="font-semibold text-gray-800">
              CONTRATANTE (Plataforma):
            </p>
            <p className="text-gray-700">
              <strong>QWork Tecnologia Ltda.</strong> (&ldquo;QWork&rdquo; ou
              &ldquo;Empresa&rdquo;), pessoa jurídica de direito privado,
              devidamente inscrita no CNPJ, com sede e foro no Brasil,
              proprietária e operadora da plataforma digital QWork de gestão
              ocupacional.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800">
              CONTRATADO (Representante):
            </p>
            <p className="text-gray-700">
              O profissional ou empresa identificado no cadastro eletrônico
              realizado na plataforma QWork, cujos dados (nome, CPF/CNPJ,
              e-mail, telefone e demais informações) foram fornecidos no ato do
              credenciamento.
            </p>
          </div>
        </div>
      </section>

      {/* Objeto */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-800 uppercase mb-3">
          2. Do Objeto e Natureza da Relação
        </h2>
        <p className="text-gray-700 mb-3">
          2.1. O presente contrato tem por objeto a prestação de serviços de
          representação comercial independente pelo{' '}
          <strong>Representante</strong>, mediante a angariação de clientes
          (clínicas, empresas e entidades) para a plataforma QWork.
        </p>
        <p className="text-gray-700 mb-3">
          2.2.{' '}
          <strong>
            A relação entre as partes é estritamente comercial e independente
          </strong>
          , não ensejando, em hipótese alguma, vínculo empregatício, societário,
          associativo ou de qualquer outra natureza além da ora contratada.
        </p>
        <p className="text-gray-700 mb-3">
          2.3. O Representante não é empregado, sócio, preposto ou agente legal
          da QWork, sendo vedada qualquer representação da empresa perante
          terceiros além do escopo comercial expressamente autorizado neste
          contrato.
        </p>
        <p className="text-gray-700">
          2.4. O Representante exercerá suas atividades com plena autonomia,
          podendo organizar livremente seus horários, métodos e ferramentas de
          trabalho, não estando sujeito a subordinação, fiscalização direta ou
          controle de jornada pela QWork.
        </p>
      </section>

      {/* Inexistência de Vínculo Empregatício */}
      <section className="mb-6 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg p-4">
        <h2 className="text-base font-bold text-orange-800 uppercase mb-3">
          3. Da Inexistência de Vínculo Empregatício (Cláusula Essencial)
        </h2>
        <p className="text-gray-700 mb-3">
          3.1.{' '}
          <strong>
            Fica expressamente estabelecido que a presente contratação não gera,
            em nenhuma hipótese, vínculo empregatício, tendo o Representante
            plena ciência de que:
          </strong>
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>
            Não há subordinação jurídica entre as partes, exercendo o
            Representante sua atividade com total autonomia;
          </li>
          <li>
            Não haverá pagamento de salário, mas sim comissão variável,
            exclusivamente vinculada às indicações convertidas conforme as
            regras da plataforma;
          </li>
          <li>
            A QWork não recolherá FGTS, INSS patronal, contribuições
            previdenciárias ou quaisquer encargos trabalhistas em relação ao
            Representante;
          </li>
          <li>
            O Representante, quando pessoa física, é{' '}
            <strong>
              responsável pelo recolhimento de seus próprios tributos
            </strong>{' '}
            sobre os valores recebidos (IRPF, INSS como autônomo e demais
            encargos aplicáveis);
          </li>
          <li>
            O Representante pessoa jurídica deverá manter sua empresa
            regularmente constituída e em dia com suas obrigações fiscais e
            previdenciárias;
          </li>
          <li>
            A ausência de produção comercial em determinado período não gera
            direito a qualquer remuneração mínima garantida.
          </li>
        </ul>
        <p className="mt-3 text-gray-700">
          3.2. O Representante declara ter pleno conhecimento desta cláusula e
          concorda expressamente com seus termos, renunciando a qualquer
          pretensão de reconhecimento de relação de emprego com a QWork.
        </p>
      </section>

      {/* Obrigações do Representante */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-800 uppercase mb-3">
          4. Das Obrigações do Representante
        </h2>
        <p className="text-gray-700 mb-2">
          4.1. São obrigações do Representante:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>
            Realizar a prospecção e indicação de potenciais clientes para a
            plataforma QWork de forma ética, transparente e em conformidade com
            a legislação aplicável;
          </li>
          <li>
            Apresentar a plataforma de forma fidedigna, abstendo-se de fazer
            promessas ou garantias não autorizadas pela QWork;
          </li>
          <li>
            Manter seus dados cadastrais atualizados na plataforma,
            especialmente dados bancários para recebimento de comissões;
          </li>
          <li>
            Guardar sigilo sobre informações confidenciais da QWork, de seus
            clientes e da plataforma, mesmo após o encerramento deste contrato;
          </li>
          <li>
            Observar a Política de Privacidade e os Termos de Uso da plataforma
            QWork;
          </li>
          <li>
            Não praticar atos que possam denegrir a imagem ou reputação da
            QWork;
          </li>
          <li>
            Comunicar imediatamente a QWork sobre qualquer situação que possa
            comprometer a regularidade de sua atuação como representante.
          </li>
        </ul>
      </section>

      {/* Obrigações da QWork */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-800 uppercase mb-3">
          5. Das Obrigações da QWork
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>
            Fornecer ao Representante as informações e materiais necessários
            para a divulgação da plataforma;
          </li>
          <li>
            Disponibilizar acesso ao portal do representante com ferramentas de
            acompanhamento de leads, vínculos e comissões;
          </li>
          <li>
            Efetuar o pagamento das comissões devidas conforme as regras e
            prazos estabelecidos na plataforma, após a confirmação dos eventos
            geradores;
          </li>
          <li>
            Comunicar ao Representante eventuais alterações nas regras de
            comissionamento com antecedência razoável;
          </li>
          <li>
            Tratar os dados pessoais do Representante em conformidade com a Lei
            Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </li>
        </ul>
      </section>

      {/* Comissionamento */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-800 uppercase mb-3">
          6. Do Comissionamento
        </h2>
        <p className="text-gray-700 mb-3">
          6.1. O Representante fará jus ao recebimento de comissões calculadas
          sobre os serviços contratados pelos clientes por ele indicados, nos
          percentuais e condições definidos na plataforma QWork para cada tipo
          de vínculo.
        </p>
        <p className="text-gray-700 mb-3">
          6.2. O direito à comissão nasce com a efetiva contratação pelo cliente
          indicado e o cumprimento das condições de pagamento pelo mesmo.
        </p>
        <p className="text-gray-700 mb-3">
          6.3. As comissões serão pagas ao Representante em conta bancária ou
          via Pix cadastrado na plataforma, conforme cronograma divulgado pela
          QWork.
        </p>
        <p className="text-gray-700 mb-3">
          6.4. <strong>Pessoa Física:</strong> O Representante PF emitirá Recibo
          de Pagamento Autônomo (RPA) ou equivalente, sendo de sua inteira
          responsabilidade o recolhimento dos tributos incidentes sobre os
          valores recebidos.
        </p>
        <p className="text-gray-700">
          6.5. <strong>Pessoa Jurídica:</strong> O Representante PJ emitirá Nota
          Fiscal de Serviços para cada pagamento realizado pela QWork.
        </p>
      </section>

      {/* Vigência e Rescisão */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-800 uppercase mb-3">
          7. Da Vigência e da Rescisão
        </h2>
        <p className="text-gray-700 mb-3">
          7.1. Este contrato é celebrado por prazo indeterminado, iniciando seus
          efeitos na data de aceitação eletrônica pelo Representante.
        </p>
        <p className="text-gray-700 mb-3">
          7.2. Qualquer das partes poderá rescindir o presente contrato a
          qualquer momento, mediante comunicação à outra parte com antecedência
          mínima de 30 (trinta) dias, sem que isso implique pagamento de
          qualquer multa ou indenização, salvo em caso de descumprimento de
          obrigação contratual.
        </p>
        <p className="text-gray-700 mb-3">
          7.3. A QWork poderá rescindir o contrato imediatamente, sem aviso
          prévio e sem ônus, nos seguintes casos: (i) prática de atos ilícitos
          pelo Representante; (ii) violação de cláusulas deste instrumento;
          (iii) danos à imagem ou ao patrimônio da QWork; (iv) conduta antiética
          ou fraudulenta.
        </p>
        <p className="text-gray-700">
          7.4. A rescisão não afetará o direito do Representante ao recebimento
          das comissões já vencidas e comprovadamente devidas até a data de
          efetivação do encerramento.
        </p>
      </section>

      {/* Confidencialidade */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-800 uppercase mb-3">
          8. Da Confidencialidade e Propriedade Intelectual
        </h2>
        <p className="text-gray-700 mb-3">
          8.1. O Representante compromete-se a manter sigilo absoluto sobre
          informações confidenciais da QWork, de seus clientes, processos
          internos, tecnologias, estratégias comerciais, preços e quaisquer
          dados a que tiver acesso em razão deste contrato.
        </p>
        <p className="text-gray-700 mb-3">
          8.2. A obrigação de confidencialidade permanece em vigor por 5 (cinco)
          anos após o encerramento deste contrato.
        </p>
        <p className="text-gray-700">
          8.3. Todos os direitos de propriedade intelectual relacionados à
          plataforma QWork pertencem exclusivamente à empresa, não sendo
          transferido qualquer direito ao Representante por força deste
          contrato.
        </p>
      </section>

      {/* Proteção de Dados */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-800 uppercase mb-3">
          9. Da Proteção de Dados (LGPD)
        </h2>
        <p className="text-gray-700 mb-3">
          9.1. As partes comprometem-se a cumprir integralmente a Lei Geral de
          Proteção de Dados (Lei nº 13.709/2018) no tratamento de dados pessoais
          eventualmente envolvidos na execução deste contrato.
        </p>
        <p className="text-gray-700 mb-3">
          9.2. O Representante não poderá ceder, vender ou compartilhar dados
          pessoais de clientes ou terceiros obtidos em razão deste contrato, sob
          pena de rescisão imediata e responsabilização civil e criminal.
        </p>
        <p className="text-gray-700">
          9.3. Para informações sobre como a QWork trata os dados pessoais do
          Representante, consulte a Política de Privacidade disponível na
          plataforma.
        </p>
      </section>

      {/* Disposições Gerais */}
      <section className="mb-6">
        <h2 className="text-base font-bold text-gray-800 uppercase mb-3">
          10. Das Disposições Gerais
        </h2>
        <p className="text-gray-700 mb-3">
          10.1. Este contrato constitui o acordo integral entre as partes,
          substituindo todos os entendimentos e negociações anteriores, escritas
          ou verbais.
        </p>
        <p className="text-gray-700 mb-3">
          10.2. A tolerância de uma das partes em relação a eventual
          descumprimento de obrigação pela outra não importará novação,
          precedente ou renúncia ao direito de exigir o cumprimento integral das
          obrigações.
        </p>
        <p className="text-gray-700 mb-3">
          10.3. Se qualquer cláusula deste contrato for considerada inválida ou
          inexequível, as demais cláusulas permanecerão em pleno vigor e efeito.
        </p>
        <p className="text-gray-700">
          10.4. As partes elegem o foro da Comarca de domicílio da QWork para
          dirimir quaisquer controvérsias decorrentes deste instrumento, com
          renúncia expressa a qualquer outro, por mais privilegiado que seja.
        </p>
      </section>

      {/* Assinatura eletrônica */}
      <section className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-base font-bold text-blue-800 uppercase mb-3">
          11. Da Aceitação Eletrônica
        </h2>
        <p className="text-gray-700 mb-3">
          11.1. O presente contrato é firmado de forma eletrônica, conforme
          autorizado pela Medida Provisória nº 2.200-2/2001 e pela Lei nº
          14.063/2020. O aceite realizado pelo Representante por meio do clique
          no botão &ldquo;Li e Concordo&rdquo; na plataforma QWork equivale à
          sua assinatura eletrônica, tendo a mesma validade jurídica de uma
          assinatura manuscrita.
        </p>
        <p className="text-gray-700 mb-3">
          11.2. O registro de data, hora, IP de acesso e identificação do
          Representante será armazenado com fins de auditoria e comprovação da
          manifestação de vontade das partes.
        </p>
        <p className="text-gray-700">
          11.3. Ao clicar em &ldquo;Li e Concordo&rdquo;, o Representante
          declara que: (i) leu integralmente este contrato; (ii) compreendeu
          todos os seus termos; (iii) concorda livre e voluntariamente com todas
          as suas cláusulas; e (iv) tem plena capacidade civil para contratar.
        </p>
      </section>

      <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        <p>
          Documento gerado eletronicamente — Versão provisória (março/2026).
          Este contrato será oportunamente revisado e substituído por documento
          elaborado pelo departamento jurídico.
        </p>
        <p className="mt-1">Data de vigência: {dataAtual} | Plataforma QWork</p>
      </div>
    </div>
  );
}
