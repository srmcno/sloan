import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRelationships } from '../relationships.js';

const tree = JSON.parse(readFileSync(new URL('../tree.json', import.meta.url)));
const relation = createRelationships(tree.people, tree.root, 'You');
test('relationships are measured from the child and both branches exist', () => {
  assert.equal(relation.label('PARENT_FATHER'), 'Father');
  assert.equal(relation.label('PARENT_MOTHER'), 'Mother');
  assert.equal(relation.label('MATERNAL_GRANDFATHER'), 'Grandfather');
  assert.equal(relation.label('I352644752743'), 'Grandfather');
  assert.equal(relation.label('I352644820672'), 'Great-grandfather');
  assert.equal(relation.label('A:frank-maxwell-andrews'), '3rd cousin, 3 times removed');
});
