// ============================================
// OZOBATH - Which database am I actually pointed at?
// ============================================
// Answers one question: is MONGODB_URI aimed at the OLD or the NEW cluster,
// and does it carry a database name?
//
//   node src/scripts/checkDatabaseTarget.js
//
// Reads the local .env. Connects read-only and counts documents; writes
// nothing. Run it on the VPS too - the whole point is to confirm what the
// running app sees, and that is a different .env from the one on your laptop.

require('dotenv').config();
const { MongoClient } = require('mongodb');

const CLUSTERS = {
  ozcubdw: 'OLD cluster',
  zyyrf4p: 'NEW cluster',
};

const redact = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

// The database name is the path segment AFTER the host list. Parsing it off
// the raw string naively would match the "//user:pass@host" part instead.
const dbNameFrom = (uri) => {
  const afterScheme = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const afterAuth = afterScheme.includes('@')
    ? afterScheme.slice(afterScheme.indexOf('@') + 1)
    : afterScheme;
  const slash = afterAuth.indexOf('/');
  if (slash === -1) return null;
  return afterAuth.slice(slash + 1).split('?')[0].trim() || null;
};

const identify = (uri) => {
  for (const [fragment, label] of Object.entries(CLUSTERS)) {
    if (uri.includes(fragment)) return label;
  }
  return 'UNKNOWN cluster';
};

const run = async () => {
  const uri = (process.env.MONGODB_URI || '').trim();

  console.log('');
  console.log('════════════════════════════════════════════');
  console.log('  Which database is this app using?');
  console.log('════════════════════════════════════════════');

  if (!uri) {
    console.error('  MONGODB_URI is not set. Nothing to check.');
    process.exit(1);
  }

  const which = identify(uri);
  const dbName = dbNameFrom(uri);

  console.log(`  URI     : ${redact(uri)}`);
  console.log(`  Cluster : ${which}`);
  console.log(`  Database: ${dbName || 'MISSING'}`);
  console.log('════════════════════════════════════════════');
  console.log('');

  if (!dbName) {
    console.error('PROBLEM: the URI has no /<dbname> path segment.');
    console.error('');
    console.error('  The driver will silently fall back to a database named "test",');
    console.error('  which is empty. The app connects fine and reads zero rows, so');
    console.error('  this looks like lost data but is really a URI typo.');
    console.error('');
    console.error('  Add the name between the host and the "?":');
    console.error('    ...mongodb.net/ozobath?retryWrites=true&w=majority');
    console.error('');
    process.exit(1);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });

  try {
    process.stdout.write('  Connecting... ');
    await client.connect();
    console.log('OK');

    const db = client.db(dbName);
    const collections = (await db.listCollections().toArray())
      .filter((c) => c.type === 'collection' && !c.name.startsWith('system.'));

    // A handful of collections that should always hold rows in a live install.
    const probes = ['products', 'categories', 'users', 'orders'];
    let total = 0;

    console.log('');
    for (const name of probes) {
      if (!collections.some((c) => c.name === name)) {
        console.log(`    ${name.padEnd(14)} (collection missing)`);
        continue;
      }
      const n = await db.collection(name).countDocuments();
      total += n;
      console.log(`    ${name.padEnd(14)} ${String(n).padStart(5)} docs`);
    }

    console.log('');
    console.log(`  ${collections.length} collections total`);
    console.log('');

    if (collections.length === 0 || total === 0) {
      console.error('  WARNING: connected, but the expected collections are empty.');
      console.error('           Check the database name and that the migration ran.');
      console.log('');
      process.exit(1);
    }

    console.log(`  Live and populated on the ${which}.`);
    console.log('');
  } finally {
    await client.close().catch(() => {});
  }
};

run().catch((err) => {
  console.error('');
  console.error('FAILED:', err.message);
  console.error('');
  console.error('  TLS "alert number 80" usually means this IP is not on the');
  console.error('  cluster\'s Atlas Network Access list.');
  console.error('');
  process.exit(1);
});
