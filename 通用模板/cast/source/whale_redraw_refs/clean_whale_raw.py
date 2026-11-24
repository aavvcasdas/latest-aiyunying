from PIL import Image
from collections import deque
from pathlib import Path
import sys

def clean(src, dst):
    im=Image.open(src).convert('RGB')
    w,h=im.size
    px=im.load()
    seen=bytearray(w*h)
    bg=bytearray(w*h)
    q=deque()
    def is_bg(x,y):
        r,g,b=px[x,y]
        mx=max(r,g,b); mn=min(r,g,b); avg=(r+g+b)/3
        return (mx-mn)<=32 and avg>=170
    for x in range(w):
        for y in (0,h-1):
            if is_bg(x,y) and not seen[y*w+x]:
                seen[y*w+x]=1; bg[y*w+x]=1; q.append((x,y))
    for y in range(h):
        for x in (0,w-1):
            if is_bg(x,y) and not seen[y*w+x]:
                seen[y*w+x]=1; bg[y*w+x]=1; q.append((x,y))
    while q:
        x,y=q.popleft()
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=nx<w and 0<=ny<h:
                i=ny*w+nx
                if not seen[i] and is_bg(nx,ny):
                    seen[i]=1; bg[i]=1; q.append((nx,ny))
    out=Image.new('RGBA',(w,h),(0,0,0,0))
    op=out.load()
    for y in range(h):
        for x in range(w):
            if not bg[y*w+x]:
                r,g,b=px[x,y]
                op[x,y]=(r,g,b,255)
    # trim to opaque bbox + 2px
    bb=out.getchannel('A').getbbox()
    if bb:
        x0,y0,x1,y1=bb
        out=out.crop((max(0,x0-2),max(0,y0-2),min(w,x1+2),min(h,y1+2)))
    out.save(dst)
    print('cleaned',src,'->',dst,out.size,'opaque',sum(1 for a in (out.getchannel('A').get_flattened_data() if hasattr(out.getchannel('A'),'get_flattened_data') else out.getchannel('A').getdata()) if a))

if __name__=='__main__':
    clean(sys.argv[1],sys.argv[2])
