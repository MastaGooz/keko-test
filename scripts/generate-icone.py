# Les icônes de l'app (public/icone-emoji*) depuis public/Symbole.png — Python du banc SDXL (PIL), lancé depuis la racine.
import base64, io, math
from PIL import Image, ImageDraw
src = Image.open('public/Symbole.png').convert('RGBA')
src = src.crop(src.split()[-1].getbbox())
HAUT, BAS = (0x4a, 0x2c, 0x1c), (0x17, 0x0d, 0x07)

def fond(n, coins):
    im = Image.new('RGBA', (n, n))
    px = im.load()
    for y in range(n):
        for x in range(n):
            d = min(1, math.hypot(x - n / 2, y - n * 0.35) / (n * 0.75))
            px[x, y] = tuple(round(HAUT[i] * (1 - d) + BAS[i] * d) for i in range(3)) + (255,)
    if coins:
        m = Image.new('L', (n * 4, n * 4), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, n * 4 - 1, n * 4 - 1), radius=round(n * 4 * 0.22), fill=255)
        im.putalpha(m.resize((n, n), Image.LANCZOS))
    return im

def icone(n, part, coins):
    im = fond(n, coins)
    h = round(n * part)
    w = round(src.width * h / src.height)
    s = src.resize((w, h), Image.LANCZOS)
    im.alpha_composite(s, ((n - w) // 2, (n - h) // 2))
    return im

PART, PART_PLEINE = 0.78, 0.6
icone(512, PART, True).save('public/icone-emoji-512.png')
icone(192, PART, True).save('public/icone-emoji-192.png')
icone(180, PART, False).save('public/icone-emoji-180.png')  # iOS arrondit lui-même
icone(512, PART_PLEINE, False).save('public/icone-emoji-pleine-512.png')

b = io.BytesIO()
s = src.copy(); s.thumbnail((512, 512), Image.LANCZOS); s.save(b, 'WEBP', quality=90)
data = base64.b64encode(b.getvalue()).decode()
def svg(part, coins, note):
    h = 512 * part; w = h * src.width / src.height
    rx = ' rx="112"' if coins else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
  <!-- L'ICÔNE DE L'APPLICATION INSTALLÉE : le symbole de Keko, le poing d'or
       sur l'écu violet (Keko : « le symbole de puissance avec le poing »), sur
       le bois sombre de la taverne. Engendrée depuis public/Symbole.png avec
       les PNG voisins. {note} -->
  <defs>
    <radialGradient id="bois" cx="0.5" cy="0.35" r="0.75">
      <stop offset="0" stop-color="#4a2c1c"/>
      <stop offset="1" stop-color="#170d07"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512"{rx} fill="url(#bois)"/>
  <image x="{(512 - w) / 2:.1f}" y="{(512 - h) / 2:.1f}" width="{w:.1f}" height="{h:.1f}" href="data:image/webp;base64,{data}"/>
</svg>
'''
open('public/icone-emoji.svg', 'w', encoding='utf-8', newline='\n').write(svg(PART, True, 'Coins arrondis.'))
open('public/icone-emoji-pleine.svg', 'w', encoding='utf-8', newline='\n').write(svg(PART_PLEINE, False, 'LA VERSION « MASKABLE » : sans coins, le symbole réduit dans la zone sûre.'))
