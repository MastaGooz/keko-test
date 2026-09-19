/**
 * Le plein ecran, pour recuperer la barre du navigateur.
 *
 * Une page web dans un onglet ne peut pas masquer la chrome du navigateur.
 * Il n'y a que deux sorties, et elles sont complementaires :
 *
 * 1. Installer la page sur l'ecran d'accueil (le manifeste, `display:
 *    fullscreen`) : elle s'ouvre alors sans aucune barre. C'est la bonne
 *    reponse, mais elle demande une action de Keko.
 * 2. L'API plein ecran, sur un geste de l'utilisateur. Marche sur Android ;
 *    l'iPhone ne la supporte pas (l'iPad si). D'ou le bouton, qui se cache
 *    tout seul la ou il ne servirait a rien.
 */

/** Vrai si le navigateur sait passer la page en plein ecran. */
export function pleinEcranPossible(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof document.documentElement.requestFullscreen === 'function' &&
    document.fullscreenEnabled === true
  )
}

/** Bascule, et renvoie l'etat vise. Les refus du navigateur sont avales. */
export async function basculerPleinEcran(): Promise<boolean> {
  try {
    if (document.fullscreenElement === null) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      return true
    }
    await document.exitFullscreen()
    return false
  } catch {
    // Un refus (geste non reconnu, reglage systeme) ne doit rien casser.
    return document.fullscreenElement !== null
  }
}
