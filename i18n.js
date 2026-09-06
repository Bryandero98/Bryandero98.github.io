window.I18N = {
  es: {
    "a11y.skipLink": "Saltar al contenido",
    "a11y.themeChangedDark": "Tema oscuro activado",
    "a11y.themeChangedLight": "Tema claro activado",
    "a11y.langChanged": "Idioma actualizado a español",
    "a11y.copyLabel": "Copiar comando",
    "a11y.copied": "Comando copiado al portapapeles",

    "nav.sectionsLabel": "Secciones de la página",
    "nav.projects": "Proyectos",
    "nav.contributions": "Contribuciones",
    "nav.inProgress": "En curso",
    "nav.contact": "Contacto",
    "nav.actionsLabel": "Acciones de la página",
    "nav.langToggleLabel": "Cambiar idioma",
    "nav.themeToggleLabel": "Cambiar tema",

    "hero.command": "whoami",
    "hero.title": "Bryan Delgado",
    "hero.tagline":
      "Contribuidor open-source · construyo herramientas pequeñas y locales, y voy resolviendo buenos issues por el camino.",
    "hero.counterLabel": "PRs mergeados en 13 repositorios",

    "profile.heading": "Sobre mí",
    "profile.body":
      "Escribo código open-source desde Colombia. La mayor parte de mi trabajo son correcciones y mejoras concretas dentro de proyectos ya existentes — bugs reales, tests que faltaban, endpoints mal validados — y, en paralelo, un puñado de herramientas propias que publico cuando quedan listas para que alguien más las use.",

    "projects.heading": "Proyectos propios",
    "projects.filterLabel": "Filtrar proyectos por tecnología",
    "projects.filterAll": "Todos",
    "projects.packetforge.desc":
      "Servidor MCP en producción con dashboard multi-proyecto, embeddings de Gemini y rate limiting propio.",
    "projects.packetforge.cta": "Ver en vivo →",
    "projects.captionforge.desc":
      "Generador local de subtítulos con faster-whisper + ffmpeg. Publicado en PyPI, 140/140 tests en verde.",
    "projects.captionforge.cta": "pip install captionforge →",
    "projects.cliguard.desc":
      "Herramienta de línea de comandos publicada en npm, con CI verde en 9/9 combinaciones de plataforma/versión de Node.",
    "projects.cliguard.cta": "npx cliguard →",

    "contributions.heading": "Contribuciones open-source",
    "contributions.intro":
      "49 pull requests mergeados, verificables en vivo en GitHub con un clic en cada contador.",
    "contributions.hedgehog.label": "hedgehog + ecosistema",

    "stack.heading": "Stack técnico",

    "inprogress.heading": "En curso ahora",
    "inprogress.intro":
      "Pull requests abiertos esperando revisión del mantenedor, en el momento de publicar esta página.",

    "contact.heading": "Contacto",
    "contact.body":
      "La forma más directa de encontrar mi trabajo y contactarme es a través de GitHub.",

    "footer.text": "Hecho a mano, sin frameworks, por Bryandero98.",
    "footer.updatedPrefix": "Última actualización:",
    "footer.updatedDate": "septiembre de 2026",
  },

  en: {
    "a11y.skipLink": "Skip to content",
    "a11y.themeChangedDark": "Dark theme enabled",
    "a11y.themeChangedLight": "Light theme enabled",
    "a11y.langChanged": "Language updated to English",
    "a11y.copyLabel": "Copy command",
    "a11y.copied": "Command copied to clipboard",

    "nav.sectionsLabel": "Page sections",
    "nav.projects": "Projects",
    "nav.contributions": "Contributions",
    "nav.inProgress": "In progress",
    "nav.contact": "Contact",
    "nav.actionsLabel": "Page actions",
    "nav.langToggleLabel": "Switch language",
    "nav.themeToggleLabel": "Switch theme",

    "hero.command": "whoami",
    "hero.title": "Bryan Delgado",
    "hero.tagline":
      "Open-source contributor · I build small, local-first tools and pick up good bugs along the way.",
    "hero.counterLabel": "merged PRs across 13 repositories",

    "profile.heading": "About me",
    "profile.body":
      "I write open-source code from Colombia. Most of my work is concrete fixes and improvements inside existing projects — real bugs, missing tests, endpoints with broken validation — alongside a handful of my own tools that I publish once they're ready for someone else to use.",

    "projects.heading": "My own projects",
    "projects.filterLabel": "Filter projects by technology",
    "projects.filterAll": "All",
    "projects.packetforge.desc":
      "MCP server in production with a multi-project dashboard, Gemini embeddings, and its own rate limiting.",
    "projects.packetforge.cta": "View live →",
    "projects.captionforge.desc":
      "Local subtitle generator with faster-whisper + ffmpeg. Published on PyPI, 140/140 tests passing.",
    "projects.captionforge.cta": "pip install captionforge →",
    "projects.cliguard.desc":
      "Command-line tool published on npm, with green CI across 9/9 platform/Node version combinations.",
    "projects.cliguard.cta": "npx cliguard →",

    "contributions.heading": "Open-source contributions",
    "contributions.intro":
      "49 merged pull requests, verifiable live on GitHub with one click on each counter.",
    "contributions.hedgehog.label": "hedgehog + ecosystem",

    "stack.heading": "Tech stack",

    "inprogress.heading": "In progress right now",
    "inprogress.intro":
      "Open pull requests awaiting maintainer review, as of publishing this page.",

    "contact.heading": "Contact",
    "contact.body":
      "The most direct way to find my work and reach me is through GitHub.",

    "footer.text": "Handcrafted, no frameworks, by Bryandero98.",
    "footer.updatedPrefix": "Last updated:",
    "footer.updatedDate": "September 2026",
  },
};

// Aplica el diccionario del idioma dado al DOM. Devuelve false (sin tocar
// nada) si el diccionario no existe, para que quien lo llama pueda degradar
// con seguridad al español ya embebido en el HTML.
window.applyTranslations = function (lang) {
  var dict = window.I18N && window.I18N[lang];
  if (!dict) return false;

  document.documentElement.setAttribute("lang", lang);

  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    if (Object.prototype.hasOwnProperty.call(dict, key)) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
    el
      .getAttribute("data-i18n-attr")
      .split(";")
      .forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0] && parts[0].trim();
        var key = parts[1] && parts[1].trim();
        if (attr && key && Object.prototype.hasOwnProperty.call(dict, key)) {
          el.setAttribute(attr, dict[key]);
        }
      });
  });

  return true;
};
