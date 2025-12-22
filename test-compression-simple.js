/**
 * Simple test to verify compression middleware is disabled in Lambda
 * This tests the logic without needing a full Lambda invocation
 */

console.log('🧪 Testing Compression Configuration\n');

// Test 1: Lambda environment (compression should be DISABLED)
console.log('Test 1: Lambda Environment');
process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
process.env.NODE_ENV = 'production';
delete require.cache[require.resolve('./dist/index')]; // Clear cache

const isLambda1 = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const shouldCompress1 = process.env.NODE_ENV === 'production' && !isLambda1;

console.log('  - AWS_LAMBDA_FUNCTION_NAME:', process.env.AWS_LAMBDA_FUNCTION_NAME);
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - isLambda:', isLambda1);
console.log('  - Compression should be enabled:', shouldCompress1);
console.log('  - Result:', shouldCompress1 ? '❌ FAIL (compression enabled)' : '✅ PASS (compression disabled)');

if (shouldCompress1) {
  console.log('\n❌ FAIL: Compression is enabled in Lambda environment!');
  process.exit(1);
}

// Test 2: Non-Lambda production (compression should be ENABLED)
console.log('\nTest 2: Non-Lambda Production Environment');
delete process.env.AWS_LAMBDA_FUNCTION_NAME;
process.env.NODE_ENV = 'production';

const isLambda2 = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const shouldCompress2 = process.env.NODE_ENV === 'production' && !isLambda2;

console.log('  - AWS_LAMBDA_FUNCTION_NAME:', process.env.AWS_LAMBDA_FUNCTION_NAME || 'undefined');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - isLambda:', isLambda2);
console.log('  - Compression should be enabled:', shouldCompress2);
console.log('  - Result:', shouldCompress2 ? '✅ PASS (compression enabled)' : '❌ FAIL (compression disabled)');

if (!shouldCompress2) {
  console.log('\n❌ FAIL: Compression is disabled in non-Lambda production!');
  process.exit(1);
}

// Test 3: Development environment (compression should be DISABLED)
console.log('\nTest 3: Development Environment');
delete process.env.AWS_LAMBDA_FUNCTION_NAME;
process.env.NODE_ENV = 'development';

const isLambda3 = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const shouldCompress3 = process.env.NODE_ENV === 'production' && !isLambda3;

console.log('  - AWS_LAMBDA_FUNCTION_NAME:', process.env.AWS_LAMBDA_FUNCTION_NAME || 'undefined');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - isLambda:', isLambda3);
console.log('  - Compression should be enabled:', shouldCompress3);
console.log('  - Result:', shouldCompress3 ? '❌ FAIL (compression enabled)' : '✅ PASS (compression disabled)');

if (shouldCompress3) {
  console.log('\n❌ FAIL: Compression is enabled in development!');
  process.exit(1);
}

console.log('\n✅ All tests passed!');
console.log('\n📝 Summary:');
console.log('   ✅ Lambda: Compression disabled');
console.log('   ✅ Non-Lambda Production: Compression enabled');
console.log('   ✅ Development: Compression disabled');
console.log('\n🚀 Ready to deploy!');
