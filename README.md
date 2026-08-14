# Project-Locater

Statische site van HydroTop Works met een homepage en demo-app in Apple-stijl, gebouwd op het design van [sonner](https://github.com/emilkowalski/sonner) (Emil Kowalski, MIT).

## Pagina's

| Bestand | Wat het is |
|---|---|
| `index.html` | Homepage in Apple-stijl: frosted-glass navigatie, grote SF-typografie, pill-knoppen, feature-kaarten en een interactieve toast-stapel. |
| `demo.html` | Demo-app: speeltuin voor alle sonner-toasttypen (succes, info, waarschuwing, fout, promise, actieknop), met iOS-stijl schakelaars en een verantwoordingstabel van het toegepaste Apple-design. |
| `locator.html` | De oorspronkelijke Project Locator (Leaflet-kaart met 20 projecten en filters), nu aangevuld met sonner-meldingen. |

## Sonner-port

| Bestand | Herkomst |
|---|---|
| `sonner.css` | 1-op-1 overgenomen uit `sonner/src/styles.css`. |
| `sonner.js` | Vanilla-JS-port van de React-component (`src/index.tsx`): zelfde DOM-structuur en data-attributen, zodat de originele stylesheet ongewijzigd werkt. Constanten (`VISIBLE_TOASTS=3`, `GAP=14`, `TOAST_WIDTH=356`, `TOAST_LIFETIME=4000`, `SWIPE_THRESHOLD=45`) komen letterlijk uit de repo. |
| `apple.css` | Gedeeld design-systeem voor de pagina's, met de sonner-grijsschaal en -fontstack als tokens, plus Apple.com-patronen (blur-navigatie, pill-knoppen, hairlines). |

## Toegepast uit het Apple-design van sonner

- **Typografie** — systeemfont-stack (SF Pro op Apple-apparaten), 13px toasts, gewichten 500/400.
- **Vorm & diepte** — radius 8px, 1px hairline-randen, schaduw `0 4px 12px rgba(0,0,0,.1)`, breedte 356px.
- **Stapeling** — max. 3 zichtbaar, 5% schaal per laag, 14px gap, uitklappen bij hover (zoals het iOS-Berichtencentrum).
- **Beweging** — 400ms-overgangen, binnenkomst vanaf `translateY(100%)`, swipe-to-dismiss met 45px-drempel of velocity > 0,11 px/ms.
- **Activity-indicator** — 12 vervagende balkjes bij promise-toasts, de evenknie van Apple's `UIActivityIndicatorView`.
- **Kleur** — 12-staps grijsschaal en licht/donker-paletten (incl. rich colors) uit `styles.css`.
- **Toegankelijkheid** — `prefers-reduced-motion` schakelt alle animaties uit; meldingen volgen standaard het systeemthema.

Volledige verantwoording met bronverwijzingen: zie de sectie "Wat is toegepast?" in `demo.html`.
