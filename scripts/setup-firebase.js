/**
 * setup-firebase.js
 * Configura Firestore rules, Storage rules e índices via REST API
 * usando as credenciais do SDK-firebase.json (Admin SDK).
 */

const admin = require('firebase-admin');
const https = require('https');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../SDK-firebase.json');
const PROJECT_ID = serviceAccount.project_id;

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
});

async function getToken() {
  const token = await app.options.credential.getAccessToken();
  return token.access_token;
}

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function makeOptions(token, method, hostname, path, body) {
  return {
    hostname,
    path,
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
    },
  };
}

// ── Firestore Rules ────────────────────────────────────────────────────────
async function deployFirestoreRules(token) {
  console.log('\n[1/3] Implantando regras do Firestore...');

  const rulesContent = fs.readFileSync(
    path.join(__dirname, '../firestore.rules'),
    'utf-8'
  );

  // Criar ruleset
  const rulesetBody = {
    source: {
      files: [{ name: 'firestore.rules', content: rulesContent }],
    },
  };

  const rulesetRes = await request(
    makeOptions(
      token,
      'POST',
      'firebaserules.googleapis.com',
      `/v1/projects/${PROJECT_ID}/rulesets`,
      rulesetBody
    ),
    rulesetBody
  );

  const rulesetName = rulesetRes.name;
  console.log(`   Ruleset criado: ${rulesetName}`);

  // Atualizar release
  const releaseName = `projects/${PROJECT_ID}/releases/cloud.firestore`;
  const releaseBody = {
    release: {
      name: releaseName,
      rulesetName,
    },
  };

  await request(
    makeOptions(
      token,
      'PATCH',
      'firebaserules.googleapis.com',
      `/v1/${releaseName}`,
      releaseBody
    ),
    releaseBody
  );

  console.log('   ✓ Regras do Firestore implantadas com sucesso.');
}

// ── Storage Rules ──────────────────────────────────────────────────────────
async function deployStorageRules(token) {
  console.log('\n[2/3] Implantando regras do Storage...');

  const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatares públicos — leitura pública, escrita somente do dono
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Ícones de links — leitura pública, escrita somente do dono
    match /link-icons/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const rulesetBody = {
    source: {
      files: [{ name: 'storage.rules', content: storageRules }],
    },
  };

  const rulesetRes = await request(
    makeOptions(
      token,
      'POST',
      'firebaserules.googleapis.com',
      `/v1/projects/${PROJECT_ID}/rulesets`,
      rulesetBody
    ),
    rulesetBody
  );

  const rulesetName = rulesetRes.name;
  console.log(`   Ruleset criado: ${rulesetName}`);

  // Descobrir o bucket padrão
  const bucketName = `${PROJECT_ID}.firebasestorage.app`;
  const releaseName = `projects/${PROJECT_ID}/releases/firebase.storage/${bucketName}`;
  const releaseBody = {
    release: {
      name: releaseName,
      rulesetName,
    },
  };

  try {
    await request(
      makeOptions(
        token,
        'PATCH',
        'firebaserules.googleapis.com',
        `/v1/${releaseName}`,
        releaseBody
      ),
      releaseBody
    );
    console.log('   ✓ Regras do Storage implantadas com sucesso.');
  } catch (e) {
    // Tenta com o bucket alternativo .appspot.com
    try {
      const altBucket = `${PROJECT_ID}.appspot.com`;
      const altRelease = `projects/${PROJECT_ID}/releases/firebase.storage/${altBucket}`;
      const altBody = { release: { name: altRelease, rulesetName } };
      await request(
        makeOptions(token, 'PATCH', 'firebaserules.googleapis.com', `/v1/${altRelease}`, altBody),
        altBody
      );
      console.log('   ✓ Regras do Storage implantadas (bucket appspot.com).');
    } catch (e2) {
      console.warn('   ⚠ Não foi possível atualizar release do Storage:', e2.message);
      console.warn('   Verifique se o Storage está habilitado no console do Firebase.');
    }
  }
}

// ── Firestore Indexes ──────────────────────────────────────────────────────
async function createIndexes(token) {
  console.log('\n[3/3] Criando índices compostos do Firestore...');

  const db = admin.firestore();
  const baseUrl = `firestore.googleapis.com`;

  const indexes = [
    // links: active ASC + order ASC (para a página pública)
    {
      collectionGroup: 'links',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'active', order: 'ASCENDING' },
        { fieldPath: 'order', order: 'ASCENDING' },
      ],
    },
    // clicks: userId ASC + timestamp DESC (para analytics)
    {
      collectionGroup: 'clicks',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' },
      ],
    },
    // clicks: linkId ASC + timestamp DESC (para analytics por link)
    {
      collectionGroup: 'clicks',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'linkId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' },
      ],
    },
  ];

  for (const index of indexes) {
    const urlPath = `/v1/projects/${PROJECT_ID}/databases/(default)/collectionGroups/${index.collectionGroup}/indexes`;
    const body = {
      queryScope: index.queryScope,
      fields: index.fields,
    };

    try {
      const res = await request(
        makeOptions(token, 'POST', baseUrl, urlPath, body),
        body
      );
      console.log(`   ✓ Índice criado: ${index.collectionGroup} [${index.fields.map(f => f.fieldPath).join(', ')}]`);
    } catch (e) {
      if (e.message.includes('ALREADY_EXISTS') || e.message.includes('already exists')) {
        console.log(`   ~ Índice já existe: ${index.collectionGroup} [${index.fields.map(f => f.fieldPath).join(', ')}]`);
      } else {
        console.warn(`   ⚠ Erro ao criar índice (${index.collectionGroup}):`, e.message.slice(0, 120));
      }
    }
  }

  console.log('   ✓ Índices processados.');
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n=== Configurando Firebase para projeto: ${PROJECT_ID} ===`);

  try {
    const token = await getToken();

    await deployFirestoreRules(token);
    await deployStorageRules(token);
    await createIndexes(token);

    console.log('\n✅ Firebase configurado com sucesso!\n');
  } catch (err) {
    console.error('\n❌ Erro durante a configuração:', err.message);
    process.exit(1);
  } finally {
    await app.delete();
  }
}

main();
