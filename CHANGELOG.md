# Changelog

Todos los cambios notables de este portafolio se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [1.0.0] - 2026-09-05

### Agregado

- Estructura inicial: Hero, Sobre mí, Proyectos propios, Contribuciones
  open-source, Stack técnico, En curso ahora, Contacto.
- Selector de idioma ES/EN con detección automática por `navigator.language`
  y persistencia en `localStorage`.
- Tema oscuro/claro basado en `prefers-color-scheme`, con toggle manual
  persistente y sin parpadeo (`data-theme` aplicado antes del primer
  pintado).
- Avatar real de GitHub y badges en vivo de PyPI/npm en las tarjetas de
  CaptionForge y cliguard.
- Scrollspy en el menú de navegación, botones de copiar en los comandos de
  instalación, contador animado de PRs mergeados (respeta
  `prefers-reduced-motion`).
- Accesibilidad: skip-link funcional (mueve el foco de verdad), región
  `aria-live`, estados `:focus-visible`, contraste WCAG AA verificado en
  ambos temas, navegación completa por teclado.
- SEO: Open Graph, Twitter Card, JSON-LD (`schema.org/Person`),
  `sitemap.xml`, `robots.txt`, imagen social propia (1200×630).
- Página 404 a medida, `LICENSE` (MIT), workflow de chequeo de enlaces
  semanal, workflow de Lighthouse con badge auto-actualizado en el README.
