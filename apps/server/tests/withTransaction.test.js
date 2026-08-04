// ============================================
// Regression tests — transaction wrapper (H-07)
// ============================================
// The wrapper must: run writes inside a transaction where supported, degrade
// to sequential execution on a standalone deployment, and — critically —
// never misclassify a real application error as "transactions unsupported",
// which would silently re-run the body non-atomically.

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

// Load a fresh copy of the module with a stubbed mongoose, so the cached
// `transactionsSupported` flag does not leak between tests.
const loadWrapper = (startSessionImpl) => {
  const mongoosePath = require.resolve('mongoose');
  const wrapperPath = require.resolve('../src/utils/withTransaction');

  const originalMongoose = require.cache[mongoosePath];
  delete require.cache[wrapperPath];

  require.cache[mongoosePath] = {
    id: mongoosePath, filename: mongoosePath, loaded: true,
    exports: { startSession: startSessionImpl },
  };

  const mod = require('../src/utils/withTransaction');

  delete require.cache[wrapperPath];
  if (originalMongoose) require.cache[mongoosePath] = originalMongoose;
  else delete require.cache[mongoosePath];

  return mod;
};

// A session that behaves like a replica-set one.
const workingSession = () => async () => ({
  withTransaction: async (fn) => { await fn(); },
  endSession: async () => {},
});

// A session that rejects the way a standalone mongod does.
const standaloneSession = () => async () => ({
  withTransaction: async () => {
    throw new Error('Transaction numbers are only allowed on a replica set member or mongos');
  },
  endSession: async () => {},
});

test('runs the body inside a transaction and passes the session through', async () => {
  const { withTransaction } = loadWrapper(workingSession());
  let received = 'not-called';
  const result = await withTransaction(async (session) => {
    received = session;
    return 'done';
  });
  assert.equal(result, 'done');
  assert.notEqual(received, 'not-called', 'the body must run');
  assert.ok(received && typeof received.withTransaction === 'function', 'a session must be passed');
});

test('degrades to sequential execution on a standalone deployment', async () => {
  const { withTransaction } = loadWrapper(standaloneSession());
  let sessionArg = 'unset';
  const result = await withTransaction(async (session) => {
    sessionArg = session;
    return 'ran-anyway';
  });
  // The body still runs — a standalone deployment is no worse off than before.
  assert.equal(result, 'ran-anyway');
  assert.equal(sessionArg, null, 'the fallback must pass null, not a session');
});

test('caches the unsupported result instead of retrying every call', async () => {
  let startSessionCalls = 0;
  const { withTransaction } = loadWrapper(async () => {
    startSessionCalls++;
    return {
      withTransaction: async () => {
        throw new Error('Transaction numbers are only allowed on a replica set member or mongos');
      },
      endSession: async () => {},
    };
  });

  await withTransaction(async () => 'a');
  await withTransaction(async () => 'b');
  await withTransaction(async () => 'c');

  assert.equal(startSessionCalls, 1, 'should probe once, then stop trying');
});

test('a duplicate-key error propagates and does NOT trigger the fallback', async () => {
  // This is the important one. 11000 means a concurrent request won the race.
  // If the wrapper treated it as "transactions unsupported" it would re-run
  // the body outside a transaction and could double-apply its writes.
  let bodyRuns = 0;
  const { withTransaction } = loadWrapper(async () => ({
    withTransaction: async (fn) => { await fn(); },
    endSession: async () => {},
  }));

  const err = Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });

  await assert.rejects(
    () => withTransaction(async () => { bodyRuns++; throw err; }),
    (e) => e.code === 11000
  );

  assert.equal(bodyRuns, 1, 'the body must run exactly once, never retried');
});

test('an ordinary application error propagates unchanged', async () => {
  let bodyRuns = 0;
  const { withTransaction } = loadWrapper(workingSession());

  await assert.rejects(
    () => withTransaction(async () => {
      bodyRuns++;
      throw new ApiErrorLike('Minimum order amount is ₹500.');
    }),
    /Minimum order amount/
  );

  assert.equal(bodyRuns, 1, 'a business-rule failure must not be retried');
});

class ApiErrorLike extends Error {
  constructor(msg) { super(msg); this.statusCode = 400; }
}

test('IllegalOperation unrelated to transactions is not treated as unsupported', async () => {
  let bodyRuns = 0;
  const { withTransaction } = loadWrapper(async () => ({
    withTransaction: async (fn) => { await fn(); },
    endSession: async () => {},
  }));

  const err = Object.assign(new Error('Cannot run command on this namespace'), {
    codeName: 'IllegalOperation',
  });

  await assert.rejects(() => withTransaction(async () => { bodyRuns++; throw err; }));
  assert.equal(bodyRuns, 1, 'must not fall back and re-run');
});

test('endSession is called even when the body throws', async () => {
  let ended = false;
  const { withTransaction } = loadWrapper(async () => ({
    withTransaction: async (fn) => { await fn(); },
    endSession: async () => { ended = true; },
  }));

  await assert.rejects(() => withTransaction(async () => { throw new Error('boom'); }));
  assert.ok(ended, 'the session must be released');
});
