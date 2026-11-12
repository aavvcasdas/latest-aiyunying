# 把模板字体 ZCOOL KuaiLe 裁成只含画面用到的字（扫描 src/mv 下所有源码里的字符），转成 base64 模块
import glob, base64, subprocess, sys
chars = set(chr(c) for c in range(0x20, 0x7f))
for f in glob.glob('src/mv/**/*.ts', recursive=True):
    if '/assets/' in f: continue
    chars |= set(open(f, encoding='utf-8').read())
chars |= set('《》？！，。、：；“”‘’（）…—·')
chars = {c for c in chars if c.isprintable()}
open('/tmp/qa/chars.txt', 'w', encoding='utf-8').write(''.join(sorted(chars)))
subprocess.check_call([sys.executable, '-m', 'fontTools.subset', '/tmp/an/font.ttf', '--text-file=/tmp/qa/chars.txt', '--output-file=/tmp/qa/bg.ttf', '--layout-features=*', '--no-hinting'])
b = base64.b64encode(open('/tmp/qa/bg.ttf', 'rb').read()).decode()
open('src/mv/assets/font.ts', 'w', encoding='utf-8').write('// ZCOOL KuaiLe（OFL，模板字体）按画面用到的字裁剪后的子集，base64\nexport default "data:font/ttf;base64,' + b + '";\n')
print('chars', len(chars), 'ttf bytes', len(b) * 3 // 4)
