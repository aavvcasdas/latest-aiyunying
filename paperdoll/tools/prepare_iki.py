"""对人工分层的像素实际测量，给 Iki 无图像依赖的绑定器提供几何与纹理。"""
import base64
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parents[1] / 'assets/cutout'


def main():
    layers, textures = [], {}
    mapping={'face':'face','body':'portrait_body','eye_L':'eye_L','eye_R':'eye_R','mouth':'mouth','mouth_open':'mouth_open'}
    for role,name in mapping.items():
        with Image.open(BASE / (name+'.png')) as src:
            im=src.convert('RGBA')
        alpha=np.asarray(im)[:,:,3]
        yy,xx=np.nonzero(alpha>=8)
        if not len(xx):
            raise ValueError(f'empty layer: {role}')
        x0=max(0,int(xx.min())-1);y0=max(0,int(yy.min())-1)
        x1=min(im.width,int(xx.max())+2);y1=min(im.height,int(yy.max())+2)
        bbox={'x':x0,'y':y0,'w':x1-x0,'h':y1-y0}
        layer={'role':role,'fileName':name+'.png','canvasW':im.width,'canvasH':im.height,'bbox':bbox,'cropW':bbox['w'],'cropH':bbox['h']}
        if role in ('face','body'):
            runs=[]
            for y in range(y0,y1):
                padded=np.pad((alpha[y,x0:x1]>=128).astype('int8'),(1,1))
                edges=np.nonzero(np.diff(padded))[0]+x0
                runs.append(edges.tolist())
            layer['rowRuns']=runs
        layers.append(layer)
        crop=im.crop((x0,y0,x1,y1))
        buf=io.BytesIO();crop.save(buf,format='PNG')
        textures[role]='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()
    closed = {}
    for side in ('L','R'):
        with Image.open(BASE / f'closed_{side}.png') as im:
            bbox=im.getbbox()
            buf=io.BytesIO();im.crop(bbox).save(buf,format='PNG')
        closed[side]={'bbox':list(bbox),'texture':'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()}
    (BASE/'iki-inputs.json').write_text(json.dumps({'canvas':{'width':912,'height':1136},'layers':layers,'textures':textures,'closed':closed}))
    print('IKI_INPUTS_OK')


if __name__=='__main__':
    main()
