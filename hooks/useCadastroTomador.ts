'use client';

import { useEffect, useState, useCallback } from 'react';
import { createCadastroApi, Fetcher } from '@/lib/cadastroApi';
import {
  formatarCNPJ,
  formatarCPF,
  formatarTelefone,
  formatarCEP,
  validarCNPJ,
  validarEtapaDados,
  validarEtapaResponsavel,
  gerarContratoSimulado,
  TipoEntidade,
  DadosTomador as DT,
  DadosResponsavel as DR,
  Arquivos as AR,
  Plano,
} from '@/lib/cadastroTomador';

export type UseCadastroDeps = {
  apiFetcher?: Fetcher;
  initialTipo?: TipoEntidade;
};

export function useCadastroTomador({
  apiFetcher,
  initialTipo,
}: UseCadastroDeps = {}) {
  const api = createCadastroApi(apiFetcher);

  const [etapaAtual, setEtapaAtual] = useState<
    'tipo' | 'plano' | 'dados' | 'responsavel' | 'contrato' | 'confirmacao'
  >(initialTipo ? 'dados' : 'tipo'); // NOVO: pula plano, vai direto para dados
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [tipo, setTipo] = useState<TipoEntidade>(initialTipo || 'entidade');
  const [cnpjError, setCnpjError] = useState('');
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [numeroFuncionarios, setNumeroFuncionarios] = useState<number>(1);
  const [contratoAceito, setContratoAceito] = useState(false);
  const [contratoGerado, setContratoGerado] = useState('');
  const [confirmacaoFinalAceita, setConfirmacaoFinalAceita] = useState(false);

  const [dadostomador, setDadostomador] = useState<DT>({
    nome: '',
    cnpj: '',
    inscricao_estadual: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  const [dadosResponsavel, setDadosResponsavel] = useState<DR>({
    nome: '',
    cpf: '',
    cargo: '',
    email: '',
    celular: '',
  });

  const [arquivos, setArquivos] = useState<AR>({
    cartao_cnpj: null,
    contrato_social: null,
    doc_identificacao: null,
  });

  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!planos.length) {
      api
        .getPlanos()
        .then((data: any) => {
          if (Array.isArray(data)) setPlanos(data as Plano[]);
          else if (data.planos) setPlanos(data.planos as Plano[]);
        })
        .catch(() => {
          // noop - caller can surface error state via setErro
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!planoSelecionado) return;
    if (planoSelecionado.tipo === 'fixo') setNumeroFuncionarios(1);
    else setNumeroFuncionarios(0);
  }, [planoSelecionado]);

  const handleDadosChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let valorFormatado = value;

      if (name === 'cnpj') {
        valorFormatado = formatarCNPJ(value);
        if (valorFormatado.replace(/\D/g, '').length === 14) {
          if (!validarCNPJ(valorFormatado)) setCnpjError('CNPJ inválido');
          else setCnpjError('');
        } else if (valorFormatado.replace(/\D/g, '').length > 0)
          setCnpjError('CNPJ deve ter 14 dígitos');
        else setCnpjError('');
      }

      if (name === 'telefone') valorFormatado = formatarTelefone(value);
      if (name === 'cep') valorFormatado = formatarCEP(value);
      if (name === 'estado') valorFormatado = value.toUpperCase().slice(0, 2);

      setDadostomador((prev) => ({ ...prev, [name]: valorFormatado }) as DT);
    },
    []
  );

  const handleResponsavelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let valorFormatado = value;
      if (name === 'cpf') valorFormatado = formatarCPF(value);
      if (name === 'celular') valorFormatado = formatarTelefone(value);
      setDadosResponsavel(
        (prev) => ({ ...prev, [name]: valorFormatado }) as DR
      );
    },
    []
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fileType: keyof AR) => {
      const file = e.target.files?.[0] || null;
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setErro('Arquivo não pode exceder 5MB');
          return;
        }
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ];
        if (!allowedTypes.includes(file.type)) {
          setErro('Arquivo deve ser PDF, JPG ou PNG');
          return;
        }
      }

      setArquivos((prev) => ({ ...prev, [fileType]: file }));
      setErro('');
    },
    []
  );

  const avancarEtapa = useCallback(() => {
    setErro('');
    if (etapaAtual === 'tipo') {
      // NOVO: pula plano, vai direto pro dados
      setEtapaAtual('dados');
      return;
    }

    if (etapaAtual === 'dados') {
      const res = validarEtapaDados(dadostomador, arquivos);
      if (res.ok) setEtapaAtual('responsavel');
      else setErro(res.error || '');
      return;
    }

    if (etapaAtual === 'responsavel') {
      const res = validarEtapaResponsavel(dadosResponsavel, arquivos);
      if (!res.ok) {
        setErro(res.error || '');
        return;
      }

      // NOVO: não gera contrato aqui; será gerado após aceitar no backend
      // Ir direto para confirmacao
      setEtapaAtual('confirmacao');
      return;
    }

    if (etapaAtual === 'confirmacao') {
      // Confirmação final antes de enviar
      setEtapaAtual('confirmacao');
    }
  }, [
    arquivos,
    contratoAceito,
    dadostomador,
    dadosResponsavel,
    etapaAtual,
    numeroFuncionarios,
    planoSelecionado,
    tipo,
  ]);

  const voltarEtapa = useCallback(() => {
    setErro('');
    if (etapaAtual === 'dados') setEtapaAtual('tipo');
    else if (etapaAtual === 'responsavel') setEtapaAtual('dados');
    else if (etapaAtual === 'confirmacao') setEtapaAtual('responsavel');
  }, [etapaAtual]);

  const submit = useCallback(async () => {
    setEnviando(true);
    setErro('');

    try {
      // NOVO: sem seleção de plano, todos os campos são enviados como null
      const formData = new FormData();
      formData.append('tipo', tipo);
      Object.entries(dadostomador).forEach(([key, value]) =>
        formData.append(key, value as string)
      );

      // Não enviar plano (foi removido do fluxo)
      // formData.append('plano_id', String(planoSelecionado.id));

      Object.entries(dadosResponsavel).forEach(([key, value]) =>
        formData.append(`responsavel_${key}`, value as string)
      );

      if (arquivos.cartao_cnpj)
        formData.append('cartao_cnpj', arquivos.cartao_cnpj);
      if (arquivos.contrato_social)
        formData.append('contrato_social', arquivos.contrato_social);
      if (arquivos.doc_identificacao)
        formData.append('doc_identificacao', arquivos.doc_identificacao);

      const data = await api.enviarCadastro(formData);

      // NOVO: redirecion sempre para sucesso-cadastro com contrato
      if (data.id && data.contrato_id) {
        setRedirectUrl(`/sucesso-cadastro?id=${data.id}&contrato_id=${data.contrato_id}`);
        return {
          redirect: `/sucesso-cadastro?id=${data.id}&contrato_id=${data.contrato_id}`,
          data,
        };
      }

      // Fallback se não houver contrato_id (não deveria acontecer)
      if (data.id) {
        setRedirectUrl(`/sucesso-cadastro?id=${data.id}`);
        return {
          redirect: `/sucesso-cadastro?id=${data.id}`,
          data,
        };
      }

      setSucesso(true);
      return { data };
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : 'Erro ao enviar cadastro'
      );
      throw error;
    } finally {
      setEnviando(false);
    }
  }, [
    api,
    arquivos,
    dadostomador,
    dadosResponsavel,
    tipo,
  ]);

  const resetarFormulario = useCallback(() => {
    setEtapaAtual('dados');
    setSucesso(false);
    setErro('');
    setDadostomador({
      nome: '',
      cnpj: '',
      inscricao_estadual: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
    });
    setDadosResponsavel({
      nome: '',
      cpf: '',
      cargo: '',
      email: '',
      celular: '',
    });
    setArquivos({
      cartao_cnpj: null,
      contrato_social: null,
      doc_identificacao: null,
    });
  }, []);

  return {
    // state
    etapaAtual,
    erro,
    sucesso,
    enviando,
    tipo,
    setTipo,
    cnpjError,
    planos,
    planoSelecionado,
    setPlanoSelecionado,
    numeroFuncionarios,
    setNumeroFuncionarios,
    contratoAceito,
    setContratoAceito,
    contratoGerado,
    confirmacaoFinalAceita,
    setConfirmacaoFinalAceita,
    dadosContratante: dadostomador,
    setDadosContratante: setDadostomador,
    dadostomador,
    setDadostomador,
    dadosResponsavel,
    setDadosResponsavel,
    arquivos,
    setArquivos,
    redirectUrl,

    // actions
    handleDadosChange,
    handleResponsavelChange,
    handleFileChange,
    avancarEtapa,
    voltarEtapa,
    submit,
    resetarFormulario,
  } as const;
}
