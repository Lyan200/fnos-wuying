'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = __dirname ? path.join(__dirname, '..') : path.resolve('..');
const frontendDir = path.join(root, 'frontend');
const backendDir = path.join(root, 'backend');
const outDir = path.join(root, 'dist');

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function emptyDir(p){ if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); ensureDir(p); }

function run(cmd, cwd){
	console.log(`[build-combined] ${cmd} (cwd=${cwd || process.cwd()})`);
	execSync(cmd, { stdio: 'inherit', cwd: cwd || process.cwd() });
}

// 1) Build frontend
run('npm run build', frontendDir);

// 2) Prepare outDir
emptyDir(outDir);

// 3) Copy backend server into dist/
fs.cpSync(backendDir, outDir, { recursive: true, filter: (src) => !src.endsWith('node_modules') });

// 4) Put frontend artifacts to dist/public
const frontendDist = path.join(frontendDir, 'dist');
const publicOut = path.join(outDir, 'public');
ensureDir(publicOut);
fs.cpSync(frontendDist, publicOut, { recursive: true });

// 5) Create minimal package.json for dist runtime
const backendPkg = JSON.parse(fs.readFileSync(path.join(backendDir, 'package.json'), 'utf8'));
const distPkg = {
	name: 'notepad-combined',
	version: backendPkg.version || '1.0.0',
	private: true,
	main: 'server.js',
	type: backendPkg.type || 'commonjs',
	scripts: {
		start: 'node server.js'
	},
	dependencies: backendPkg.dependencies || { express: '^4.19.2' }
};
fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(distPkg, null, 2), 'utf8');

// 6) Install production dependencies inside dist to make it self-contained
try {
    run('npm install --omit=dev', outDir);
} catch (e) {
    console.warn('[build-combined] npm install failed inside dist. You can run it manually.');
}

console.log('\n[build-combined] Combined dist ready at dist/. To run:');
console.log('  cd dist && npm start');

const packDir = path.join(root, 'fnnas.notepad')
const packServerDir = path.join(packDir, 'app', 'server');
run(`rm -rf ${packServerDir}`)
run(`mkdir ${packServerDir}`)
run(`cp -r ${outDir}/* ${packServerDir}/`)
run(`fnpack build -d ${packDir}`)