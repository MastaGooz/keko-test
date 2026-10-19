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
  return renderDessin(genererDessin(famille, id, race), taille)
}

/** Le rendu d'un dessin déjà calculé (une image d'animation, par exemple). */
export function renderDessin(dessin: Dessin, taille: number): SVGSVGElement {
  const { famille, id } = dessin
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
  if (dessin.nom) svg.dataset.nom = dessin.nom

  const degrades = dessin.formes.filter((f) => f.degrade)
  const flous = [...new Set(dessin.formes.map((f) => f.flou).filter((v): v is number => v !== undefined))]
  if (dessin.clips.length || degrades.length || flous.length) {
    const defs = document.createElementNS(NS, 'defs')
    flous.forEach((v, k) => {
      const filtre = document.createElementNS(NS, 'filter')
      filtre.setAttribute('id', `${prefixe}-f${k}`)
      for (const [a, val] of [['x', '-50%'], ['y', '-50%'], ['width', '200%'], ['height', '200%']]) filtre.setAttribute(a, val)
      const flou = document.createElementNS(NS, 'feGaussianBlur')
      flou.setAttribute('stdDeviation', String(v))
      filtre.appendChild(flou)
      defs.appendChild(filtre)
    })
    degrades.forEach((f, k) => {
      const g = f.degrade!
      const el = document.createElementNS(NS, g.type === 'radial' ? 'radialGradient' : 'linearGradient')
      el.setAttribute('id', `${prefixe}-d${k}`)
      el.setAttribute('gradientUnits', 'userSpaceOnUse')
      if (g.type === 'radial') {
        el.setAttribute('cx', String(g.cx))
        el.setAttribute('cy', String(g.cy))
        el.setAttribute('r', String(g.r))
      } else {
        el.setAttribute('x1', String(g.x1))
        el.setAttribute('y1', String(g.y1))
        el.setAttribute('x2', String(g.x2))
        el.setAttribute('y2', String(g.y2))
      }
      for (const [o, c, op] of g.arrets) {
        const stop = document.createElementNS(NS, 'stop')
        stop.setAttribute('offset', String(o))
        stop.setAttribute('stop-color', c)
        if (op !== undefined) stop.setAttribute('stop-opacity', String(op))
        el.appendChild(stop)
      }
      defs.appendChild(el)
    })
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
    p.setAttribute('fill', f.degrade ? `url(#${prefixe}-d${degrades.indexOf(f)})` : f.fill)
    if (f.regle) p.setAttribute('fill-rule', f.regle)
    if (f.stroke) {
      p.setAttribute('stroke', f.stroke)
      p.setAttribute('stroke-width', String(f.epaisseur ?? 2))
      p.setAttribute('stroke-linejoin', 'round')
      p.setAttribute('stroke-linecap', 'round')
    }
    if (f.opacite !== undefined) p.setAttribute('opacity', String(f.opacite))
    if (f.clip) p.setAttribute('clip-path', `url(#${idDeClip(prefixe, f.clip)})`)
    if (f.flou !== undefined) p.setAttribute('filter', `url(#${prefixe}-f${flous.indexOf(f.flou)})`)
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
  const degrades = dessin.formes.filter((f) => f.degrade)
  const flous = [...new Set(dessin.formes.map((f) => f.flou).filter((v): v is number => v !== undefined))]
  if (dessin.clips.length || degrades.length || flous.length) {
    out.push('<defs>')
    flous.forEach((v, k) => out.push(`<filter id="${prefixe}-f${k}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${v}"/></filter>`))
    degrades.forEach((f, k) => {
      const g = f.degrade!
      const arrets = g.arrets.map(([o, c, op]) => `<stop offset="${o}" stop-color="${a(c)}"${op !== undefined ? ` stop-opacity="${op}"` : ''}/>`).join('')
      if (g.type === 'radial') out.push(`<radialGradient id="${idDeClip(prefixe, 'd' + k)}" gradientUnits="userSpaceOnUse" cx="${g.cx}" cy="${g.cy}" r="${g.r}">${arrets}</radialGradient>`)
      else out.push(`<linearGradient id="${idDeClip(prefixe, 'd' + k)}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${arrets}</linearGradient>`)
    })
    for (const clip of dessin.clips) {
      out.push(`<clipPath id="${idDeClip(prefixe, clip.id)}">`)
      for (const d of clip.chemins) out.push(`<path d="${a(d)}"/>`)
      out.push('</clipPath>')
    }
    out.push('</defs>')
  }
  for (const f of dessin.formes) {
    const attrs = [`d="${a(f.d)}"`, `fill="${f.degrade ? `url(#${idDeClip(prefixe, 'd' + degrades.indexOf(f))})` : a(f.fill)}"`]
    if (f.regle) attrs.push(`fill-rule="${f.regle}"`)
    if (f.stroke) attrs.push(`stroke="${a(f.stroke)}"`, `stroke-width="${f.epaisseur ?? 2}"`, 'stroke-linejoin="round"', 'stroke-linecap="round"')
    if (f.opacite !== undefined) attrs.push(`opacity="${f.opacite}"`)
    if (f.clip) attrs.push(`clip-path="url(#${idDeClip(prefixe, f.clip)})"`)
    if (f.flou !== undefined) attrs.push(`filter="url(#${prefixe}-f${flous.indexOf(f.flou)})"`)
    out.push(`<path ${attrs.join(' ')}/>`)
  }
  out.push('</svg>')
  return out.join('')
}
