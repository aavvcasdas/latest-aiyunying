from PIL import Image, ImageDraw
from pathlib import Path
out=Path('番外MV/我和你_low3d/源码/public/mv/props'); out.mkdir(parents=True,exist_ok=True)
# All artwork is freshly drawn, crisp-edged pixel-art at native resolution.
def canvas(w=96,h=72): return Image.new('RGBA',(w,h),(0,0,0,0))
def save(name, im): im.save(out/(name+'.png'), optimize=True)
# toy pile: little blocks and a toy train
im=canvas(); d=ImageDraw.Draw(im)
d.rectangle((9,48,40,64),fill='#f2ba43',outline='#70452e',width=2);d.rectangle((14,39,32,49),fill='#e85e5b',outline='#70452e',width=2);d.rectangle((18,31,28,40),fill='#ffe47b',outline='#70452e',width=2)
d.rectangle((48,45,83,58),fill='#67b9cf',outline='#304a5f',width=2);d.rectangle((58,35,75,46),fill='#ff765c',outline='#304a5f',width=2);d.rectangle((64,28,70,36),fill='#ffe27a',outline='#304a5f',width=2)
for x in (55,75): d.ellipse((x,56,x+9,65),fill='#393d54',outline='#f5d37d',width=2)
d.rectangle((4,63,89,67),fill='#806047');save('toys',im)
# rounded CRT television with antenna
im=canvas();d=ImageDraw.Draw(im)
d.line((34,17,23,5),fill='#344a5b',width=3);d.line((49,17,61,5),fill='#344a5b',width=3)
d.rounded_rectangle((9,16,83,59),radius=6,fill='#e6a65d',outline='#603f36',width=3)
d.rounded_rectangle((15,22,61,52),radius=4,fill='#343f57',outline='#51382f',width=2)
d.rectangle((20,27,55,47),fill='#73c6cc');d.rectangle((20,40,55,47),fill='#4a8b84');d.ellipse((66,27,77,38),fill='#f7dc88',outline='#62473d',width=2);d.ellipse((68,43,74,49),fill='#8f5747')
d.rectangle((18,61,28,66),fill='#66483a');d.rectangle((65,61,75,66),fill='#66483a');save('tv',im)
# adventurous backpack, front pocket, straps
im=canvas();d=ImageDraw.Draw(im)
d.rounded_rectangle((22,12,72,64),radius=15,fill='#d95d4c',outline='#543f3e',width=3)
d.rounded_rectangle((29,8,65,26),radius=8,fill='#f1b54b',outline='#543f3e',width=2)
d.rounded_rectangle((28,35,66,57),radius=7,fill='#f1b54b',outline='#543f3e',width=2)
d.rectangle((44,35,49,57),fill='#b64c42');d.rounded_rectangle((39,49,56,55),radius=2,fill='#577d63',outline='#543f3e',width=2)
d.arc((15,21,34,59),270,90,fill='#43586b',width=4);d.arc((60,21,80,59),90,270,fill='#43586b',width=4);save('backpack',im)
# folded paper airplane
im=canvas(96,72);d=ImageDraw.Draw(im)
d.polygon([(9,31),(86,9),(56,63),(44,42)],fill='#f7f1d8',outline='#55768a');d.line((9,31,44,42,86,9),fill='#82a9b4',width=2);d.line((44,42,56,63),fill='#55768a',width=2);d.polygon([(44,42),(86,9),(56,63)],fill='#d9e8df');d.line((44,42,49,50),fill='#a4c3c2',width=2);save('paperplane',im)
# watering can with angled spout and sprinkle holes
im=canvas();d=ImageDraw.Draw(im)
d.rounded_rectangle((25,27,64,61),radius=8,fill='#58a9a1',outline='#38585a',width=3)
d.rectangle((36,21,54,28),fill='#f0c95d',outline='#38585a',width=2)
d.polygon([(61,35),(83,24),(89,29),(68,46)],fill='#e8bd57',outline='#38585a');d.ellipse((84,21,94,31),fill='#e8bd57',outline='#38585a',width=2)
d.arc((17,24,43,56),185,355,fill='#38585a',width=4)
for x,y in [(86,35),(91,40),(82,43),(88,48)]:d.ellipse((x,y,x+2,y+3),fill='#68b9dc')
d.rectangle((29,61,60,65),fill='#486b5f');save('wateringcan',im)
# Pair of running sneakers, drawn entirely for this low3d project.
im=canvas();d=ImageDraw.Draw(im)
d.polygon([(5,48),(16,39),(31,40),(41,48),(52,50),(61,58),(59,65),(12,65),(6,61)],fill='#315482',outline='#27374a')
d.polygon([(34,44),(45,35),(60,36),(70,44),(82,46),(91,55),(88,62),(41,62),(35,58)],fill='#4772a0',outline='#27374a')
d.polygon([(7,58),(59,58),(60,64),(12,65),(6,62)],fill='#eee5d0',outline='#27374a')
d.polygon([(36,55),(88,55),(90,61),(41,62),(35,59)],fill='#eee5d0',outline='#27374a')
for x,y in [(21,44),(27,46),(51,40),(57,42)]:
 d.line((x,y,x+8,y+8),fill='#d8e5f1',width=2);d.line((x+2,y-1,x+10,y+7),fill='#d8e5f1',width=2)
d.rectangle((18,53,35,55),fill='#e5b84c');d.rectangle((49,49,66,51),fill='#e5b84c');save('sneakers',im)
