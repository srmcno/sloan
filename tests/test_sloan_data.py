"""Check the child-centered archive's relationships, privacy and local media."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
TREE = json.loads((ROOT / 'tree.json').read_text())
CONTENT = json.loads((ROOT / 'content.json').read_text())
PEOPLE = TREE['people']

class SloanArchiveTests(unittest.TestCase):
    def test_child_center_and_paternal_ancestry(self):
        self.assertEqual(TREE['root'], 'ROOT')
        root = PEOPLE[TREE['root']]
        self.assertEqual(root['f'], 'PARENT_FATHER')
        self.assertEqual(root['m'], 'PARENT_MOTHER')
        self.assertTrue(PEOPLE[root['f']]['f'])
        self.assertTrue(PEOPLE[root['f']]['m'])
        self.assertEqual(PEOPLE[root['m']]['f'], 'MATERNAL_GRANDFATHER')
        self.assertEqual(PEOPLE[root['m']]['m'], 'MATERNAL_GRANDMOTHER')
        for pid, person in PEOPLE.items():
            for parent in (person.get('f'), person.get('m')):
                if parent:
                    self.assertIn(parent, PEOPLE, pid)
                    self.assertIn(pid, PEOPLE[parent]['ch'])

    def test_living_people_use_roles_and_hide_private_fields(self):
        for pid, person in PEOPLE.items():
            if person.get('lv'):
                for key in ('b','bp','d','dp','img','note'):
                    self.assertFalse(person.get(key), (pid,key))
                self.assertFalse(person.get('ph'), pid)
                self.assertIn(person['n'], {'Family member','Father','Mother','Paternal grandfather','Paternal grandmother','Maternal grandfather','Maternal grandmother','Living person'})

    def test_media_and_story_links_exist(self):
        ids = {story['id'] for story in CONTENT['stories']}
        self.assertEqual(len(ids), len(CONTENT['stories']))
        for story in CONTENT['stories']:
            for pid in story.get('people',[]): self.assertIn(pid, PEOPLE)
            for image in story.get('imgs',[]): self.assertTrue((ROOT/image['s']).is_file(), image['s'])
        for item in CONTENT['timeline']:
            if item.get('story'): self.assertIn(item['story'], ids)
        for original, variants in CONTENT['restorations'].items():
            for path in (original, variants.get('s'), variants.get('colorized')):
                if path: self.assertTrue((ROOT/path).is_file(), path)

    def test_floyd_livesay_preserves_unresolved_evidence(self):
        """A proposed Illinois household must not silently become proven parentage."""
        floyd = PEOPLE['MAT_FLOYD_LIVESAY']
        self.assertIsNone(floyd.get('f'))
        self.assertIsNone(floyd.get('m'))
        story = next(s for s in CONTENT['stories'] if s['id'] == 'livesay-illinois-to-texas')
        for text in (floyd['note'], ' '.join(story['body'])):
            self.assertIn('1856', text)
            self.assertIn('1857', text)
        self.assertIn('both parents’ names and birthplaces unknown', ' '.join(story['body']))
        original = 'img/docs/floyd_livesay_1932_death_certificate.jpg'
        self.assertTrue(any(i['s'] == original and i['kind'] == 'record' for i in story['imgs']))
        self.assertTrue(any('3:1:33SQ-GB98-SW27' in source for source in story['src']))

    def test_whitfield_full_name_preserves_household_uncertainty(self):
        whitfield = PEOPLE['MAT_OLIVER_C_WHITFIELD']
        self.assertEqual(whitfield['n'], 'Oliver Clinton Whitfield')
        self.assertEqual(whitfield['ev'], 'probable')
        self.assertIsNone(whitfield.get('f'))
        self.assertIsNone(whitfield.get('m'))
        self.assertIn('Clinton O. C.', whitfield['note'])
        self.assertIn('remains probable', whitfield['note'])
        for source in ('may-2007-biskinik.pdf#page=11', 'dec-2011-biskinik.pdf#page=15'):
            self.assertTrue(any(source in url for url in whitfield['source_urls']))

    def test_merry_correspondence_keeps_identity_inference_qualified(self):
        merry = PEOPLE['MAT_LEWIS_MERRY']
        self.assertEqual(merry['n'], 'Lewis Merry')
        self.assertEqual(merry['ev'], 'probable')
        self.assertIsNone(merry.get('f'))
        self.assertIsNone(merry.get('m'))
        story = next(s for s in CONTENT['stories'] if s['id'] == 'ida-merry-enrollment')
        narrative = ' '.join(story['body'])
        for reference in ('Choctaw D 128', '7-D 128', 'J. L.', 'Lewis', 'Louis'):
            self.assertIn(reference, narrative)
        self.assertIn('probable identification', narrative)
        self.assertIn('not proof or a full first-name expansion', merry['note'])
        self.assertIn('not a final enrollment decision', narrative)
        for ark in ('3QS7-L97J-YW17', '3QSQ-G97J-Y4QP'):
            self.assertTrue(any(ark in source for source in story['src']))

    def test_alice_walker_does_not_merge_conflicting_mothers_or_birth_years(self):
        alice = PEOPLE['MAT_ALICE_WALKER']
        self.assertIsNone(alice.get('m'))
        self.assertEqual(alice['ev'], 'probable')
        self.assertEqual(alice['b'], 'about 1859')
        story = next(s for s in CONTENT['stories'] if s['id'] == 'alice-walker-illinois-records')
        narrative = ' '.join(story['body'])
        for year in ('1855', '1859', '1860'):
            self.assertIn(year, narrative)
            self.assertIn(year, alice['note'])
        self.assertIn('67 years, 9 months and 12 days', narrative)
        self.assertIn('Addie Bruce', narrative)
        self.assertIn('no record yet establishes whether they identify the same woman', narrative)
        original = 'img/docs/alice_livesay_1922_death_certificate.jpg'
        self.assertTrue(any(i['s'] == original and i['kind'] == 'record' for i in story['imgs']))
        self.assertTrue(any('3:1:33S7-9B9C-95G1' in source for source in story['src']))

if __name__ == '__main__': unittest.main()
