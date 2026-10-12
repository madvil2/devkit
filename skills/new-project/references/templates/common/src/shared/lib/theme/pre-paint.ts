export const THEME_STORAGE_KEY = '{{name}}:theme'

export const PRE_PAINT_SCRIPT = `(function(){var d=document.documentElement;try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');var t=p==='light'||p==='dark'?p:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t}catch(e){d.dataset.theme='light'}})()`
