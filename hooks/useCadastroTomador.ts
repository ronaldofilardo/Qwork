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
  TipoEntidade,
  DadosTomador as DT,
  DadosResponsavel as DR,
  Arquivos as AR,
} from '@/lib/cadastroTomador';
import {
  validarEmail,
  validarTelefone as validarTelBr,
} from '@/lib/validators';

export type DadosFieldErrors = {
  email?: string;
  telefone?: string;
};

export type ResponsavelFieldErrors = {
  email?: string;
  celular?: string;
};

export type FileErrors = {
  cartao_cnpj?: string;
  contrato_social?: string;
  doc_identificacao?: string;
};

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
    'tipo' | 'dados' | 'responsavel' | 'confirmacao'
  >(initialTipo ? 'dados' : 'tipo');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [tipo, setTipo] = useState<TipoEntidade>(initialTipo || 'entidade');
  const [cnpjError, setCnpjError] = useState('');
  const [dadosFieldErrors, setDadosFieldErrors] = useState<DadosFieldErrors>(
    {}
  );
  const [responsavelFieldErrors, setResponsavelFieldErrors] =
    useState<ResponsavelFieldErrors>({});
  const [fileErrors, setFileErrors] = useState<FileErrors>({});
  const [numeroFuncionarios, setNumeroFuncionarios] = useState<number>(1);
  const [contratoAceito, setContratoAceito] = useState(false);
  const [contratoGerado, setContratoGerado] = useState('');
  const [confirmacaoFinalAceita, setConfirmacaoFinalAceita] = useState(false);
  const [codigoRepresentante, setCodigoRepresentante] = useState('');
  const [semIndicacao, setSemIndicacao] = useState(false);

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

  const handleDadosBlur = useCallback(
    (field: keyof DT) => {
      setDadosFieldErrors((prev) => {
        const next = { ...prev };
        if (field === 'email') {
          const val = dadostomador.email;
          next.email = val && !validarEmail(val) ? 'Email inválido' : undefined;
        }
        if (field === 'telefone') {
          const val = dadostomador.telefone;
          next.telefone =
            val && !validarTelBr(val)
              ? 'Telefone inválido (mínimo 10 dígitos)'
              : undefined;
        }
        return next;
      });
    },
    [dadostomador]
  );

  const handleResponsavelBlur = useCallback(
    (field: keyof DR) => {
      setResponsavelFieldErrors((prev) => {
        const next = { ...prev };
        if (field === 'email') {
          const val = dadosResponsavel.email;
          next.email = val && !validarEmail(val) ? 'Email inválido' : undefined;
        }
        if (field === 'celular') {
          const val = dadosResponsavel.celular;
          next.celular =
            val && !validarTelBr(val)
              ? 'Celular inválido (mínimo 10 dígitos)'
              : undefined;
        }
        return next;
      });
    },
    [dadosResponsavel]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fileType: keyof AR) => {
      const file = e.target.files?.[0] || null;
      if (file) {
        if (file.size > 3 * 1024 * 1024) {
          setFileErrors((prev) => ({
            ...prev,
            [fileType]: `Arquivo excede 3 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
          }));
          // Limpa o input para forçar nova seleção
          e.target.value = '';
          return;
        }
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ];
        if (!allowedTypes.includes(file.type)) {
          setFileErrors((prev) => ({
            ...prev,
            [fileType]: 'Tipo inválido. Use PDF, JPG ou PNG',
          }));
          e.target.value = '';
          return;
        }
        // Arquivo válido — limpa erro deste campo
        setFileErrors((prev) => ({ ...prev, [fileType]: undefined }));
      }

      setArquivos((prev) => ({ ...prev, [fileType]: file }));
      setErro('');
    },
    []
  );

  const avancarEtapa = useCallback(() => {
    setErro('');
    if (etapaAtual === 'tipo') {
      setEtapaAtual('dados');
      return;
    }

    if (etapaAtual === 'dados') {
      // Forçar validação dos campos com blur antes de avançar
      const emailErr =
        dadostomador.email && !validarEmail(dadostomador.email)
          ? 'Email inválido'
          : undefined;
      const telErr =
        dadostomador.telefone && !validarTelBr(dadostomador.telefone)
          ? 'Telefone inválido (mínimo 10 dígitos)'
          : undefined;
      if (emailErr || telErr) {
        setDadosFieldErrors({ email: emailErr, telefone: telErr });
        setErro('Corrija os campos destacados antes de avançar');
        return;
      }
      const res = validarEtapaDados(dadostomador, arquivos);
      if (res.ok) setEtapaAtual('responsavel');
      else setErro(res.error || '');
      return;
    }

    if (etapaAtual === 'responsavel') {
      // Forçar validação dos campos com blur antes de avançar
      const emailErr =
        dadosResponsavel.email && !validarEmail(dadosResponsavel.email)
          ? 'Email inválido'
          : undefined;
      const celErr =
        dadosResponsavel.celular && !validarTelBr(dadosResponsavel.celular)
          ? 'Celular inválido (mínimo 10 dígitos)'
          : undefined;
      if (emailErr || celErr) {
        setResponsavelFieldErrors({ email: emailErr, celular: celErr });
        setErro('Corrija os campos destacados antes de avançar');
        return;
      }
      const res = validarEtapaResponsavel(dadosResponsavel, arquivos);
      if (!res.ok) {
        setErro(res.error || '');
        return;
      }

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
      const formData = new FormData();
      formData.append('tipo', tipo);
      Object.entries(dadostomador).forEach(([key, value]) =>
        formData.append(key, value as string)
      );

      if (codigoRepresentante.trim()) {
        formData.append('codigo_representante', codigoRepresentante.trim());
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

      const data = await api.enviarCadastro(formData);

      // NOVO: redirecion sempre para sucesso-cadastro com contrato
      if (data.id && data.contrato_id) {
        setRedirectUrl(
          `/sucesso-cadastro?id=${data.id}&contrato_id=${data.contrato_id}`
        );
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
    codigoRepresentante,
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
    setCodigoRepresentante('');
    setSemIndicacao(false);
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
    dadosFieldErrors,
    responsavelFieldErrors,
    fileErrors,
    numeroFuncionarios,
    setNumeroFuncionarios,
    contratoAceito,
    setContratoAceito,
    contratoGerado,
    confirmacaoFinalAceita,
    setConfirmacaoFinalAceita,
    codigoRepresentante,
    setCodigoRepresentante,
    semIndicacao,
    setSemIndicacao,
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
    handleDadosBlur,
    handleResponsavelBlur,
    handleFileChange,
    avancarEtapa,
    voltarEtapa,
    submit,
    resetarFormulario,
  } as const;
}
