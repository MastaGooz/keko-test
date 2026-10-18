/**
 * LE RENDU SVG D'UN DESSIN ENGENDRÉ — la seule sortie du pur vers le DOM.
 *
 * `renderIcon(famille, id, taille)` rend un élément `<svg>` prêt à poser à la
 * place d'un emoji ; `svgTexte` rend la même chose en chaîne (pour un
 * `data:` ou un fichier). Les découpes portent un identifiant UNIQUE par
 * rendu : trente icônes sur une page partagent le même document, et deux
 * `<clipPath id="disque">` s'écraseraient.
 */
import { genererDessin, type Dessin, type Famille, type Race } from '../../logic/procgen/index.ts'

const NS = 'http://www.w3.org/2000/svg'
let compteur = 0

function idDeClip(prefixe: string, clip: string): string {
  return `${prefixe}-${clip}`
}

export function renderIcon(famille: Famille, id: string, taille: number, race: Race = 'humain'): SVGSVGElement {
  const dessin = genererDessin(famille, id, race)
  const prefixe = `pg${(compteur++).toString(36)}`
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${dessin.boite} ${dessin.boite}`)
  svg.setAttribute('width', String(taille))
  svg.setAttribute('height', String(taille))
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', `${famille} ${id}`)
  svg.dataset.famille = famille
  if (dessin.race) svg.dataset.race = dessin.race
  svg.dataset.id = id
  svg.dataset.seed = String(dessin.seed)

  if (dessin.clips.length) {
    const defs = document.createElementNS(NS, 'defs')
    for (const clip of dessin.clips) {
      const cp = document.createElementNS(NS, 'clipPath')
      cp.setAttribute('id', idDeClip(prefixe, clip.id))
      for (const d of clip.chemins) {
        const p = document.createElementNS(NS, 'path')
        p.setAttribute('d', d)
        cp.appendChild(p)
      }
      defs.appendChild(cp)
    }
    svg.appendChild(defs)
  }

  for (const f of dessin.formes) {
    const p = document.createElementNS(NS, 'path')
    p.setAttribute('d', f.d)
    p.setAttribute('fill', f.fill)
    if (f.regle) p.setAttribute('fill-rule', f.regle)
    if (f.stroke) {
      p.setAttribute('stroke', f.stroke)
      p.setAttribute('stroke-width', String(f.epaisseur ?? 2))
      p.setAttribute('stroke-linejoin', 'round')
      p.setAttribute('stroke-linecap', 'round')
    }
    if (f.opacite !== undefined) p.setAttribute('opacity', String(f.opacite))
    if (f.clip) p.setAttribute('clip-path', `url(#${idDeClip(prefixe, f.clip)})`)
    svg.appendChild(p)
  }
  return svg
}

/** Le même dessin en texte SVG autonome. */
export function svgTexte(dessin: Dessin, taille: number, prefixe = 'pg'): string {
  const a = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  const out: string[] = [
    `<svg xmlns="${NS}" viewBox="0 0 ${dessin.boite} ${dessin.boite}" width="${taille}" height="${taille}">`,
  ]
  if (dessin.clips.length) {
    out.push('<defs>')
    for (const clip of dessin.clips) {
      out.push(`<clipPath id="${idDeClip(prefixe, clip.id)}">`)
      for (const d of clip.chemins) out.push(`<path d="${a(d)}"/>`)
      out.push('</clipPath>')
    }
    out.push('</defs>')
  }
  for (const f of dessin.formes) {
    const attrs = [`d="${a(f.d)}"`, `fill="${a(f.fill)}"`]
    if (f.regle) attrs.push(`fill-rule="${f.regle}"`)
    if (f.stroke) attrs.push(`stroke="${a(f.stroke)}"`, `stroke-width="${f.epaisseur ?? 2}"`, 'stroke-linejoin="round"', 'stroke-linecap="round"')
    if (f.opacite !== undefined) attrs.push(`opacity="${f.opacite}"`)
    if (f.clip) attrs.push(`clip-path="url(#${idDeClip(prefixe, f.clip)})"`)
    out.push(`<path ${attrs.join(' ')}/>`)
  }
  out.push('</svg>')
  return out.join('')
}
