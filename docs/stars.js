(() => {
  'use strict';
  const objects = [
    ['Andromeda Galaxy', 'galaxy', ['Andromeda', 'M31', 'M 31', 'NGC 224']],
    ['Triangulum Galaxy', 'galaxy', ['Triangulum', 'M33', 'M 33', 'NGC 598']],
    ['Whirlpool Galaxy', 'galaxy', ['Whirlpool', 'M51', 'M 51', 'NGC 5194']],
    ['Sombrero Galaxy', 'galaxy', ['Sombrero', 'M104', 'M 104', 'NGC 4594']],
    ['Pinwheel Galaxy', 'galaxy', ['Pinwheel', 'M101', 'M 101', 'NGC 5457']],
    ['Antennae Galaxies', 'interacting galaxies', ['Antennae', 'NGC 4038', 'NGC 4039']],
    ['Cartwheel Galaxy', 'galaxy', ['Cartwheel']],
    ['Centaurus A', 'galaxy', ['Centaurus A', 'NGC 5128']],
    ['Large Magellanic Cloud', 'galaxy', ['Large Magellanic Cloud', 'LMC']],
    ['Small Magellanic Cloud', 'galaxy', ['Small Magellanic Cloud', 'SMC']],
    ['NGC 1300', 'galaxy', ['NGC 1300']],
    ['NGC 1512', 'galaxy', ['NGC 1512']],
    ['NGC 2442', 'galaxy', ['NGC 2442']],
    ['NGC 4565', 'galaxy', ['NGC 4565', 'Needle Galaxy']],
    ['Messier 87', 'galaxy', ['Messier 87', 'M87', 'M 87', 'NGC 4486']],
    ['Abell 2744', 'galaxy cluster', ['Abell 2744', "Pandora's Cluster"]],
    ['Abell 1689', 'galaxy cluster', ['Abell 1689']],
    ['Perseus Cluster', 'galaxy cluster', ['Perseus Cluster']],
    ["Stephan's Quintet", 'galaxy group', ["Stephan's Quintet", 'Stephans Quintet', 'HCG 92']],
    ['Hickson Compact Group 40', 'galaxy group', ['Hickson Compact Group 40', 'HCG 40']],
    ['M81 Group', 'galaxy group', ['M81 Group', 'M 81 Group']],
    ['Virgo Cluster', 'galaxy cluster', ['Virgo Cluster']],
    ['Coma Cluster', 'galaxy cluster', ['Coma Cluster', 'Abell 1656']],
    ['Fornax Cluster', 'galaxy cluster', ['Fornax Cluster']],
    ['Centaurus Cluster', 'galaxy cluster', ['Centaurus Cluster', 'Abell 3526']],
    ['Orion Nebula', 'nebula', ['Orion Nebula', 'M42', 'M 42', 'NGC 1976']],
    ['Horsehead Nebula', 'nebula', ['Horsehead', 'Barnard 33']],
    ['Carina Nebula', 'nebula', ['Carina Nebula', 'NGC 3372']],
    ['Tarantula Nebula', 'nebula', ['Tarantula', '30 Doradus', 'NGC 2070']],
    ['Eagle Nebula', 'nebula', ['Eagle Nebula', 'Pillars of Creation', 'M16', 'M 16']],
    ['Lagoon Nebula', 'nebula', ['Lagoon Nebula', 'M8', 'M 8', 'NGC 6523']],
    ['Trifid Nebula', 'nebula', ['Trifid', 'M20', 'M 20', 'NGC 6514']],
    ['Omega Nebula', 'nebula', ['Omega Nebula', 'Swan Nebula', 'M17', 'M 17']],
    ['Rosette Nebula', 'nebula', ['Rosette Nebula']],
    ['Witch Head Nebula', 'nebula', ['Witch Head', 'IC 2118']],
    ['NGC 604', 'nebula', ['NGC 604']],
    ['Crab Nebula', 'supernova remnant', ['Crab Nebula', 'M1', 'M 1', 'NGC 1952']],
    ['Cassiopeia A', 'supernova remnant', ['Cassiopeia A', 'Cas A']],
    ['Veil Nebula', 'supernova remnant', ['Veil Nebula', 'Cygnus Loop']],
    ['Supernova 1987A', 'supernova remnant', ['1987A', '1987 A']],
    ['Helix Nebula', 'planetary nebula', ['Helix Nebula', 'NGC 7293']],
    ['Ring Nebula', 'planetary nebula', ['Ring Nebula', 'M57', 'M 57', 'NGC 6720']],
    ["Cat's Eye Nebula", 'planetary nebula', ["Cat's Eye", 'Cats Eye', 'NGC 6543']],
    ['Butterfly Nebula', 'planetary nebula', ['Butterfly Nebula', 'NGC 6302']],
    ['Southern Ring Nebula', 'planetary nebula', ['Southern Ring', 'NGC 3132']],
    ['Pleiades', 'star cluster', ['Pleiades', 'M45', 'M 45']],
    ['Omega Centauri', 'globular cluster', ['Omega Centauri', 'NGC 5139']],
    ['47 Tucanae', 'globular cluster', ['47 Tucanae', 'NGC 104']],
    ['NGC 602', 'star cluster', ['NGC 602']],
    ['NGC 3603', 'star cluster', ['NGC 3603']],
    ['Westerlund 2', 'star cluster', ['Westerlund 2']],
    ['Eta Carinae', 'star system', ['Eta Carinae', 'Eta Carina']],
    ['Betelgeuse', 'star', ['Betelgeuse']],
    ['Sirius', 'star system', ['Sirius']],
    ['V838 Monocerotis', 'star', ['V838 Monocerotis', 'V838 Mon']],
    ['Cygnus X-1', 'black hole binary', ['Cygnus X-1', 'Cygnus X1']],
    ['3C 273', 'quasar', ['3C 273']],
    ['Sun', 'star', ['Sun', 'Solar Disk', 'Solar Corona']],
    ['Moon', 'natural satellite', ['Moon', 'Lunar Surface']],
    ['Mercury', 'planet', ['Mercury']],
    ['Venus', 'planet', ['Venus']],
    ['Earth', 'planet', ['Earth', 'Blue Marble']],
    ['Mars', 'planet', ['Mars', 'Martian Surface']],
    ['Jupiter', 'planet', ['Jupiter', 'Great Red Spot']],
    ['Saturn', 'planet', ['Saturn']],
    ['Uranus', 'planet', ['Uranus']],
    ['Neptune', 'planet', ['Neptune']],
    ['Pluto', 'dwarf planet', ['Pluto']],
    ['Ceres', 'dwarf planet', ['Ceres']],
    ['Titan', 'natural satellite', ['Titan']],
    ['Europa', 'natural satellite', ['Europa']],
    ['Enceladus', 'natural satellite', ['Enceladus']],
    ['Io', 'natural satellite', ['Io']],
    ['Ganymede', 'natural satellite', ['Ganymede']],
    ['Callisto', 'natural satellite', ['Callisto']],
    ['Triton', 'natural satellite', ['Triton']],
    ['Charon', 'natural satellite', ['Charon']],
    ['Vesta', 'asteroid', ['Vesta']],
    ['Bennu', 'asteroid', ['Bennu']],
    ['Ryugu', 'asteroid', ['Ryugu']],
    ['Comet Halley', 'comet', ['Halley']],
    ['Comet NEOWISE', 'comet', ['Comet NEOWISE', 'C/2020 F3']],
    ['Comet 67P', 'comet', ['67P', 'Churyumov']],
    ['Ursa Major', 'constellation', ['Constellation Ursa Major', 'Ursa Major Constellation']],
    ['Cassiopeia', 'constellation', ['Constellation Cassiopeia', 'Cassiopeia Constellation']],
    ['Cygnus', 'constellation', ['Constellation Cygnus', 'Cygnus Constellation']],
    ['Gemini', 'constellation', ['Constellation Gemini', 'Gemini Constellation']],
    ['Taurus', 'constellation', ['Constellation Taurus', 'Taurus Constellation']],
    ['Scorpius', 'constellation', ['Constellation Scorpius', 'Scorpius Constellation']],
  ].map(([name, type, aliases]) => ({ name, type, aliases }));
  const concepts = [
    {
      id: 'local-group', name: '本星系群', english: 'Local Group', type: 'galaxy group',
      description: '星系群是由引力联系在一起的星系集合。本星系群包含银河系、仙女座星系及它们周围的许多较小星系；我们自身就在这个宇宙邻里之中。图中以成员星系的观测影像展示本星系群，并标注它们相对银河系的位置。',
      facts: { '结构': '星系群', '成员示例': '银河系 · M31 · M33', '影像形式': '成员星系观测影像拼图' },
      source: 'https://science.nasa.gov/universe/galaxies/large-scale-structures/#galaxy-groups',
      photoSource: 'https://imagine.gsfc.nasa.gov/features/cosmic/local_group.html',
      image: 'https://imagine.gsfc.nasa.gov/features/cosmic/images/local_group.jpg', credit: 'NASA / GSFC · Imagine the Universe',
    },
    {
      id: 'virgo-supercluster', name: '室女座超星系团', english: 'Virgo Supercluster', type: 'supercluster',
      description: '室女座超星系团又称本超星系团，以室女座星系团为主要结构，还包含本星系群等附近的星系群。超星系团是比星系群和星系团更大的集合，并不等同于一个整体被引力束缚的星系团。图像用各成员结构的观测影像呈现附近宇宙的层级。',
      facts: { '结构': '超星系团', '主要结构': '室女座星系团', '影像形式': '成员星系群与星系团影像拼图' },
      source: 'https://imagine.gsfc.nasa.gov/features/cosmic/nearest_superclusters_info.html',
      photoSource: 'https://imagine.gsfc.nasa.gov/features/cosmic/local_supercluster.html',
      image: 'https://imagine.gsfc.nasa.gov/features/cosmic/images/local_supercluster.jpg', credit: 'NASA / GSFC · Imagine the Universe',
    },
    {
      id: 'nearby-superclusters', name: '邻近超星系团', english: 'Nearby Superclusters', type: 'large-scale structure',
      description: '把视野从星系扩大到超星系团，会看到星系聚集成链、片和墙，其间存在广阔的空洞。这里展示室女座、后发座、长蛇座、半人马座和英仙—双鱼等邻近超星系团。图片用这些超星系团中主要星系团的影像作为代表，并非完整超星系团的一张直接照片。',
      facts: { '结构': '超星系团集合', '尺度层级': '星系 → 星系群 / 团 → 超星系团', '影像形式': '代表性成员星系团影像拼图' },
      source: 'https://imagine.gsfc.nasa.gov/features/cosmic/nearest_superclusters_info.html',
      photoSource: 'https://imagine.gsfc.nasa.gov/features/cosmic/nearest_superclusters_info.html',
      image: 'https://imagine.gsfc.nasa.gov/features/cosmic/images/nearest_superclusters_sm.jpg', credit: 'NASA / GSFC · Imagine the Universe; individual image credits at the source',
    },
    {
      id: 'orion-constellation', name: '猎户座', english: 'Orion', type: 'constellation',
      description: '猎户座是冬季夜空中容易辨认的星座之一。中央三颗明亮的恒星组成猎户腰带，参宿四与参宿七分处两侧，腰带下方的“剑”中包含猎户座大星云。星座呈现的是从地球观察到的天区与投影图案，其中的恒星实际位于不同距离，并不是同一个紧密的物理星团。',
      facts: { '类型': '星座 / 天区', '代表恒星': '参宿四 · 参宿七', '影像形式': '天区摄影' },
      source: 'https://science.nasa.gov/universe/stories/quick-reads/discovering-the-universe-through-the-constellation-orion/',
      photoSource: 'https://science.nasa.gov/asset/hubble/orion-constellation/',
      image: 'https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2006/01/STScI-01EVT7TPK68JNDV935N42F4N2K.jpg?crop=faces%2Cfocalpoint&fit=clip&h=911&w=728', credit: 'A. Fujii / NASA',
    },
    {
      id: 'ursa-major-constellation', name: '大熊座', english: 'Ursa Major', type: 'constellation',
      description: '大熊座是北天的一片星区，著名的北斗七星组成了其中容易辨认的勺形图案，也常用于寻找北极星。这张天区影像从地球的视角展现大熊座中的恒星；同一星座的恒星可以相距很远，星座名称表达的是天空中的区域和投影关系。',
      facts: { '类型': '星座 / 天区', '著名星群图案': '北斗七星', '影像形式': '天区摄影' },
      source: 'https://pwg.gsfc.nasa.gov/stargaze/Spolaris.htm',
      photoSource: 'https://science.nasa.gov/asset/hubble/constellation-ursa-major/',
      image: 'https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/releases/2007/03/STScI-01EVT72K10R4Z03NC5K04X3T4B.tif?w=2000', credit: 'A. Fujii / NASA',
    },
  ];
  concepts.forEach(concept => { concept.imageSource = concept.image; });
  const targets = [...objects, ...concepts];
  const pools = new Map(), seen = new Set();
  let local;
  const choose = values => values[Math.floor(Math.random() * values.length)];
  const nasaURL = value => { try { const url = new URL(value); return url.protocol === 'https:' && /(^|\.)nasa\.gov$/.test(url.hostname) ? url.href : null; } catch { return null; } };
  const plain = html => new DOMParser().parseFromString(html, 'text/html').body.textContent.trim();
  const notObservation = /\b(?:mission|program|project|proposal|spacecraft|probe|rover|lander|orbiter|satellite|launch|rocket|telescope|observatory|facility|laboratory|lab|engineer\w*|technician|astronaut|portrait|conference|briefing|meeting|exhibit|museum|model|replica|diagram|animation|simulation|artist|concept|illustration|instrument|antenna|test|testing|assembly|installation|construction|workshop|team|crew|station|spacewalk|training|building|logo|poster|infographic|trajectory|timeline|map|artemis|apollo|mars 2020)\b/i;
  const synthetic = /artist['’]?s (?:concept|impression|illustration)|computer[- ](?:generated|simulation)|\b(?:illustration|rendering|simulation|infographic)\b/i;
  function depicts(item, object) {
    const data = item.data?.[0], title = data?.title || '';
    return data?.media_type === 'image' && data.description && nasaURL(item.links?.find(link => link.rel === 'preview')?.href)
      && object.aliases.some(alias => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(title))
      && !notObservation.test(title) && !synthetic.test(data.description);
  }
  async function search(object, signal, page = 1) {
    const url = new URL('https://images-api.nasa.gov/search');
    url.search = new URLSearchParams({ title: object.name, media_type: 'image', page_size: '100', page: String(page) });
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('NASA library unavailable.');
    return (await response.json()).collection;
  }
  async function remote() {
    const signal = AbortSignal.timeout(5500), attempted = new Set();
    if (concepts.every(concept => seen.has(concept.id))) concepts.forEach(concept => seen.delete(concept.id));
    let object, entries;
    for (let attempt = 0; attempt < 3; attempt++) {
      object = choose(targets.filter(target => !attempted.has(target.name) && (!target.image || !seen.has(target.id)))); attempted.add(object.name);
      if (object.image) { seen.add(object.id); return object; }
      entries = pools.get(object.name);
      if (!entries) {
        let collection = await search(object, signal);
        const pages = Math.min(50, Math.ceil((collection.metadata?.total_hits || 0) / 100));
        if (pages > 1) collection = await search(object, signal, 1 + Math.floor(Math.random() * pages));
        entries = (collection.items || []).filter(item => depicts(item, object));
        pools.set(object.name, entries);
      }
      if (entries.length) break;
    }
    if (!entries?.length) throw new Error('No celestial-object photographs found.');
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
      id: data.nasa_id, name: object.name, english: 'NASA Image Library', type: object.type,
      description: description.split(/\s+/).slice(0, 180).join(' ') + (description.split(/\s+/).length > 180 ? '…' : ''),
      facts: { '天体类型': object.type, '影像归档': data.date_created?.slice(0, 10) || 'NASA', '档案编号': data.nasa_id },
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
