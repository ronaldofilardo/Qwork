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
  DadosContratante as DC,
  DadosResponsavel as DR,
  Arquivos as AR,
  Plano,
} from '@/lib/cadastroContratante';

export type UseCadastroDeps = {
  apiFetcher?: Fetcher;
  initialTipo?: TipoEntidade;
};

export function useCadastroContratante({
  apiFetcher,
  initialTipo,
}: UseCadastroDeps = {}) {
  const api = createCadastroApi(apiFetcher);

  const [etapaAtual, setEtapaAtual] = useState<
    'tipo' | 'plano' | 'dados' | 'responsavel' | 'contrato' | 'confirmacao'
  >(initialTipo ? 'plano' : 'tipo');
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

  const [dadosContratante, setDadosContratante] = useState<DC>({
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

      setDadosContratante(
        (prev) => ({ ...prev, [name]: valorFormatado }) as DC
      );
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
      setEtapaAtual('plano');
      return;
    }

    if (etapaAtual === 'plano') {
      if (!planoSelecionado) {
        setErro('Por favor, selecione um plano');
        return;
      }

      if (planoSelecionado.tipo === 'personalizado') {
        if (!numeroFuncionarios || numeroFuncionarios < 1) {
          setErro(
            'Para plano personalizado, é obrigatório informar o número estimado de funcionários (mínimo: 1)'
          );
          return;
        }
      } else if (planoSelecionado.tipo === 'fixo') {
        const limite = planoSelecionado.caracteristicas?.limite_funcionarios;
        const minimo =
          planoSelecionado.caracteristicas?.minimo_funcionarios || 1;
        if (numeroFuncionarios < minimo) {
          setErro(
            `O número de funcionários deve ser no mínimo ${minimo} para este plano.`
          );
          return;
        }
        if (limite && numeroFuncionarios > limite) {
          setErro(
            `O número de funcionários excede o limite do plano (máx: ${limite}).`
          );
          return;
        }
      }

      setEtapaAtual('dados');
      return;
    }

    if (etapaAtual === 'dados') {
      const res = validarEtapaDados(dadosContratante, arquivos);
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

      if (planoSelecionado?.tipo === 'personalizado') {
        setEtapaAtual('confirmacao');
        return;
      }

      try {
        const contrato = gerarContratoSimulado({
          plano: planoSelecionado,
          dadosContratante,
          dadosResponsavel,
          numeroFuncionarios,
          tipo,
        });
        setContratoGerado(contrato);
        if (planoSelecionado?.tipo === 'fixo') {
          setContratoAceito(true);
          setEtapaAtual('confirmacao');
        } else {
          setContratoAceito(false);
          setEtapaAtual('contrato');
        }
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : 'Erro ao gerar contrato'
        );
      }
      return;
    }

    if (etapaAtual === 'contrato') {
      if (!contratoAceito) {
        setErro('Você deve aceitar os termos do contrato para continuar');
        return;
      }
      setEtapaAtual('confirmacao');
    }
  }, [
    arquivos,
    contratoAceito,
    dadosContratante,
    dadosResponsavel,
    etapaAtual,
    numeroFuncionarios,
    planoSelecionado,
    tipo,
  ]);

  const voltarEtapa = useCallback(() => {
    setErro('');
    if (etapaAtual === 'plano') setEtapaAtual('tipo');
    else if (etapaAtual === 'dados') setEtapaAtual('plano');
    else if (etapaAtual === 'responsavel') setEtapaAtual('dados');
    else if (etapaAtual === 'contrato') setEtapaAtual('responsavel');
    else if (etapaAtual === 'confirmacao') setEtapaAtual('contrato');
  }, [etapaAtual]);

  const submit = useCallback(async () => {
    setEnviando(true);
    setErro('');

    try {
      const isPlanoPersonalizado = planoSelecionado?.tipo === 'personalizado';
      const formData = new FormData();
      formData.append('tipo', tipo);
      Object.entries(dadosContratante).forEach(([key, value]) =>
        formData.append(key, value as string)
      );

      if (planoSelecionado) {
        formData.append('plano_id', String(planoSelecionado.id));
        if (planoSelecionado.tipo === 'fixo')
          formData.append(
            'numero_funcionarios_estimado',
            String(numeroFuncionarios)
          );
      }

      Object.entries(dadosResponsavel).forEach(([key, value]) =>
        formData.append(`responsavel_${key}`, value as string)
      );

      if (arquivos.cartao_cnpj)
        formData.append('cartao_cnpj', arquivos.cartao_cnpj);
      if (arquivos.contrato_social)
        formData.append('contrato_social', arquivos.contrato_social);
      if (arquivos.doc_identificacao)
        formData.append('doc_identificacao', arquivos.doc_identificacao);

      if (isPlanoPersonalizado) {
        formData.append('plano_tipo', 'personalizado');
        formData.append(
          'numero_funcionarios_estimado',
          String(numeroFuncionarios)
        );
        formData.append(
          'justificativa_contratante',
          `Solicitação de plano personalizado para ${dadosContratante.nome}`
        );
      }

      const data = await api.enviarCadastro(formData);

      if (isPlanoPersonalizado) {
        // Plano personalizado: NÃO redireciona, apenas exibe sucesso
        setSucesso(true);
        return { data };
      }

      if (data.simulador_url) {
        setRedirectUrl(data.simulador_url);
        return { redirect: data.simulador_url, data };
      }

      if (data.id) {
        const contratoParam = data.contrato_id
          ? `&contrato_id=${data.contrato_id}`
          : '';
        setRedirectUrl(`/sucesso-cadastro?id=${data.id}${contratoParam}`);
        return {
          redirect: `/sucesso-cadastro?id=${data.id}${contratoParam}`,
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
    dadosContratante,
    dadosResponsavel,
    numeroFuncionarios,
    planoSelecionado,
    tipo,
  ]);

  const resetarFormulario = useCallback(() => {
    setEtapaAtual('dados');
    setSucesso(false);
    setErro('');
    setDadosContratante({
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
    dadosContratante,
    setDadosContratante,
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
