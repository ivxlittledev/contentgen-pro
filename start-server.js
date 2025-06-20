#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Démarrage du serveur ContentGen Pro...');

const serverPath = join(__dirname, 'server', 'server.js');
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit',
  detached: false
});

serverProcess.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`🔌 Serveur arrêté avec le code: ${code}`);
  if (code !== 0) {
    console.log('🔄 Redémarrage automatique...');
    setTimeout(() => {
      spawn('node', [__filename], { stdio: 'inherit', detached: true });
    }, 2000);
  }
  process.exit(code);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  serverProcess.kill('SIGTERM');
});