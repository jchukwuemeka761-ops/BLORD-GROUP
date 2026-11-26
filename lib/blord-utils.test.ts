import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BLORD_CONTENT } from './blord-default-data';
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsSearchUrl,
  enforceStaffWriteScope,
  filterBoardMembers,
  filterBranches,
  formatNaira,
  formatPhoneHref,
  getStaffAllowedSections,
  isSafeHttpOrRelativeUrl,
  slugifyProductName,
  validateContentUpdate,
  validateInquiryInput,
  validateNewsletterEmail,
} from './blord-utils';

test('default dataset preserves all 16 board members, 5 group photos, 3 awards, 6 products, 6 cars, 7 power tanks, and 10 branches', () => {
  assert.equal(DEFAULT_BLORD_CONTENT.about.boardMembers.length, 16);
  assert.equal(DEFAULT_BLORD_CONTENT.about.groupPhotos.length, 5);
  assert.equal(DEFAULT_BLORD_CONTENT.about.awards.length, 3);
  assert.equal(DEFAULT_BLORD_CONTENT.products.length, 6);
  assert.equal(DEFAULT_BLORD_CONTENT.cars.length, 6);
  assert.equal(DEFAULT_BLORD_CONTENT.powerTanks.length, 7);
  assert.equal(DEFAULT_BLORD_CONTENT.contact.branches.length, 10);
  assert.equal(DEFAULT_BLORD_CONTENT.chinaSteps.length, 5);
  assert.equal(DEFAULT_BLORD_CONTENT.coreFeatures.length, 6);
});

test('Google Maps URL builders create clickable driving directions and search URLs for every branch', () => {
  for (const branch of DEFAULT_BLORD_CONTENT.contact.branches) {
    const dirUrl = buildGoogleMapsDirectionsUrl(branch);
    const searchUrl = buildGoogleMapsSearchUrl(branch);
    const embedUrl = buildGoogleMapsEmbedUrl(branch);

    assert.ok(dirUrl.startsWith('https://www.google.com/maps/dir/?'));
    assert.ok(dirUrl.includes('travelmode=driving'));
    assert.ok(searchUrl.startsWith('https://www.google.com/maps/search/?'));
    assert.ok(embedUrl.startsWith('https://maps.google.com/maps?'));
    assert.ok(embedUrl.includes('output=embed'));
  }
});

test('branch and staff filters match city, landmark, name, and role accurately', () => {
  const china = filterBranches(DEFAULT_BLORD_CONTENT.contact.branches, 'GuoTai');
  assert.equal(china.length, 1);
  assert.equal(china[0].id, 'china');

  const lekki = filterBranches(DEFAULT_BLORD_CONTENT.contact.branches, 'Lekki');
  assert.equal(lekki.length, 1);
  assert.equal(lekki[0].id, 'lagos');

  const cto = filterBoardMembers(DEFAULT_BLORD_CONTENT.about.boardMembers, 'Chief Technology Officer');
  assert.equal(cto.length, 1);
  assert.equal(cto[0].name, 'Abasifreke Essien');
});

test('phone formatting, Naira formatting, and safe URL checks block unsafe schemes', () => {
  assert.equal(formatPhoneHref('+234 802 500 0083'), 'tel:+2348025000083');
  assert.equal(formatNaira(6420000), '₦6,420,000');
  assert.equal(slugifyProductName('Blunt Smart Inverter Pro 2026!'), 'blunt-smart-inverter-pro-2026');
  assert.equal(isSafeHttpOrRelativeUrl('/assets/team/ceo-office.jpg'), true);
  assert.equal(isSafeHttpOrRelativeUrl('https://billpoint.co'), true);
  assert.equal(isSafeHttpOrRelativeUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpOrRelativeUrl('//evil.com'), false);
});

test('form and CMS payload validation rejects malformed inputs and negative prices', () => {
  assert.equal(
    validateInquiryInput({
      name: 'Ada Obi',
      email: 'ada@example.com',
      subject: 'Partnership',
      message: 'We would like to discuss enterprise payments.',
    }).valid,
    true
  );
  assert.equal(
    validateInquiryInput({
      name: 'A',
      email: 'invalid',
      subject: 'Hi',
      message: 'short',
    }).valid,
    false
  );
  assert.equal(validateNewsletterEmail('client@blordgroup.ng').valid, true);
  assert.equal(validateNewsletterEmail('not-an-email').valid, false);
  assert.equal(validateContentUpdate(DEFAULT_BLORD_CONTENT).valid, true);
  assert.equal(validateContentUpdate({ brandName: '' }).valid, false);
  assert.equal(
    validateContentUpdate({
      ...DEFAULT_BLORD_CONTENT,
      cars: [{ ...DEFAULT_BLORD_CONTENT.cars[0], priceNgn: -500 }],
    }).valid,
    false
  );
  assert.equal(
    validateContentUpdate({
      ...DEFAULT_BLORD_CONTENT,
      powerTanks: [{ ...DEFAULT_BLORD_CONTENT.powerTanks[0], priceNgn: -100 }],
    }).valid,
    false
  );
});

test('enforceStaffWriteScope blocks price/photo edits for staff while allowing Executive Admin full catalog control', () => {
  const modifiedCarPrice = structuredClone(DEFAULT_BLORD_CONTENT);
  modifiedCarPrice.cars[0].priceNgn = 19999999;

  // Staff cannot alter car prices
  const staffAttempt = enforceStaffWriteScope(
    'staff',
    'inventory',
    DEFAULT_BLORD_CONTENT,
    modifiedCarPrice
  );
  assert.equal(staffAttempt.ok, false);

  // Staff CAN update non-price stock status when in inventory role
  const stockUpdate = structuredClone(DEFAULT_BLORD_CONTENT);
  stockUpdate.cars[0].status = 'Low Stock';
  const staffStockOk = enforceStaffWriteScope(
    'staff',
    'inventory',
    DEFAULT_BLORD_CONTENT,
    stockUpdate
  );
  assert.equal(staffStockOk.ok, true);

  // Executive Admin CAN modify prices, upload photos, and add new products
  modifiedCarPrice.products.push({
    ...DEFAULT_BLORD_CONTENT.products[0],
    slug: 'blord-smart-meter',
    name: 'Blord Smart Meter',
    priceLabel: '₦450,000',
  });
  const execAttempt = enforceStaffWriteScope(
    'executive',
    undefined,
    DEFAULT_BLORD_CONTENT,
    modifiedCarPrice
  );
  assert.equal(execAttempt.ok, true);
  assert.deepEqual(getStaffAllowedSections('branches'), ['branches', 'inbox', 'directory']);
  assert.deepEqual(getStaffAllowedSections('sales'), ['inbox', 'cars', 'tanks', 'products', 'branches', 'directory']);
  assert.deepEqual(getStaffAllowedSections('marketing'), ['home', 'products', 'team', 'inbox', 'directory']);
  assert.deepEqual(getStaffAllowedSections('ict-tech'), ['branches', 'products', 'cars', 'tanks', 'directory']);
  assert.deepEqual(getStaffAllowedSections('maintenance'), ['tanks', 'cars', 'branches', 'directory']);
});

test('sales and maintenance roles can update branch details and stock copy while price/photo edits remain blocked', () => {
  const validCopyEdit = structuredClone(DEFAULT_BLORD_CONTENT);
  validCopyEdit.cars[0].status = 'Pre-Order';
  validCopyEdit.contact.branches[0].landmarkHint = 'Updated Awka Landmark';

  assert.equal(
    enforceStaffWriteScope('staff', 'sales', DEFAULT_BLORD_CONTENT, validCopyEdit).ok,
    true
  );
  assert.equal(
    enforceStaffWriteScope('staff', 'maintenance', DEFAULT_BLORD_CONTENT, validCopyEdit).ok,
    true
  );

  const blockedPriceEdit = structuredClone(DEFAULT_BLORD_CONTENT);
  blockedPriceEdit.powerTanks[0].priceNgn = 1;
  assert.equal(
    enforceStaffWriteScope('staff', 'ict-tech', DEFAULT_BLORD_CONTENT, blockedPriceEdit).ok,
    false
  );

  const blockedPhotoEdit = structuredClone(DEFAULT_BLORD_CONTENT);
  blockedPhotoEdit.cars[0].image = '/api/media/hijack.png';
  assert.equal(
    enforceStaffWriteScope('staff', 'marketing', DEFAULT_BLORD_CONTENT, blockedPhotoEdit).ok,
    false
  );
});
