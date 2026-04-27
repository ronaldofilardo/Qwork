'use client';

import React from 'react';

/* Estilos locais sem dependência de `prose` — mantém identidade visual QWork */
const heading =
  'text-[0.8rem] font-bold text-[#2D2D2D] uppercase tracking-widest mt-7 mb-2 border-b border-gray-200 pb-1.5';
const para = 'text-sm text-gray-700 leading-relaxed mb-2';
const divider = 'border-none my-0';

export default function ContratoPadrao() {
  return (
    <div className="font-sans text-gray-800 max-w-none">
      {/* Cabeçalho */}
      <div className="text-center mb-6 pb-5 border-b border-gray-200">
        <h1 className="text-base font-bold text-[#2D2D2D] uppercase tracking-widest mb-1">
          Contrato de Prestação de Serviços
        </h1>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Plataforma QWork — Avaliação de Risco Psicossocial Organizacional
        </p>
      </div>

      <p className={para}>
        Pelo presente instrumento particular, de um lado,{' '}
        <strong className="text-[#2D2D2D]">
          QWORK TECNOLOGIA E GESTÃO DE RISCOS LTDA
        </strong>
        , doravante denominada{' '}
        <strong className="text-[#2D2D2D]">CONTRATADA</strong>, e, na qualidade
        de interveniente gestora,{' '}
        <strong className="text-[#2D2D2D]">
          MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA
        </strong>
        , pessoa jurídica de direito privado, inscrita no CNPJ sob nº
        21.020.277/0001-56, com sede na Rua Barão do Serro Azul, nº 198, 5º
        andar, Centro, Curitiba/PR, doravante denominada{' '}
        <strong className="text-[#2D2D2D]">GESTORA</strong>, e, de outro lado, a{' '}
        <strong className="text-[#2D2D2D]">CONTRATANTE</strong>, pessoa jurídica
        que realiza cadastro e contratação da plataforma mediante aceite
        eletrônico, têm entre si justo e acordado o presente contrato, que se
        regerá pelas cláusulas seguintes:
      </p>

      <hr className={divider} />

      <h2 className={heading}>Cláusula 1 — Do Objeto</h2>
      <p className={para}>
        O presente contrato tem por objeto a disponibilização da plataforma
        digital QWORK, destinada à aplicação de questionário estruturado de
        avaliação psicossocial organizacional, com posterior geração de
        relatório analítico consolidado, voltado à gestão preventiva de riscos
        psicossociais no ambiente de trabalho.
      </p>
      <p className={para}>
        <strong className="text-[#2D2D2D]">Parágrafo único.</strong> A
        ferramenta possui finalidade exclusivamente organizacional, estatística
        e preventiva, em conformidade com as diretrizes da Norma Regulamentadora
        nº 1 (NR-1), não possuindo caráter clínico ou assistencial.
      </p>

      <h2 className={heading}>Cláusula 2 — Da Natureza do Serviço</h2>
      <p className={para}>A CONTRATANTE declara ciência de que:</p>
      <ul className="ml-4 space-y-1 text-sm text-gray-700 mb-4 list-none">
        <li>
          I – a plataforma não realiza diagnóstico psicológico ou psiquiátrico
          individual;
        </li>
        <li>II – não realiza atendimento clínico, terapêutico ou médico;</li>
        <li>III – não substitui avaliação profissional individualizada;</li>
        <li>
          IV – os relatórios gerados possuem natureza exclusivamente
          organizacional, coletiva e estatística.
        </li>
      </ul>

      <h2 className={heading}>Cláusula 3 — Do Funcionamento da Plataforma</h2>
      <p className={para}>A utilização da plataforma ocorrerá mediante:</p>
      <ul className="ml-4 space-y-1 text-sm text-gray-700 mb-4 list-none">
        <li>I – cadastro da empresa CONTRATANTE;</li>
        <li>II – inclusão dos colaboradores pela própria CONTRATANTE;</li>
        <li>
          III – acesso individual mediante autenticação por CPF e data de
          nascimento;
        </li>
        <li>IV – preenchimento do questionário psicossocial;</li>
        <li>V – consolidação e tratamento dos dados coletados.</li>
      </ul>

      <h2 className={heading}>Cláusula 4 — Da Evolução da Plataforma</h2>
      <p className={para}>
        A CONTRATADA poderá, a seu critério, promover atualizações, melhorias e
        modificações na plataforma, sem que isso implique alteração da natureza
        do serviço contratado.
      </p>

      <h2 className={heading}>
        Cláusula 5 — Da Adesão Mínima e Emissão de Relatório
      </h2>
      <p className={para}>
        A CONTRATANTE declara ciência de que a geração do relatório
        organizacional consolidado está condicionada à participação mínima de
        70% (setenta por cento) dos colaboradores cadastrados.
      </p>
      <p className={para}>
        <strong className="text-[#2D2D2D]">Parágrafo primeiro.</strong> O
        percentual mínimo estabelecido visa garantir consistência estatística e
        validade técnica dos dados.
      </p>
      <p className={para}>
        <strong className="text-[#2D2D2D]">Parágrafo segundo.</strong> O
        faturamento será realizado com base na totalidade dos colaboradores
        cadastrados, independentemente do percentual de adesão efetivamente
        atingido.
      </p>
      <p className={para}>
        <strong className="text-[#2D2D2D]">Parágrafo terceiro.</strong> A não
        obtenção do percentual mínimo de adesão não configura inadimplemento da
        CONTRATADA.
      </p>
      <p className={para}>
        <strong className="text-[#2D2D2D]">Parágrafo quarto.</strong> Compete
        exclusivamente à CONTRATANTE promover o engajamento dos colaboradores.
      </p>
      <p className={para}>
        Decorridos 90 (noventa) dias da ativação da plataforma, caso não haja
        emissão de relatórios, será devida cobrança mínima no valor de{' '}
        <strong className="text-[#2D2D2D]">
          R$ 250,00 (duzentos e cinquenta reais)
        </strong>
        .
      </p>
      <p className={para}>
        A cobrança independe da efetiva utilização da plataforma, considerando a
        disponibilização do serviço.
      </p>

      <h2 className={heading}>
        Cláusula 6 — Das Responsabilidades da Contratante
      </h2>
      <p className={para}>Compete à CONTRATANTE:</p>
      <ul className="ml-4 space-y-1 text-sm text-gray-700 mb-4 list-none">
        <li>I – fornecer dados corretos e atualizados;</li>
        <li>II – comunicar adequadamente seus colaboradores;</li>
        <li>III – garantir autenticidade das respostas;</li>
        <li>
          IV – utilizar os relatórios exclusivamente para fins organizacionais;
        </li>
        <li>
          V – adotar medidas internas decorrentes da análise dos resultados.
        </li>
      </ul>

      <h2 className={heading}>Cláusula 7 — Das Responsabilidades da QWork</h2>
      <p className={para}>Compete à CONTRATADA:</p>
      <ul className="ml-4 space-y-1 text-sm text-gray-700 mb-4 list-none">
        <li>I – disponibilizar a plataforma em funcionamento regular;</li>
        <li>
          II – adotar medidas técnicas razoáveis de segurança da informação;
        </li>
        <li>III – processar os dados e gerar relatório consolidado;</li>
        <li>IV – observar a legislação aplicável.</li>
      </ul>

      <h2 className={heading}>Cláusula 8 — Da Limitação de Responsabilidade</h2>
      <p className={para}>A QWORK não se responsabiliza por:</p>
      <ul className="ml-4 space-y-1 text-sm text-gray-700 mb-4 list-none">
        <li>I – decisões administrativas da CONTRATANTE;</li>
        <li>II – dados incorretos fornecidos;</li>
        <li>III – uso inadequado das informações;</li>
        <li>IV – ausência de adesão dos colaboradores;</li>
        <li>V – resultados interpretativos adotados pela CONTRATANTE.</li>
      </ul>

      <h2 className={heading}>
        Cláusula 9 — Da Gestão Operacional e Comercial
      </h2>
      <p className={para}>
        A CONTRATANTE declara ciência de que a gestão operacional, comercial e
        administrativa da plataforma poderá ser realizada pela empresa
        MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA, integrante do mesmo grupo
        econômico da CONTRATADA, sem que isso implique transferência de
        responsabilidade técnica ou jurídica pela prestação do serviço.
      </p>

      <h2 className={heading}>Cláusula 10 — Da Suspensão de Acesso</h2>
      <p className={para}>
        A CONTRATADA poderá suspender o acesso à plataforma em caso de
        inadimplemento, uso indevido ou descumprimento contratual.
      </p>
      <p className={para}>
        A suspensão não afasta a obrigação de pagamento dos valores contratados.
      </p>

      <h2 className={heading}>
        Cláusula 11 — Da Responsabilidade pelo Tratamento de Dados e Segurança
        das Informações
      </h2>
      <p className={para}>
        A CONTRATANTE declara, para todos os fins, que atua na condição de
        Controladora dos dados pessoais de seus colaboradores, sendo
        integralmente responsável pela coleta, base legal, veracidade,
        legitimidade e segurança das informações inseridas na plataforma.
      </p>
      <p className={para}>
        <strong className="text-[#2D2D2D]">Parágrafo primeiro.</strong> Compete
        exclusivamente à CONTRATANTE adotar medidas administrativas, técnicas e
        organizacionais adequadas para garantir a proteção dos dados pessoais
        sob sua responsabilidade, especialmente no que se refere ao acesso,
        compartilhamento interno, armazenamento e uso das informações.
      </p>
      <p className={para}>
        <strong className="text-[#2D2D2D]">Parágrafo segundo.</strong> A
        CONTRATADA não será responsável por incidentes de segurança, vazamentos,
        acessos indevidos ou qualquer forma de uso inadequado dos dados que
        decorram de falha, negligência, imprudência ou descumprimento das
        obrigações legais por parte da CONTRATANTE.
      </p>
      <p className={para}>
        <strong className="text-[#2D2D2D]">Parágrafo terceiro.</strong> A
        CONTRATANTE se responsabiliza integralmente por quaisquer danos,
        prejuízos, sanções administrativas ou reclamações judiciais decorrentes
        do tratamento indevido dos dados sob sua responsabilidade, obrigando-se
        a ressarcir a CONTRATADA por eventuais prejuízos que venha a sofrer em
        razão de tais ocorrências.
      </p>
      <p className={para}>
        <strong className="text-[#2D2D2D]">Parágrafo quarto.</strong> A
        CONTRATADA compromete-se a adotar medidas técnicas razoáveis de
        segurança da informação no âmbito da plataforma, limitadas à sua atuação
        como operadora, nos termos da Lei nº 13.709/2018.
      </p>

      <h2 className={heading}>Cláusula 12 — Da Natureza Jurídica</h2>
      <p className={para}>
        O presente contrato possui natureza estritamente civil, inexistindo
        vínculo trabalhista, societário ou de representação entre as partes.
      </p>

      <h2 className={heading}>Cláusula 13 — Da Vigência e Rescisão</h2>
      <p className={para}>
        O contrato terá vigência mínima de 90 (noventa) dias.
      </p>
      <p className={para}>
        A rescisão antecipada por iniciativa da CONTRATANTE antes do prazo
        mínimo implicará pagamento de multa equivalente ao valor restante do
        período contratado.
      </p>
      <p className={para}>
        A utilização da plataforma sem a correspondente emissão de relatórios ou
        cumprimento da finalidade contratada não afasta a obrigação de
        pagamento.
      </p>

      <h2 className={heading}>Cláusula 14 — Da Propriedade Intelectual</h2>
      <p className={para}>
        A plataforma QWORK, incluindo seu código-fonte, estrutura, metodologia,
        banco de dados, layout, fluxos operacionais e relatórios, constitui
        propriedade exclusiva da CONTRATADA.
      </p>
      <p className={para}>É expressamente vedado à CONTRATANTE:</p>
      <ul className="ml-4 space-y-1 text-sm text-gray-700 mb-4 list-none">
        <li>I – copiar, reproduzir, modificar ou adaptar a plataforma;</li>
        <li>
          II – realizar engenharia reversa, descompilação ou qualquer tentativa
          de acesso à estrutura interna do sistema;
        </li>
        <li>
          III – utilizar as informações, metodologia ou lógica da plataforma
          para desenvolvimento de soluções concorrentes;
        </li>
        <li>
          IV – ceder, sublicenciar ou disponibilizar o sistema a terceiros fora
          das condições contratadas.
        </li>
      </ul>
      <p className={para}>
        O descumprimento desta cláusula sujeitará a CONTRATANTE ao pagamento de
        multa equivalente a 10 (dez) vezes o valor total contratado, sem
        prejuízo de perdas e danos.
      </p>

      <h2 className={heading}>Cláusula 15 — Do Aceite Eletrônico</h2>
      <p className={para}>
        A adesão ao presente contrato ocorrerá mediante aceite eletrônico
        realizado pela CONTRATANTE na plataforma, por meio de ação inequívoca,
        como seleção de checkbox ou clique em botão de confirmação.
      </p>
      <p className={para}>
        Tal aceite constitui manifestação válida de vontade, produzindo todos os
        efeitos legais, nos termos da legislação vigente.
      </p>
      <p className={para}>
        A CONTRATANTE declara que teve acesso prévio ao contrato e concorda
        integralmente com seus termos.
      </p>

      <h2 className={heading}>Cláusula 16 — Da Assinatura Digital</h2>
      <p className={para}>
        As partes reconhecem como válida a assinatura eletrônica, nos termos da
        MP nº 2.200-2/2001 e Lei nº 14.063/2020.
      </p>

      <h2 className={heading}>Cláusula 17 — Do Foro</h2>
      <p className={para}>
        Fica eleito o foro da comarca de{' '}
        <strong className="text-[#2D2D2D]">Curitiba/PR</strong>, com renúncia
        expressa de qualquer outro, por mais privilegiado que seja.
      </p>

      {/* Rodapé do contrato */}
      <div className="mt-8 pt-5 border-t border-gray-200 text-xs text-gray-400 text-center">
        QWork Tecnologia e Gestão de Riscos Ltda — Documento gerado
        eletronicamente
      </div>
    </div>
  );
}
