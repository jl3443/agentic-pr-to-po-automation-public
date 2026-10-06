// capture-frontend extractor — paste into target site's DevTools Console.
// Returns one JSON blob; user copies stdout back to fill evidence.md.
// Same recipe used for earlier design-system captures.

(() => {
  const out = {};

  // 1. CSS custom properties on :root + body
  const grabVars = (el) => {
    const cs = getComputedStyle(el);
    const vars = {};
    for (let i = 0; i < cs.length; i++) {
      const p = cs[i];
      if (p.startsWith('--')) vars[p] = cs.getPropertyValue(p).trim();
    }
    return vars;
  };
  out.cssVars = {
    root: grabVars(document.documentElement),
    body: grabVars(document.body),
  };

  // 2. Typography & color for key roles
  const props = ['font-family','font-size','font-weight','line-height','letter-spacing','text-transform','color','background-color','padding','margin','border-radius','border','box-shadow','transition'];
  const pick = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const o = { selector: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0,2).join('.') : ''), text: (el.innerText||'').trim().slice(0,60) };
    props.forEach(p => o[p] = cs.getPropertyValue(p));
    const r = el.getBoundingClientRect();
    o.box = { w: Math.round(r.width), h: Math.round(r.height) };
    return o;
  };
  const firstVisible = (sel) => [...document.querySelectorAll(sel)].find(el => {
    const r = el.getBoundingClientRect();
    return r.width > 10 && r.height > 10 && getComputedStyle(el).visibility !== 'hidden';
  });

  out.roles = {
    h1: pick(firstVisible('h1')),
    h2: pick(firstVisible('h2')),
    h3: pick(firstVisible('h3')),
    p:  pick(firstVisible('main p, article p')),
    headerLink: pick(firstVisible('header a')),
    primaryCTA: pick(firstVisible('a.btn-primary, button.btn-primary, .cta-primary, [class*="primary"][class*="btn"], [class*="Button"][class*="primary"], header a[class*="cta"]')),
    secondaryCTA: pick(firstVisible('a.btn-secondary, button.btn-secondary, [class*="secondary"][class*="btn"]')),
    body: pick(document.body),
    header: pick(firstVisible('header')),
    footer: pick(firstVisible('footer')),
  };

  // 3. CTA variants (deduped by visual signature)
  const ctaSig = new Map();
  document.querySelectorAll('a, button').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 20) return;
    const cs = getComputedStyle(el);
    if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') return;
    const sig = [cs.backgroundColor, cs.color, cs.borderRadius, cs.padding, cs.fontWeight, cs.textTransform].join('|');
    if (!ctaSig.has(sig)) ctaSig.set(sig, { text:(el.innerText||'').trim().slice(0,40), bg:cs.backgroundColor, fg:cs.color, radius:cs.borderRadius, padding:cs.padding, weight:cs.fontWeight, transform:cs.textTransform, font:cs.fontFamily, size:cs.fontSize, letterSpacing:cs.letterSpacing, border:cs.border });
  });
  out.ctaVariants = [...ctaSig.values()].slice(0, 12);

  // 4. Color histogram
  const bgCount = {}, fgCount = {};
  document.body.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor, fg = cs.color;
    if (bg && bg !== 'rgba(0, 0, 0, 0)') bgCount[bg] = (bgCount[bg]||0)+1;
    if (fg) fgCount[fg] = (fgCount[fg]||0)+1;
  });
  const top = (m,n)=> Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,n);
  out.colorHistogram = { topBg: top(bgCount, 12), topFg: top(fgCount, 8) };

  // 5. Motion contracts
  const transSig = new Map();
  document.body.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    const t = cs.transition;
    if (!t || t === 'all 0s ease 0s' || t === 'none 0s ease 0s') return;
    transSig.set(t, (transSig.get(t)||0)+1);
  });
  out.motion = [...transSig.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);

  // 6. Border-radius histogram
  const radCount = {};
  document.body.querySelectorAll('*').forEach(el => {
    const r = getComputedStyle(el).borderRadius;
    if (r && r !== '0px') radCount[r] = (radCount[r]||0)+1;
  });
  out.radiusHistogram = Object.entries(radCount).sort((a,b)=>b[1]-a[1]).slice(0,10);

  // 7. Shadow histogram
  const shCount = {};
  document.body.querySelectorAll('*').forEach(el => {
    const s = getComputedStyle(el).boxShadow;
    if (s && s !== 'none') shCount[s] = (shCount[s]||0)+1;
  });
  out.shadowHistogram = Object.entries(shCount).sort((a,b)=>b[1]-a[1]).slice(0,8);

  // 8. Font-family histogram
  const fontCount = {};
  document.body.querySelectorAll('*').forEach(el => {
    const f = getComputedStyle(el).fontFamily;
    if (f) fontCount[f] = (fontCount[f]||0)+1;
  });
  out.fontHistogram = Object.entries(fontCount).sort((a,b)=>b[1]-a[1]).slice(0,6);

  // 9. Logo / brand asset hints
  const logos = [...document.querySelectorAll('img[src*="logo"], img[alt*="logo" i], svg[aria-label*="logo" i], a[href="/"] img, header img')].slice(0,5).map(el => ({
    tag: el.tagName, src: el.src || null, alt: el.alt || el.getAttribute('aria-label'), w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height
  }));
  out.logos = logos;

  // 10. Meta
  out.meta = {
    url: location.href,
    title: document.title,
    viewport: { w: innerWidth, h: innerHeight },
    capturedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(out, null, 2));
  return out;
})();
