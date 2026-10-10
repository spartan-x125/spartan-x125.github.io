(() => {
  'use strict';
  const topics = ['nebula', 'galaxy', 'star cluster', 'supernova remnant', 'globular cluster', 'gravitational lens', 'pulsar', 'protostar', 'colliding galaxies', 'comet', 'black hole', 'quasar', 'brown dwarf', 'planetary nebula', 'spiral galaxy', 'elliptical galaxy', 'galaxy cluster', 'star forming region', 'white dwarf', 'binary star', 'asteroid', 'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Titan', 'Europa', 'Enceladus', 'Horsehead Nebula', 'Crab Nebula', 'Carina Nebula', 'Tarantula Nebula'];
  const pools = new Map(), seen = new Set();
  let local;
  const choose = values => values[Math.floor(Math.random() * values.length)];
  const nasaURL = value => { try { const url = new URL(value); return url.protocol === 'https:' && /(^|\.)nasa\.gov$/.test(url.hostname) ? url.href : null; } catch { return null; } };
  const plain = html => new DOMParser().parseFromString(html, 'text/html').body.textContent.trim();
  async function search(topic, signal, page = 1) {
    const url = new URL('https://images-api.nasa.gov/search');
    url.search = new URLSearchParams({ q: topic, media_type: 'image', page_size: '100', page: String(page) });
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('NASA library unavailable.');
    return (await response.json()).collection;
  }
  async function remote() {
    const topic = choose(topics);
    let entries = pools.get(topic);
    if (!entries) {
      const signal = AbortSignal.timeout(5500);
      let collection = await search(topic, signal);
      const pages = Math.min(50, Math.ceil((collection.metadata?.total_hits || 0) / 100));
      if (pages > 1) collection = await search(topic, signal, 1 + Math.floor(Math.random() * pages));
      entries = (collection.items || []).filter(item => {
        const data = item.data?.[0], title = data?.title || '';
        return data?.media_type === 'image' && data.description && nasaURL(item.links?.find(link => link.rel === 'preview')?.href)
          && !/artist|illustration|concept|simulation|diagram|engineer|launch|portrait|conference|press briefing|astronaut/i.test(title)
          && !/artist['’]?s (?:concept|impression|illustration)|computer[- ](?:generated|simulation)/i.test(data.description)
          && /nebula|galax|cluster|supernova|pulsar|protostar|comet|black hole|quasar|dwarf|star|asteroid|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|titan|europa|enceladus|ngc |messier|m\d{1,3}\b/i.test(`${title} ${data.description}`);
      });
      if (!entries.length) throw new Error('No astronomical observations found.');
      pools.set(topic, entries);
    }
    const candidates = entries.filter(item => !seen.has(item.data[0].nasa_id));
    const item = choose(candidates.length ? candidates : entries), data = item.data[0];
    const description = plain(data.description);
    const creditMatch = description.match(/(?:image )?credit(?:s)?\s*:\s*([^\n]+)/i);
    const preview = nasaURL(item.links.find(link => link.rel === 'preview').href);
    let image = preview, original = preview;
    try {
      const response = await fetch(`https://images-api.nasa.gov/asset/${encodeURIComponent(data.nasa_id)}`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const manifest = await response.json();
        const images = (manifest.collection?.items || []).map(asset => nasaURL(asset.href)).filter(href => href && /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(href));
        original = images.find(href => /~orig\./.test(href)) || preview;
        image = images.find(href => /~medium\./.test(href)) || images.find(href => /~small\./.test(href)) || preview;
      }
    } catch { /* The search preview remains available if the asset manifest is slow. */ }
    const source = `https://images.nasa.gov/details/${encodeURIComponent(data.nasa_id)}`;
    seen.add(data.nasa_id);
    return {
      id: data.nasa_id, name: data.title, english: 'NASA Image Library', type: topic,
      description: description.split(/\s+/).slice(0, 180).join(' ') + (description.split(/\s+/).length > 180 ? '…' : ''),
      facts: { '主题': topic, '影像归档': data.date_created?.slice(0, 10) || 'NASA', '档案编号': data.nasa_id },
      source, photoSource: source, image, imageSource: original,
      credit: creditMatch?.[1]?.slice(0, 400) || [data.secondary_creator || data.photographer || 'NASA', data.center].filter(Boolean).join(' / '),
    };
  }
  const imageLoads = source => new Promise((resolve, reject) => {
    const image = new Image(), timeout = setTimeout(() => { image.src = ''; reject(new Error('Image timeout.')); }, 4500);
    image.onload = () => { clearTimeout(timeout); resolve(); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Image unavailable.')); };
    image.src = source;
  });
  window.BlogStars = {
    async next() {
      try { const star = await remote(); await imageLoads(star.image); return star; }
      catch {
        local ||= fetch('/stars.json').then(response => { if (!response.ok) throw new Error('Star catalogue unavailable.'); return response.json(); }).catch(error => { local = null; throw error; });
        const catalogue = await local, candidates = catalogue.filter(star => !seen.has(star.id));
        const star = choose(candidates.length ? candidates : catalogue); seen.add(star.id); return star;
      }
    },
  };
})();
