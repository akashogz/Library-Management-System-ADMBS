const { borrowCopy, getBookDetails } = require('./services');
const { pool } = require('./db');

async function testConcurrency() {
  console.log('Running Concurrency and Race Condition Verification...');
  
  const book = await getBookDetails(1);
  const availableCopy = book.copies.find(c => c.status === 'AVAILABLE');
  
  if (!availableCopy) {
    console.log('No available copy found for book 1, resetting copy 1 to AVAILABLE');
    await pool.query("UPDATE book_copies SET status = 'AVAILABLE' WHERE copy_id = 1");
  }
  
  const targetCopyId = availableCopy ? availableCopy.copy_id : 1;
  console.log(`Targeting Physical Book Copy ID: ${targetCopyId}`);

  const results = await Promise.allSettled([
    borrowCopy({ copyId: targetCopyId, memberId: 1, loanDays: 14 }),
    borrowCopy({ copyId: targetCopyId, memberId: 2, loanDays: 14 })
  ]);

  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  console.log(`Fulfilled requests: ${fulfilled.length}`);
  console.log(`Rejected concurrent requests: ${rejected.length}`);

  if (fulfilled.length === 1 && rejected.length === 1) {
    console.log('CONCURRENCY TEST PASSED: Exactly 1 loan succeeded, double-checkout race condition successfully prevented by row-level locking / partial unique index.');
    console.log('Rejected error message:', rejected[0].reason.message);
  } else {
    console.error('CONCURRENCY TEST FAILED: Unexpected allocation outcome', results);
  }

  const auditCheck = await pool.query(
    "SELECT copy_id, COUNT(*) FROM book_loans WHERE status IN ('ACTIVE', 'OVERDUE') GROUP BY copy_id HAVING COUNT(*) > 1"
  );

  console.log(`Audit query duplicate active loans count: ${auditCheck.rows.length}`);
  if (auditCheck.rows.length === 0) {
    console.log('DATABASE INVARIANT AUDIT PASSED: 0 duplicate active loans exist.');
  }

  await pool.end();
}

testConcurrency().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
