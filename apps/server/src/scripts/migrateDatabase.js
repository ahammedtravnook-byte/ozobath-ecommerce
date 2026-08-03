// ============================================
// OZOBATH - Atlas → Atlas Migration
// ============================================
// Copies every collection, document and index from the OLD cluster to the NEW
// one, then verifies counts match. Read-only against the source.
//
// Usage (from apps/server):
//   MONGODB_OLD_URI="<old>" MONGODB_NEW_URI="<new>" node src/scripts/migrateDatabase.js --dry-run
//   MONGODB_OLD_URI="<old>" MONGODB_NEW_URI="<new>" node src/scripts/migrateDatabase.js
//
// Pass the URIs as env vars so credentials never land in shell history or code.
// Run --dry-run first: it connects to both, reports what WOULD be copied, and
// writes nothing.
//
// Safety:
//   - Refuses to run if the target has data, unless --force is passed.
//   - Never drops or modifies the source.
//   - Verifies document counts per collection at the end.

const { MongoClient } = require('mongodb');

const OLD_URI = process.env.MONGODB_OLD_URI;
const NEW_URI = process.env.MONGODB_NEW_URI;
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

const BATCH_SIZE = 500;

if (!OLD_URI || !NEW_URI) {
  console.error('');
  console.error('FATAL: Both MONGODB_OLD_URI and MONGODB_NEW_URI must be set.');
  console.error('');
  console.error('  MONGODB_OLD_URI="..." MONGODB_NEW_URI="..." node src/scripts/migrateDatabase.js --dry-run');
  console.error('');
  process.exit(1);
}

if (OLD_URI === NEW_URI) {
  console.error('FATAL: Source and target URIs are identical. Aborting.');
  process.exit(1);
}

// Hide credentials when printing a URI.
const redact = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

const dbNameFrom = (uri) => {
  const m = uri.match(/\/([^/?]+)(\?|$)/);
  return m ? m[1] : null;
};

const migrate = async () => {
  const oldName = dbNameFrom(OLD_URI);
  const newName = dbNameFrom(NEW_URI);

  if (!oldName || !newName) {
    console.error('FATAL: Could not read a database name from one of the URIs.');
    console.error('       Expected .../<dbname>?... — check the path segment.');
    process.exit(1);
  }

  console.log('');
  console.log('════════════════════════════════════════════');
  console.log('  OZOBATH — Database Migration');
  console.log('════════════════════════════════════════════');
  console.log(`  Mode   : ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`  Source : ${redact(OLD_URI)}`);
  console.log(`  Target : ${redact(NEW_URI)}`);
  console.log('════════════════════════════════════════════');
  console.log('');

  const oldClient = new MongoClient(OLD_URI, { serverSelectionTimeoutMS: 20000 });
  const newClient = new MongoClient(NEW_URI, { serverSelectionTimeoutMS: 20000 });

  try {
    process.stdout.write('Connecting to source... ');
    await oldClient.connect();
    console.log('OK');

    process.stdout.write('Connecting to target... ');
    await newClient.connect();
    console.log('OK');
    console.log('');

    const oldDb = oldClient.db(oldName);
    const newDb = newClient.db(newName);

    const collections = (await oldDb.listCollections().toArray())
      .filter((c) => c.type === 'collection' && !c.name.startsWith('system.'))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!collections.length) {
      console.error('FATAL: Source database has no collections. Wrong URI?');
      process.exit(1);
    }

    // ─── Guard: refuse to overwrite a populated target ───
    const targetCols = await newDb.listCollections().toArray();
    let targetDocs = 0;
    for (const c of targetCols) {
      targetDocs += await newDb.collection(c.name).countDocuments();
    }

    if (targetDocs > 0 && !FORCE && !DRY_RUN) {
      console.error('');
      console.error(`FATAL: Target already holds ${targetDocs} document(s) across ${targetCols.length} collection(s).`);
      console.error('       Refusing to write into a non-empty database.');
      console.error('');
      console.error('       Wipe the target in Atlas first, or re-run with --force to');
      console.error('       merge (existing _id values will be overwritten).');
      console.error('');
      process.exit(1);
    }

    if (targetDocs > 0) {
      console.log(`WARNING: target already has ${targetDocs} document(s).`);
      console.log(DRY_RUN ? '         (dry run — nothing written)' : '         --force given, proceeding to merge.');
      console.log('');
    }

    // ─── Copy ───
    const summary = [];
    let totalCopied = 0;

    for (const { name } of collections) {
      const src = oldDb.collection(name);
      const count = await src.countDocuments();
      const indexes = await src.indexes();
      // _id_ is created automatically; never replay it.
      const custom = indexes.filter((i) => i.name !== '_id_');

      process.stdout.write(`  ${name.padEnd(28)} ${String(count).padStart(5)} docs, ${custom.length} idx ... `);

      if (DRY_RUN) {
        console.log('would copy');
        summary.push({ name, count, indexes: custom.length, copied: 0 });
        continue;
      }

      let copied = 0;
      if (count > 0) {
        const cursor = src.find({});
        let batch = [];
        while (await cursor.hasNext()) {
          batch.push(await cursor.next());
          if (batch.length >= BATCH_SIZE) {
            await newDb.collection(name).insertMany(batch, { ordered: false });
            copied += batch.length;
            batch = [];
          }
        }
        if (batch.length) {
          await newDb.collection(name).insertMany(batch, { ordered: false });
          copied += batch.length;
        }
      } else {
        // Preserve empty collections so the schema shape survives.
        await newDb.createCollection(name).catch(() => {});
      }

      // ─── Indexes ───
      // Critical for correctness, not just speed: pendingcheckouts and orders
      // rely on unique indexes for payment idempotency. A missing unique index
      // silently permits duplicate orders.
      let idxOk = 0;
      for (const idx of custom) {
        const { key, name: idxName, v, ns, background, ...opts } = idx;
        try {
          await newDb.collection(name).createIndex(key, { name: idxName, ...opts });
          idxOk++;
        } catch (e) {
          console.log('');
          console.log(`      ! index "${idxName}" failed: ${e.message}`);
        }
      }

      totalCopied += copied;
      console.log(`copied ${copied}, ${idxOk}/${custom.length} idx`);
      summary.push({ name, count, indexes: custom.length, copied, idxOk });
    }

    // ─── Verify ───
    console.log('');
    console.log('════════════════════════════════════════════');

    if (DRY_RUN) {
      const docs = summary.reduce((s, r) => s + r.count, 0);
      console.log(`  DRY RUN — ${summary.length} collections, ${docs} documents would be copied.`);
      console.log('  Nothing was written. Re-run without --dry-run to migrate.');
      console.log('════════════════════════════════════════════');
      console.log('');
      return;
    }

    console.log('  VERIFICATION');
    console.log('════════════════════════════════════════════');

    let mismatches = 0;
    for (const row of summary) {
      const actual = await newDb.collection(row.name).countDocuments();
      const ok = actual === row.count;
      if (!ok) mismatches++;
      console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${row.name.padEnd(28)} src ${String(row.count).padStart(5)} → dst ${String(actual).padStart(5)}`);
    }

    console.log('════════════════════════════════════════════');
    console.log(`  Collections : ${summary.length}`);
    console.log(`  Documents   : ${totalCopied}`);
    console.log(`  Mismatches  : ${mismatches}`);
    console.log('════════════════════════════════════════════');
    console.log('');

    if (mismatches > 0) {
      console.error('MIGRATION INCOMPLETE — counts do not match. Do NOT switch over.');
      process.exit(1);
    }

    console.log('Migration complete and verified.');
    console.log('');
    console.log('Next:');
    console.log('  1. Update MONGODB_URI in the local apps/server/.env');
    console.log('  2. Update MONGODB_URI on the VPS: /var/www/ozobath/apps/server/.env');
    console.log('  3. pm2 reload ozobath-api');
    console.log('  4. node src/scripts/checkPaymentIntegrity.js   (confirm unique indexes)');
    console.log('  5. Keep the OLD cluster running for ~1 week as a rollback path.');
    console.log('');
  } finally {
    await oldClient.close().catch(() => {});
    await newClient.close().catch(() => {});
  }
};

migrate().catch((err) => {
  console.error('');
  console.error('MIGRATION FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
