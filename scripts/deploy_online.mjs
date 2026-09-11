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
  runCmd('git add .gitignore .env.example package.json package-lock.json src/ scripts/ PROJECT_OVERVIEW.md', 'Git Add');

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

  // 5. Acionamento do Deploy no Coolify via Webhook / API
  console.log('\n[5/5] Acionando deploy automático no Coolify...');
  const coolifyUrl = 'http://2.24.99.187:8000/api/v1/deploy?uuid=p10i63vuzaejlphawq5hgs42&force=false';
  const token = '10|NP4yiFPOr4ncPklzdNwyWaCMpyrh6YBsYU6huFLu6a418791';
  try {
    const res = await fetch(coolifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    if (res.ok) {
      const data = await res.json();
      const depUuid = data.deployments?.[0]?.deployment_uuid || '';
      console.log(`✓ Deploy acionado com sucesso no Coolify! (UUID: ${depUuid})`);
    } else {
      console.warn('Deploy webhook retornou status:', res.status);
    }
  } catch (e) {
    console.warn('Aviso: Não foi possível acionar o webhook do Coolify automaticamente:', e.message);
  }

  console.log(`
=============================================================================
   ✅ DEPLOY CONCLUÍDO COM SUCESSO!
=============================================================================

Repositório: github.com/paulamalheiro/paula_malheiro (branch: main)
Servidor Coolify: http://2.24.99.187:8000

🌐 URLs Oficiais em Produção:
- Site Público: https://paula.janagencia.com.br
- Backend PocketBase: https://pb-paula.janagencia.com.br
=============================================================================
`);
}

main();
