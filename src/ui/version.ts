/**
 * Garde-fou contre le cache de GitHub Pages.
 *
 * Le HTML est servi avec `max-age=600` et un mobile le garde souvent bien plus
 * longtemps : Keko peut tester une version périmée en croyant voir la
 * dernière. On relit la date du build à la source, hors cache, et si elle ne
 * correspond pas à celle embarquée dans ce bundle, on recharge une seule fois
 * avec une URL neuve.
 */
const MARQUE = 'keko-rechargement'

export async function verifierVersion(embarquee: string): Promise<void> {
  try {
    const reponse = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!reponse.ok) return

    const { build } = (await reponse.json()) as { build?: string }
    if (typeof build !== 'string' || build === embarquee) {
      sessionStorage.removeItem(MARQUE)
      return
    }

    // Un seul rechargement par session : si le cache résiste, on n'en fait pas
    // une boucle. Dans ce cas la date affichée reste la preuve visible.
    if (sessionStorage.getItem(MARQUE) === build) return
    sessionStorage.setItem(MARQUE, build)

    const url = new URL(window.location.href)
    url.searchParams.set('v', build.replace(/\D/g, ''))
    window.location.replace(url.toString())
  } catch {
    // Hors ligne, ou pas de version.json en dev : on ne bloque jamais le jeu.
  }
}
