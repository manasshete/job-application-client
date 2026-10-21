export const THEME_KEY = 'pz-theme'

/** Runs before first paint so the page never flashes the wrong theme. */
export const themeInitScript = `(function(){try{var p=localStorage.getItem('${THEME_KEY}')||'light';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-th',d?'dark':'light')}catch(e){document.documentElement.setAttribute('data-th','light')}})()`
