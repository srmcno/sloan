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

if __name__ == '__main__': unittest.main()
