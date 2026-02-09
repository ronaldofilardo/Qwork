import { query } from '../../lib/db';
import bcrypt from 'bcryptjs';

async function setPassword(cpf: string, plain: string) {
  const hash = await bcrypt.hash(plain, 10);
  // Atualizar tanto funcionarios quanto entidades_senhas (gestores) para garantir login
  await query('UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2', [
    hash,
    cpf,
  ]);
  await query('UPDATE entidades_senhas SET senha_hash = $1 WHERE cpf = $2', [
    hash,
    cpf,
  ]);
  console.log(`Senha atualizada para ${cpf} (funcionarios + entidades_senhas)`);
}

async function loginAndGetCookie(cpf: string, senha: string) {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf, senha }),
    redirect: 'manual',
  });

  const body = await res.json().catch(() => ({}));
  const cookies = res.headers.get('set-cookie');
  return { status: res.status, body, cookies };
}

async function callWithCookie(path: string, cookie: string) {
  const url = `http://localhost:3000${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { cookie },
  });
  const text = await res.text().catch(() => '');
  return { status: res.status, body: text };
}

async function run() {
  try {
    const cpf = '04703084945';
    const senha = 'test1234';

    console.log('1) Definindo senha conhecida para o RH...');
    await setPassword(cpf, senha);

    console.log('2) Verificando dados do usuário antes do login...');
    const func = await query(
      'SELECT cpf, nome, perfil, senha_hash, ativo, tomador_id, clinica_id FROM funcionarios WHERE cpf = $1',
      [cpf]
    );
    console.log('   funcionario rows:', func.rows);
    const comp = await bcrypt.compare(senha, func.rows[0].senha_hash);
    console.log('   bcrypt.compare(senha, db_hash) =>', comp);

    console.log('3) Fazendo login para obter cookie de sessão...');
    const login = await loginAndGetCookie(cpf, senha);
    console.log('   Login status:', login.status);
    console.log('   Login body:', login.body);

    let cookie: string | undefined = undefined;

    if (login.cookies) {
      cookie = login.cookies.split(/, (?=[^ ]+=)/)[0]; // pegar primeiro cookie
      console.log('   Cookie recebido (parcial):', cookie);
    } else {
      console.warn(
        '   ❌ Cookie não recebido via login. Irei montar um cookie de sessão temporário para testar as rotas.'
      );

      // Construir sessão manualmente para testes (só para ambiente local)
      const sessionObj: any = {
        cpf,
        nome: func.rows[0].nome,
        perfil: 'rh',
        tomador_id: func.rows[0].tomador_id || null,
        clinica_id: func.rows[0].clinica_id || null,
        sessionToken: Math.random().toString(36).slice(2),
        lastRotation: Date.now(),
      };

      const cookieVal = encodeURIComponent(JSON.stringify(sessionObj));
      cookie = `bps-session=${cookieVal}`;
      console.log('   Cookie montado (parcial):', cookie);
    }

    const paths = [
      '/api/rh/lotes?empresa_id=2',
      '/api/rh/laudos?empresa_id=2',
      '/api/rh/funcionarios?empresa_id=2',
    ];

    for (const p of paths) {
      console.log(`\n4) Requisitando ${p}`);
      const r = await callWithCookie(p, cookie);
      console.log(`   Status: ${r.status}`);
      console.log(`   Body preview: ${r.body.substring(0, 400)}`);
    }

    console.log('\n✅ Testes concluídos');
    process.exit(0);
  } catch (err: any) {
    console.error('Erro no teste:', err.message || err);
    process.exit(1);
  }
}

run();
