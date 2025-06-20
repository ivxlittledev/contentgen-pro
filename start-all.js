#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Démarrage complet de ContentGen Pro...');

// Démarrer le serveur Node.js (backend)
console.log('📡 Démarrage du serveur backend...');
const serverPath = join(__dirname, 'server', 'server.js');
const backendProcess = spawn('node', [serverPath], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: __dirname
});

backendProcess.stdout.on('data', (data) => {
  console.log(`[BACKEND] ${data.toString().trim()}`);
});

backendProcess.stderr.on('data', (data) => {
  console.error(`[BACKEND ERROR] ${data.toString().trim()}`);
});

// Attendre un peu que le backend démarre
setTimeout(() => {
  // Démarrer le serveur Vite (frontend)
  console.log('🎨 Démarrage du serveur frontend...');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: __dirname,
    shell: true
  });

  frontendProcess.stdout.on('data', (data) => {
    console.log(`[FRONTEND] ${data.toString().trim()}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error(`[FRONTEND ERROR] ${data.toString().trim()}`);
  });

  // Gestion des erreurs
  frontendProcess.on('error', (error) => {
    console.error('❌ Erreur frontend:', error);
  });

  frontendProcess.on('exit', (code) => {
    console.log(`🎨 Frontend arrêté avec le code: ${code}`);
  });

  // Gestion de l'arrêt propre
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt des serveurs...');
    frontendProcess.kill('SIGINT');
    backendProcess.kill('SIGINT');
    process.exit(0);
  });

}, 2000);

// Gestion des erreurs backend
backendProcess.on('error', (error) => {
  console.error('❌ Erreur backend:', error);
});

backendProcess.on('exit', (code) => {
  console.log(`📡 Backend arrêté avec le code: ${code}`);
});