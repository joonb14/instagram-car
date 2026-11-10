"""Check actual assembly planning edge cases without rendering."""
import unittest
from assemble import partition
from shots import get_shots
class Planning(unittest.TestCase):
    def test_no_lost_or_repeated_cut(self):
        shots=get_shots();groups=partition(shots,20)
        self.assertEqual([s['id'] for g in groups for s in g],[s['id'] for s in shots])
        self.assertTrue(all(sum(s['duration'] for s in g)<=20 for g in groups))
    def test_oversized_cut_is_not_silently_trimmed(self):
        with self.assertRaises(ValueError):partition([{'id':'long','duration':21}],20)
    def test_exact_boundary(self):
        cuts=[{'id':'a','duration':10},{'id':'b','duration':10},{'id':'c','duration':.1}]
        self.assertEqual([[s['id'] for s in g] for g in partition(cuts,20)],[['a','b'],['c']])
    def test_measured_map_and_types(self):
        shots=get_shots();self.assertEqual(len(shots),31);self.assertEqual(len(set(s['id'] for s in shots)),31)
        for s in shots:self.assertLessEqual(abs(s['duration']-(s['source_out']-s['source_in'])),1/120+.00001)
        self.assertEqual({s['id'] for s in shots if s['classification']=='mixed'},{'C01','C09'})
if __name__=='__main__':unittest.main()
