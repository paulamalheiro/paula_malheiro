import { execSync } from 'child_process';

/**
 * SCRIPT DE DEPLOY E PUBLICAÇÃO ONLINE: SITE PAULA MALHEIRO
 * Executável diretamente pelo Antigravity IDE ou via 'npm run deploy'
 */

function runCmd(command, desc) {
  console.log(`\n⏳ [${desc}] Executando: ${command}`);
  try {
    execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

async function main() {
  console.log(`
=============================================================================
   🚀 DEPLOY ONLINE: SITE PAULA MALHEIRO (SUPABASE -> POCKETBASE)
=============================================================================
`);

  // 1. Validação de compilação TypeScript e bundle Vite
  console.log('[1/4] Verificando compilação de produção com npm run build...');
  const buildResult = runCmd('npm.cmd run build', 'Build de Produção');
  if (!buildResult.ok) {
    console.error('❌ Abortando deploy: o build falhou. Corrija os erros antes de subir.');
    process.exit(1);
  }
  console.log('✓ Build concluído com 0 erros!');

  // 2. Git stage
  console.log('\n[2/4] Preparando arquivos modificados para commit no Git...');
  runCmd('git add .env.example package.json package-lock.json src/ scripts/ PROJECT_OVERVIEW.md', 'Git Add');

  // 3. Commit
  const commitMsg = process.argv.slice(2).join(' ') || 'feat: migração completa do frontend para PocketBase no Coolify';
  console.log(`\n[3/4] Criando commit: "${commitMsg}"...`);
  
  // Executa commit se houver modificações staged
  runCmd(`git commit -m "${commitMsg}"`, 'Git Commit');

  // 4. Push para o repositório no GitHub
  console.log('\n[4/4] Enviando alterações para o repositório remoto (GitHub branch main)...');
  const pushResult = runCmd('git push origin main', 'Git Push origin main');

  if (!pushResult.ok) {
    console.error('\n❌ Falha ao enviar para o GitHub. Verifique as credenciais ou branch.');
    process.exit(1);
  }

  console.log(`
=============================================================================
   ✅ CÓDIGO ATUALIZADO NO GITHUB COM SUCESSO!
=============================================================================

Repositório: github.com/paulamalheiro/paula_malheiro (branch: main)

📡 Atualização no Coolify:
1. Se o Webhook do Coolify estiver ativo, o deploy já começou automaticamente.
2. No painel do Coolify -> Aplicação "Site Paula":
   - Verifique se a variável está configurada em 'Environment Variables':
     VITE_POCKETBASE_URL=https://pb-paula.janagencia.com.br
   - Caso necessário, clique no botão "Redeploy" para gerar a versão atualizada.

🌐 URLs Oficiais:
- Frontend Produção: https://paula.janagencia.com.br
- Backend PocketBase: https://pb-paula.janagencia.com.br
=============================================================================
`);
}

main();
