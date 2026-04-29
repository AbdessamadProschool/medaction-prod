fetch('https://bo.provincemediouna.ma/ar/actualites').then(r=>r.text()).then(t => { const m = t.match(/<img[^>]*>/g); console.log(m ? m.slice(0,10).join('\n') : 'no match'); })
