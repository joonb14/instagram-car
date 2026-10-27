import unittest
import numpy as np
from PIL import Image, ImageDraw
import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('plate_tool',Path(__file__).with_name('composite-plate.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
composite_plate = module.composite_plate


class PlateTests(unittest.TestCase):
    def test_perspective_plate_preserves_pixels_outside_polygon(self):
        source = Image.new('RGB',(120,90),(10,40,70))
        asset = Image.new('RGBA',(100,25),'white')
        ImageDraw.Draw(asset).rectangle((35,5,65,20),fill='black')
        corners = [(20,25),(105,15),(95,60),(18,55)]
        result = np.array(composite_plate(source,asset,corners))
        mask = Image.new('L',source.size)
        ImageDraw.Draw(mask).polygon(corners,fill=255)
        self.assertTrue(np.array_equal(result[np.array(mask)==0],np.array(source)[np.array(mask)==0]))
        self.assertGreater(np.any(result!=np.array(source),axis=2).sum(),1000)

    def test_transparent_backing_is_rejected(self):
        with self.assertRaises(ValueError):
            composite_plate(Image.new('RGB',(20,20)),Image.new('RGBA',(10,10),(0,0,0,0)),[(1,1),(18,1),(18,18),(1,18)])

    def test_crossed_corners_are_rejected(self):
        with self.assertRaises(ValueError):
            composite_plate(Image.new('RGB',(20,20)),Image.new('RGBA',(10,10),'white'),[(1,1),(18,18),(18,1),(1,18)])


if __name__ == '__main__':
    unittest.main()
