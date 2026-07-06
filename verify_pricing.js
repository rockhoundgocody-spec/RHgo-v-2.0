import fs from 'fs';

console.log('Verifying Pricing.jsx changes...');

const content = fs.readFileSync('src/pages/Pricing.jsx', 'utf8');

const checks = [
  'import.meta.env.VITE_STRIPE_FIELD_PRO_MONTHLY_PRICE_ID',
  'import.meta.env.VITE_STRIPE_FAMILY_MONTHLY_PRICE_ID',
  'import.meta.env.VITE_STRIPE_SUCCESS_URL',
  'import.meta.env.VITE_STRIPE_CANCEL_URL'
];

let allPassed = true;
checks.forEach(check => {
  if (content.includes(check)) {
    console.log(`PASS: Found ${check}`);
  } else {
    console.log(`FAIL: Could not find ${check}`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('SUCCESS: All checks passed.');
} else {
  console.log('FAILURE: Some checks failed.');
  process.exit(1);
}
