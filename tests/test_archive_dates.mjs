import test from 'node:test';
import assert from 'node:assert/strict';
import {dateSummary, personYears} from '../archive-dates.js';

test('approximate birth ranges retain both endpoints and their qualifier', () => {
  assert.equal(personYears({b:'about 1854–1860'}), 'Born about 1854–1860');
  assert.equal(personYears({b:'about 1854–1860',d:'2 Feb 1930'}), 'Born about 1854–1860; died 1930');
  assert.equal(personYears({b:'1830–1832',d:'before 1900'}), 'Born 1830–1832; died before 1900');
});
test('circa, before, after and uncertain dates retain their meaning', () => {
  for (const birth of ['c.1859','Ca. 1788','Abt. 1790','Bef. 1899','Aft. 1885','before 21 Apr 1692','after 1859','1859?','Mar 1882 or 1883']) {
    assert.equal(personYears({b:birth}), `Born ${birth}`);
  }
});
test('dual years stay visible without a calendar conversion', () => {
  assert.equal(personYears({b:'24 Feb 1666/7',d:'1696'}), 'Born 24 Feb 1666/7; died 1696');
  assert.equal(personYears({b:'1666/7'}), 'Born 1666/7');
});
test('ordinary exact dates still use compact year-only display', () => {
  for (const birth of ['1859','14  Feb 1859','March 29, 1859','April, 1859','1859-04-13','Dec 1859']) assert.equal(dateSummary(birth), '1859');
  assert.equal(personYears({b:'14 Feb 1859',d:'13 November 1927'}),'1859–1927');
  assert.equal(personYears({d:'1927'}),'Died 1927');
});
test('missing dates and living people do not acquire dates', () => {
  for (const b of [undefined,null,'','unknown','?']) assert.equal(personYears({b}), 'Dates not recorded');
  assert.equal(personYears({lv:true,b:'14 Feb 1859',d:'1927'}), 'Living');
  assert.equal(personYears({label:'Our generation',lv:true}), 'Our generation');
  assert.equal(personYears({label:'Dates disputed',b:'1859'}), 'Dates disputed');
});
test('date markup is rejected and data remains unchanged', () => {
  assert.equal(personYears({b:'<img src=x onerror=alert(1859)>'}), 'Dates not recorded');
  assert.equal(dateSummary('before <script>1859</script>'), '');
  const person = Object.freeze({b:'about 1854–1860',d:'1930'});
  personYears(person);
  assert.equal(person.b,'about 1854–1860');
});
