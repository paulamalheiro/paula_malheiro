import net from 'net';

const host = '2.24.99.187';
const port = 8000;

console.log(`Testando conexão TCP direta com ${host}:${port}...`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.connect(port, host, () => {
  console.log('✅ CONEXÃO TCP ESTABELECIDA COM SUCESSO na porta 8000!');
  socket.write('GET /api/v1/deploy?uuid=p10i63vuzaejlphawq5hgs42&force=false HTTP/1.1\r\nHost: 2.24.99.187:8000\r\nConnection: close\r\n\r\n');
});

socket.on('data', (data) => {
  console.log('Resposta recebida:');
  console.log(data.toString());
  socket.destroy();
});

socket.on('timeout', () => {
  console.error('❌ TIMEOUT: O servidor não respondeu em 5 segundos (porta 8000 pode estar bloqueada pelo firewall para acessos externos).');
  socket.destroy();
});

socket.on('error', (err) => {
  console.error('❌ ERRO TCP:', err.message);
});
