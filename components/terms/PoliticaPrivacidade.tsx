'use client';

import React from 'react';

export default function PoliticaPrivacidade() {
  return (
    <div className="bg-white p-8 rounded-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        POLÍTICA DE PRIVACIDADE — QWork BPS
      </h1>

      <p className="text-sm text-gray-600 mb-8">
        Última atualização: 12 de fevereiro de 2026
      </p>

      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            1. INFORMAÇÕES GERAIS
          </h2>
          <p>
            A <strong>QWork</strong>, inscrita sob o CNPJ [INSERIR], operadora
            da plataforma <strong>QWork BPS</strong>, compromete-se com a
            proteção dos dados pessoais de seus usuários, em conformidade com a
            Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais
            normas aplicáveis.
          </p>
          <p className="mt-2">
            Esta Política de Privacidade descreve como coletamos, usamos,
            armazenamos e protegemos seus dados pessoais quando você utiliza
            nossa plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            2. DADOS COLETADOS
          </h2>
          <p>Coletamos as seguintes categorias de dados:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>
              <strong>Dados cadastrais:</strong> CPF, CNPJ, nome completo,
              e-mail, telefone, endereço, cargo
            </li>
            <li>
              <strong>Dados de acesso:</strong> login, senha criptografada, data
              e hora de acesso, endereço IP, navegador
            </li>
            <li>
              <strong>Dados de saúde psicossocial:</strong> respostas a
              questionários de avaliação psicossocial (COPSOQ III), histórico de
              avaliações
            </li>
            <li>
              <strong>Dados de pagamento:</strong> informações de transações
              financeiras (processadas por terceiros seguros)
            </li>
            <li>
              <strong>Logs de auditoria:</strong> registros de ações realizadas
              na plataforma para fins de segurança e conformidade legal
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            3. FINALIDADE DO TRATAMENTO DE DADOS
          </h2>
          <p>Os dados pessoais são tratados para as seguintes finalidades:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>
              <strong>Execução do contrato:</strong> prestação dos serviços de
              avaliação psicossocial e emissão de relatórios técnicos
            </li>
            <li>
              <strong>Cumprimento de obrigação legal:</strong> atendimento à
              NR-7, NR-1 e demais normas de segurança e saúde ocupacional
            </li>
            <li>
              <strong>Exercício regular de direitos:</strong> defesa em
              processos judiciais ou administrativos
            </li>
            <li>
              <strong>Legítimo interesse:</strong> prevenção de fraudes,
              segurança da informação, melhoria dos serviços
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            4. COMPARTILHAMENTO DE DADOS
          </h2>
          <p>
            Seus dados pessoais podem ser compartilhados nas seguintes
            situações:
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>
              <strong>Com sua empresa/clínica:</strong> gestores de RH e
              profissionais autorizados acessam dados relevantes para gestão de
              saúde ocupacional
            </li>
            <li>
              <strong>Com emissores de laudos:</strong> profissionais
              habilitados que analisam dados anonimizados para emissão de
              relatórios técnicos
            </li>
            <li>
              <strong>Com autoridades competentes:</strong> quando exigido por
              lei ou determinação judicial
            </li>
            <li>
              <strong>Com prestadores de serviços:</strong> hospedagem de dados
              (Neon/Vercel), processamento de pagamentos (gateways seguros),
              armazenamento de arquivos (Backblaze)
            </li>
          </ul>
          <p className="mt-2">
            <strong>Importante:</strong> Não vendemos, alugamos ou
            comercializamos seus dados pessoais com terceiros para fins de
            marketing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            5. ARMAZENAMENTO E SEGURANÇA
          </h2>
          <p>Implementamos as seguintes medidas de segurança:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>
              <strong>Criptografia:</strong> dados sensíveis são criptografados
              com AES-256
            </li>
            <li>
              <strong>Comunicação segura:</strong> conexões HTTPS/TLS 1.3 em
              todas as transmissões
            </li>
            <li>
              <strong>Controle de acesso:</strong> Row Level Security (RLS) no
              banco de dados PostgreSQL
            </li>
            <li>
              <strong>Backups:</strong> backups diários com redundância
              geográfica
            </li>
            <li>
              <strong>Monitoramento:</strong> logs de auditoria para detecção de
              acessos não autorizados
            </li>
          </ul>
          <p className="mt-2">
            <strong>Prazo de armazenamento:</strong> Os dados são mantidos por{' '}
            <strong>20 anos</strong> após o término do contrato, conforme
            exigência da NR-7 e Resolução CFM 1.821/2007.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            6. DIREITOS DO TITULAR DE DADOS
          </h2>
          <p>
            Você possui os seguintes direitos garantidos pela LGPD (art. 18):
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>
              <strong>Confirmação e acesso:</strong> saber se tratamos seus
              dados e solicitar cópia
            </li>
            <li>
              <strong>Correção:</strong> solicitar correção de dados
              incompletos, inexatos ou desatualizados
            </li>
            <li>
              <strong>Anonimização ou eliminação:</strong> solicitar
              anonimização ou exclusão de dados desnecessários ou tratados em
              desconformidade
            </li>
            <li>
              <strong>Portabilidade:</strong> solicitar transferência dos dados
              para outro fornecedor (quando tecnicamente viável)
            </li>
            <li>
              <strong>Informação sobre compartilhamento:</strong> saber com
              quais entidades públicas ou privadas compartilhamos seus dados
            </li>
            <li>
              <strong>Revogação do consentimento:</strong> quando aplicável
            </li>
          </ul>
          <p className="mt-2">
            <strong>Como exercer seus direitos:</strong> Entre em contato pelo
            e-mail <strong>privacidade@qwork.com.br</strong> ou pelo canal de
            atendimento disponível na plataforma.
          </p>
          <blockquote className="border-l-4 border-orange-500 pl-4 italic text-gray-600 mt-3">
            ⚠️ <strong>Observação importante:</strong> A exclusão de dados pode
            inviabilizar o cumprimento de obrigações legais (NR-7) e a prestação
            dos serviços contratados. Avalie cuidadosamente antes de solicitar.
          </blockquote>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            7. COOKIES E TECNOLOGIAS DE RASTREAMENTO
          </h2>
          <p>
            Utilizamos cookies essenciais para o funcionamento da plataforma:
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>
              <strong>Cookies de sessão:</strong> autenticação e controle de
              acesso (necessários)
            </li>
            <li>
              <strong>Cookies de segurança:</strong> prevenção de CSRF e
              validação de requisições
            </li>
          </ul>
          <p className="mt-2">
            Não utilizamos cookies de marketing ou rastreamento para fins
            publicitários.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            8. TRANSFERÊNCIA INTERNACIONAL DE DADOS
          </h2>
          <p>
            Os dados são armazenados em servidores localizados nos Estados
            Unidos (Neon Database, Vercel, Backblaze), que possuem certificações
            de segurança internacionais (SOC 2, ISO 27001).
          </p>
          <p className="mt-2">
            A transferência internacional é realizada com base em cláusulas
            contratuais padrão e garantias adequadas de proteção, conforme art.
            33 da LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            9. INCIDENTES DE SEGURANÇA
          </h2>
          <p>
            Em caso de incidente de segurança que possa acarretar risco ou dano
            relevante aos titulares, a QWork se compromete a:
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>
              Comunicar à Autoridade Nacional de Proteção de Dados (ANPD) em até{' '}
              <strong>72 horas</strong>
            </li>
            <li>
              Notificar os titulares afetados em <strong>prazo razoável</strong>
            </li>
            <li>Tomar medidas imediatas para mitigar os danos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            10. ALTERAÇÕES NESTA POLÍTICA
          </h2>
          <p>
            Esta Política de Privacidade pode ser atualizada periodicamente para
            refletir mudanças nas práticas de tratamento de dados ou na
            legislação aplicável.
          </p>
          <p className="mt-2">
            Alterações relevantes serão comunicadas com{' '}
            <strong>antecedência mínima de 30 dias</strong> por e-mail ou aviso
            na plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            11. CONTATO
          </h2>
          <p>
            Para dúvidas, solicitações ou reclamações relacionadas à proteção de
            dados:
          </p>
          <ul className="list-none ml-4 mt-2 space-y-2">
            <li>
              <strong>E-mail:</strong> privacidade@qwork.com.br
            </li>
            <li>
              <strong>Encarregado de Dados (DPO):</strong> [Nome completo]
            </li>
            <li>
              <strong>Endereço:</strong> [Endereço completo da QWork]
            </li>
          </ul>
        </section>

        <section className="bg-gray-50 p-4 rounded-lg border-l-4 border-orange-500 mt-8">
          <p className="font-semibold text-gray-900">
            ✅ Ao aceitar esta Política de Privacidade, você declara ter lido,
            compreendido e concordado com todos os termos aqui descritos.
          </p>
        </section>
      </div>
    </div>
  );
}
