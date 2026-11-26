import hashlib
import json
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parents[1]
ASSETS = BASE / 'assets/cutout'


class CutoutAssetsTests(unittest.TestCase):
    def test_independent_layers_have_real_alpha(self):
        for name in ['arm_R','arm_L','leg_R','leg_L','eye_R','eye_L','face','body']:
            with self.subTest(name=name), Image.open(ASSETS / (name+'.png')) as im:
                self.assertEqual(im.size,(912,1136))
                self.assertEqual(im.mode,'RGBA')
                alpha=np.asarray(im)[:,:,3]
                self.assertGreater((alpha==0).sum(),alpha.size*.1)
                self.assertGreater((alpha>128).sum(),500)

    def test_no_ghost_hands_or_feet_in_body(self):
        with Image.open(ASSETS/'body.png') as im:
            for x,y in [(215,673),(675,676)]:
                r,g,b,a=im.getpixel((x,y))
                self.assertTrue(a<10 or b>r,'old hand must be removed and background reconstructed')
            self.assertEqual(im.getpixel((387,1050))[3],0)
            self.assertEqual(im.getpixel((510,1050))[3],0)

    def test_joints_stay_inside_original_canvas(self):
        data=json.loads((ASSETS/'rig.json').read_text())
        self.assertEqual(data['canvas'],[912,1136])
        self.assertEqual(set(data['joints']),{'arm_R','arm_L','leg_R','leg_L'})
        for chain in data['joints'].values():
            for x,y in chain.values():
                self.assertTrue(0<=x<912 and 0<=y<1136)

    def test_iki_is_real_textured_parameter_model(self):
        data=json.loads((ASSETS/'whale.iki').read_text())
        self.assertEqual(len(data['parts']),6)
        self.assertFalse({'face','body'} & {p['id'] for p in data['parts']},'Iki must not draw a second whole body over Cutout')
        parameters={p['id'] for p in data['parameters']}
        self.assertTrue({'ParamEyeLOpen','ParamEyeROpen','ParamMouthOpenY'}.issubset(parameters))
        for part in data['parts']:
            self.assertIn('texture',part)
        self.assertTrue(all(t['source'].startswith('data:image/png;base64,') for t in data['textures']))
        self.assertTrue(any(p.get('warps') for p in data['parts']))

    def test_source_image_hash_and_provenance(self):
        data=json.loads((BASE/'assets/cutout-provenance.json').read_text())
        for name,entry in data['sources'].items():
            self.assertEqual(hashlib.sha256((BASE/'assets'/name).read_bytes()).hexdigest(),entry['sha256'])
        for name,expected in data['parts'].items():
            self.assertEqual(hashlib.sha256((ASSETS/name).read_bytes()).hexdigest(),expected)

    def test_no_baked_closed_mouth_and_unchanged_cheek_skin(self):
        with Image.open(ASSETS/'original.png') as im:
            original=np.asarray(im)
        with Image.open(ASSETS/'body.png') as im:
            base=np.asarray(im)
        old=original[424:433,426:442,:3]
        new=base[424:433,426:442,:3]
        self.assertGreater((old.max(2)<180).sum(),0)
        self.assertEqual((new.max(2)<180).sum(),0,'no original closed-mouth line below Iki mouth')
        for x,y in [(416,403),(420,450),(405,441),(455,441)]:
            self.assertTrue(np.array_equal(original[y,x],base[y,x]),'untouched skin must retain original color')

    def test_empty_eye_sockets_match_neutral_skin_not_cheek_blush(self):
        with Image.open(ASSETS/'body.png') as im:
            for x,y in [(360,380),(500,360)]:
                r,g,b,a=im.getpixel((x,y))
                self.assertGreaterEqual(g,232)
                self.assertGreaterEqual(b,225)
                self.assertLess(r-g,24,'eye socket must not inherit red cheek patch')

    def test_rigid_segments_are_real_independent_textures(self):
        for name in ['arm_R','arm_L','leg_R','leg_L']:
            for segment in ['upper','lower']:
                with Image.open(ASSETS/f'{name}_{segment}.png') as im:
                    self.assertGreater((np.asarray(im)[:,:,3]>128).sum(),800)

    def test_full_original_prompt_is_saved(self):
        text=(BASE/'prompts/本鲸重绘_用户原始提示词.md').read_text()
        self.assertIn('头发以深海蓝为主色，从发根的深蓝逐渐过渡到发尾明亮的海蓝与浅青蓝',text)
        self.assertIn('中央是一颗金边镶嵌的椭圆蓝宝石',text)
        self.assertIn('以少量金色装饰勾勒细节。',text)
        prompt=text.split('## 提示词原文\n\n',1)[1].split('\n\n## 本轮制作边界',1)[0]
        self.assertEqual(hashlib.sha256(prompt.encode()).hexdigest(),
                         '1196b014a8c484cb5ee57299c513a3b314ee32ed58c815ffa35992859358014a')


if __name__=='__main__':
    unittest.main()
