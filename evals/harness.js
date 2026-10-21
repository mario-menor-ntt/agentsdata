const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const context = vm.createContext({ Intl, console });
const footer = script.indexOf("    document.querySelector('#reload')");
assert.ok(footer >= 0, 'Dashboard initialization boundary must exist');
vm.runInContext(script.slice(0, footer), context);
const calculate = vm.runInContext('calculateDashboard', context);
const make = overrides => ({ year: 2025, month: 1, channel: 'Online', userType: 'Invitado',
  promotion: 'Sin promocion', category: 'Cocina', status: 'Completada', units: 1, revenue: 100, ...overrides });
const rows = [make({ year: 2024, month: 12, revenue: 50 }), make({}),
  make({ month: 2, revenue: 300, userType: 'Registrado', units: 3 }),
  make({ month: 2, status: 'Devuelta', revenue: 40, units: 2 }),
  make({ month: 2, status: 'Cancelada', revenue: 999 })];
let passed = 0;
function test(name, check) { check(); passed += 1; console.log(`PASS ${name}`); }

test('full selection revenue, units and returns', () => {
  const result = calculate(rows, { years: [2025] });
  assert.equal(result.revenue, 400);
  assert.equal(result.units, 4);
  assert.equal(result.returnRevenue, 40);
  assert.equal(result.returnUnits, 2);
  assert.equal(result.registeredPct, 75);
});
test('combined filters', () => {
  assert.equal(calculate(rows, { years: [2025], months: [2], channel: 'Online', userType: 'Registrado', promotion: 'Sin promocion' }).revenue, 300);
});
test('empty selection and zero denominator', () => {
  const result = calculate(rows, { channel: 'Missing' });
  assert.equal(result.revenue, 0);
  assert.equal(result.registeredPct, null);
  assert.equal(result.comparison.currentPeriod, null);
});
test('chart totals reconcile', () => {
  const result = calculate(rows);
  for (const key of ['byChannel', 'byUser', 'byCategory', 'byPromotion']) {
    assert.equal(result[key].reduce((total, item) => total + item.value, 0), result.revenue);
  }
});
test('January comparison crosses year boundary', () => {
  const comparison = calculate(rows, { years: [2025], months: [1] }).comparison;
  assert.equal(comparison.previousRevenue, 50);
  assert.equal(comparison.difference, 50);
  assert.equal(comparison.change, 100);
});
test('previous month keeps non-date filters', () => {
  const comparison = calculate(rows, { months: [2], userType: 'Registrado' }).comparison;
  assert.equal(comparison.previousRevenue, 0);
  assert.equal(comparison.change, null);
});
test('missing previous month is unavailable', () => {
  assert.equal(calculate([make({})]).comparison.previousRevenue, null);
});
test('selected years and excluded months are retained as gaps', () => {
  const result = calculate(rows, { years: [2025, 2026], months: [2] });
  assert.equal(result.trend.length, 2);
  assert.equal(result.trend[0].values[0], null);
  assert.equal(result.trend[0].values[1], 300);
  assert.equal(result.trend[1].values.every(value => value === null), true);
});
test('category ranking is capped at eight', () => {
  assert.equal(calculate(Array.from({ length: 10 }, (_, index) => make({ category: `Category ${index}` }))).byCategory.length, 8);
});
test('embedded snapshot reconciles with Supabase control totals', () => {
  const snapshot = vm.runInContext('SNAPSHOT', context);
  const data = vm.runInContext('DATA', context);
  const result = calculate(snapshot);
  assert.equal(snapshot.length, 163);
  assert.equal(snapshot.reduce((total, row) => total + row.lines, 0), 200);
  assert.equal(Math.round(result.revenue * 100), data.control.salesCents);
  assert.equal(result.units, data.control.salesUnits);
  assert.equal(Math.round(result.returnRevenue * 100), data.control.returnCents);
  assert.equal(result.returnUnits, data.control.returnUnits);
  const registered = snapshot.filter(row => row.status === 'Completada' && row.userType === 'Registrado');
  assert.equal(registered.reduce((total, row) => total + Math.round(row.revenue * 100), 0), data.control.registeredCents);
  assert.equal(snapshot.filter(row => row.status === 'Completada').reduce((total, row) => total + row.lines, 0), 192);
});
test('every source filter combination matches independent source sums', () => {
  const snapshot = vm.runInContext('SNAPSHOT', context);
  for (const year of [2024, 2025, 2026]) {
    for (const month of [1, 6, 12]) {
      for (const channel of ['App', 'Marketplace', 'Online', 'Tienda fisica']) {
        for (const userType of ['Registrado', 'Invitado']) {
          const expected = snapshot.filter(row => row.year === year && row.month === month && row.channel === channel && row.userType === userType && row.status === 'Completada');
          const result = calculate(snapshot, { years: [year], months: [month], channel, userType });
          assert.equal(Math.round(result.revenue * 100), expected.reduce((total, row) => total + Math.round(row.revenue * 100), 0));
          for (const key of ['byChannel', 'byUser', 'byCategory', 'byPromotion']) {
            assert.equal(Math.round(result[key].reduce((total, item) => total + item.value, 0) * 100), Math.round(result.revenue * 100));
          }
        }
      }
    }
  }
});
test('accepted delayed record is retained in its original year and campaign', () => {
  const snapshot = vm.runInContext('SNAPSHOT', context);
  const delayed = calculate(snapshot, { years: [2026], months: [1], promotion: 'Rebajas enero 2025' });
  assert.equal(delayed.revenue, 852.31);
  assert.equal(delayed.units, 1);
  assert.equal(delayed.filtered.reduce((total, row) => total + row.lines, 0), 1);
  assert.equal(delayed.byPromotion[0].label, 'Rebajas enero 2025');
  assert.equal(delayed.byPromotion[0].value, 852.31);
  assert.equal(delayed.trend[0].year, 2026);
  assert.equal(delayed.trend[0].values[0], 852.31);
  assert.equal(delayed.comparison.previousRevenue, 0);
  const campaign = calculate(snapshot, { promotion: 'Rebajas enero 2025' });
  assert.equal(campaign.revenue, 1143.02);
  assert.equal(campaign.filtered.reduce((total, row) => total + row.lines, 0), 2);
});
test('each campaign filter reconciles every revenue chart', () => {
  const snapshot = vm.runInContext('SNAPSHOT', context);
  for (const promotion of vm.runInContext('DATA.promotions', context)) {
    const result = calculate(snapshot, { promotion });
    const expected = snapshot.filter(row => row.promotion === promotion && row.status === 'Completada');
    assert.equal(Math.round(result.revenue * 100), expected.reduce((total, row) => total + Math.round(row.revenue * 100), 0));
    for (const key of ['byChannel', 'byUser', 'byCategory', 'byPromotion']) {
      assert.equal(Math.round(result[key].reduce((total, item) => total + item.value, 0) * 100), Math.round(result.revenue * 100));
    }
  }
});
test('promotion chart separates unpromoted revenue and scales only campaigns', () => {
  const root = { innerHTML: '' };
  context.document = { getElementById: () => root };
  const render = vm.runInContext('renderPromotions', context);
  render([{ label: 'Sin promocion', value: 10000 }, { label: 'Campaign A', value: 100 }, { label: 'Campaign B', value: 50 }]);
  assert.equal((root.innerHTML.match(/class="vertical-item"/g) || []).length, 2);
  assert.match(root.innerHTML, /class="no-promotion"/);
  assert.match(root.innerHTML, /10\.000,00/);
  assert.match(root.innerHTML, /--height:100%/);
  assert.match(root.innerHTML, /--height:50%/);
  assert.doesNotMatch(root.innerHTML, /vertical-label">Sin promocion/);
  render([{ label: 'Sin promocion', value: 10000 }]);
  assert.doesNotMatch(root.innerHTML, /class="vertical-item"/);
  assert.match(root.innerHTML, /10\.000,00/);
  assert.match(root.innerHTML, /Sin ventas completadas con promociones/);
  render([]);
  assert.match(root.innerHTML, /0,00/);
});
test('promotion interaction is enabled with accepted exception documented', () => {
  assert.doesNotMatch(html, /id="promotionFilter" disabled/);
  assert.match(html, /id="qualityStatus">PASS con (?:excepción de negocio aceptada|observación temporal)/);
  assert.match(html, /23\/01\/2026/);
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=/i);
  assert.equal((html.match(/class="kpi"/g) || []).length, 5);
});
console.log(`${passed}/${passed} checks passed`);