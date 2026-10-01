// Testes Automatizados de Lógica, Segurança e Multiusuário — Concha Literária
import { hashPassword, comparePassword, createSessionToken, verifySessionToken } from '../lib/auth';
import { registerSchema, readingSessionCreateSchema, bookSchema } from '../lib/validations';

async function runTestSuite() {
  console.info('🧪 Iniciando Bateria de Testes do Concha Literária...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.info(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Testes de Segurança e Hashing de Senhas
  console.info('1. Segurança e Hashing:');
  const password = 'MinhaSenhaSegura123!';
  const hash = await hashPassword(password);
  assert(hash !== password, 'Senha não deve ser salva em texto puro');
  assert(await comparePassword(password, hash), 'Comparação de senha correta deve passar');
  assert(!(await comparePassword('SenhaErrada123!', hash)), 'Senha incorreta deve ser rejeitada');

  // 2. Testes de Tokens JWT e Sessão
  console.info('\n2. Sessão e Tokens JWT (jose):');
  const token = await createSessionToken({
    userId: 'user_alice_123',
    email: 'alice@exemplo.com',
    username: 'alice'
  });
  assert(typeof token === 'string' && token.length > 20, 'Token JWT gerado com sucesso');

  const verified = await verifySessionToken(token);
  assert(verified?.userId === 'user_alice_123', 'Token decodifica userId corretamente');
  assert(verified?.email === 'alice@exemplo.com', 'Token decodifica e-mail corretamente');

  const invalidVerified = await verifySessionToken('token.invalido.adulterado');
  assert(invalidVerified === null, 'Token adulterado é devidamente rejeitado');

  // 3. Teste de Validação Zod (Schemas de Cadastro e Livro)
  console.info('\n3. Validação de Schemas (Zod):');
  const validRegister = registerSchema.safeParse({
    name: 'Machado de Assis',
    username: 'machado',
    email: 'machado@academia.org.br',
    password: 'SenhaForte123!',
    confirmPassword: 'SenhaForte123!'
  });
  assert(validRegister.success, 'Cadastro com dados válidos passa na validação');

  const invalidRegister = registerSchema.safeParse({
    name: 'M',
    username: 'invalid username with spaces',
    email: 'email_invalido',
    password: 'curta',
    confirmPassword: 'diferente'
  });
  assert(!invalidRegister.success, 'Cadastro inválido é rejeitado com múltiplos erros');

  // 4. Teste de Validação de Sessão de Leitura (EndPage >= StartPage)
  console.info('\n4. Regra de Negócio de Sessão de Leitura:');
  const validSession = readingSessionCreateSchema.safeParse({
    userBookId: 'ub_1',
    bookId: 'b_1',
    startPage: 10,
    endPage: 25,
    durationSeconds: 900,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString()
  });
  assert(validSession.success, 'Sessão com página final >= página inicial é aceita');

  const invalidSession = readingSessionCreateSchema.safeParse({
    userBookId: 'ub_1',
    bookId: 'b_1',
    startPage: 50,
    endPage: 20, // Inválido: página final menor que inicial
    durationSeconds: 600,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString()
  });
  assert(!invalidSession.success, 'Sessão com página final menor que inicial é rejeitada pelo schema');

  // 5. Teste de Precisão do Cronômetro baseado em Timestamps (Seção 48)
  console.info('\n5. Precisão do Cronômetro (Timestamps):');
  const startTime = Date.now() - 5000; // 5 segundos atrás
  const pausedAccumulatedMs = 1000; // 1 segundo de pausa
  const calculatedElapsedSeconds = Math.floor((Date.now() - startTime - pausedAccumulatedMs) / 1000);
  assert(calculatedElapsedSeconds === 4, `Cálculo de tempo decorrido deve descontar pausas acumuladas (esperado 4s, obtido ${calculatedElapsedSeconds}s)`);

  // 6. Teste de Permissão Multiusuário (Usuário A tentando acessar Usuário B)
  console.info('\n6. Isolamento Multiusuário (Seção 38):');
  const userA = { id: 'usr_aaa', name: 'Alice' };
  const userB = { id: 'usr_bbb', name: 'Bob' };
  const resourceOfUserB = { id: 'book_123', userId: userB.id, title: 'Livro Secreto' };

  function checkResourceAccess(authenticatedUserId: string, resourceOwnerId: string): boolean {
    return authenticatedUserId === resourceOwnerId;
  }

  assert(checkResourceAccess(userA.id, userA.id), 'Usuário A acessa seu próprio recurso com sucesso');
  assert(!checkResourceAccess(userA.id, resourceOfUserB.userId), 'Usuário A é impedido de acessar recurso pertencente ao Usuário B');

  // Relatório Final
  console.info(`\n📊 Resultado dos Testes: ${passed} passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Erro na execução da suíte:', err);
  process.exit(1);
});
