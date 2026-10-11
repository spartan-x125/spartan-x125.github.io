(() => {
  'use strict';
  const videos = {
    suki: { title: '自己肯定感爆上げ↑↑しゅきしゅきソング', bvid: 'BV1JwbpzHEJN' },
    getta: { title: 'HEATS · GETTER-1', bvid: 'BV1oM411f7EM' },
  };
  const getterDrawing = `
    <svg class="getter-scene" viewBox="0 0 720 360" role="img" aria-label="Eagle、Jaguar、Bear 三台盖塔战机合体为盖塔一号">
      <defs>
        <radialGradient id="getter-space"><stop stop-color="#12382f"/><stop offset="1" stop-color="#080c13"/></radialGradient>
        <linearGradient id="getter-metal" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".5" stop-color="#b8cfce"/><stop offset="1" stop-color="#657b82"/></linearGradient>
        <linearGradient id="getter-red" x2=".8" y2="1"><stop stop-color="#f85754"/><stop offset="1" stop-color="#a82639"/></linearGradient>
      </defs>
      <rect width="720" height="360" fill="url(#getter-space)"/>
      <g fill="#c7f3db" opacity=".55"><circle cx="70" cy="66" r="1"/><circle cx="141" cy="280" r="1.5"/><circle cx="224" cy="54" r="1"/><circle cx="614" cy="73" r="1.5"/><circle cx="662" cy="291" r="1"/><circle cx="494" cy="313" r="1"/><circle cx="90" cy="169" r="1"/><circle cx="555" cy="201" r="1"/><circle cx="434" cy="37" r="1"/></g>
      <g class="getter-speed" stroke="#5cddaa" stroke-width="1" opacity="0"><path d="M0 88H225M0 172H260M0 245H208M510 64H720M465 151H720M532 280H720"/></g>
      <g class="getter-orbit" fill="none" stroke="#67dfae" opacity=".17"><ellipse cx="360" cy="178" rx="236" ry="123"/><ellipse cx="360" cy="178" rx="166" ry="145"/><path d="M70 178H650M360 28V332"/></g>
      <g class="getter-jet getter-eagle">
        <g fill="url(#getter-red)" stroke="#361f32" stroke-width="2" stroke-linejoin="round">
          <path d="M-88 19 -62-10 -22-18 9-62 36-62 26-18 67-10 105 5 66 18 20 20 29 60 6 60 -24 23 -60 27Z"/>
          <path d="M-23-18 24-18 56-6 17 3 -25 6Z" fill="url(#getter-metal)"/>
          <path d="M10-13 34-9 46-5 14-1Z" fill="#59eac8"/>
          <path d="M-82 17 -120 11 -83 6" class="getter-exhaust" fill="#73ffc3" stroke="none"/>
        </g>
      </g>
      <g class="getter-jet getter-jaguar">
        <g fill="url(#getter-metal)" stroke="#253238" stroke-width="2" stroke-linejoin="round">
          <path d="M-97 8 -63-6 -24-12 0-57 31-57 20-13 66-7 106 2 65 14 19 17 30 51 4 51 -26 20 -66 22Z"/>
          <path d="M-29-8 13-11 49-2 13 5 -28 8Z" fill="#ae2537"/>
          <path d="M9-9 28-6 42-2 10 1Z" fill="#7efce0"/>
          <path d="M-89 15 -126 8 -90 2" class="getter-exhaust" fill="#73ffc3" stroke="none"/>
        </g>
      </g>
      <g class="getter-jet getter-bear">
        <g fill="#e5b54b" stroke="#453b32" stroke-width="2" stroke-linejoin="round">
          <path d="M-96 6 -62-12 -19-17 0-52 29-52 24-15 65-5 105 9 66 23 24 24 30 57 4 57 -22 25 -65 24Z"/>
          <path d="M-65-2 -10-9 40-1 54 9 10 17 -61 13Z" fill="#f6d46d"/>
          <path d="M13-5 33 0 47 6 15 8Z" fill="#7afce1"/>
          <path d="M-88 17 -124 10 -90 3" class="getter-exhaust" fill="#73ffc3" stroke="none"/>
        </g>
      </g>
      <g class="getter-lock" fill="none" stroke="#8effc6" stroke-width="2"><circle cx="360" cy="158" r="52"/><circle cx="360" cy="158" r="73" stroke-dasharray="8 14"/></g>
      <g class="getter-robot" stroke="#152525" stroke-width="2.5" stroke-linejoin="round">
        <g class="getter-cape"><path d="M318 101Q288 125 251 273L318 249 333 301 364 264 393 302 410 247 468 270Q427 128 401 101Z" fill="#175e43"/><path d="M323 115 284 260M398 115 437 255" fill="none" stroke="#2c8960"/></g>
        <g class="getter-legs" fill="url(#getter-metal)">
          <path d="M324 207 353 211 349 261 330 282 314 269Z"/><path d="M366 211 396 207 406 269 389 282 371 261Z"/>
          <path d="M315 265 341 267 347 311 310 315 294 305Z" fill="url(#getter-red)"/><path d="M378 267 405 265 426 305 409 315 373 311Z" fill="url(#getter-red)"/>
          <path d="M317 217 349 222M371 222 403 217" fill="none"/>
        </g>
        <g class="getter-arms" fill="url(#getter-metal)">
          <path d="M315 104 291 111 281 170 294 194 312 178 324 130Z"/><path d="M405 104 429 111 439 170 426 194 408 178 396 130Z"/>
          <path d="M295 105 319 105 326 133 287 137Z" fill="url(#getter-red)"/><path d="M401 105 425 105 433 137 394 133Z" fill="url(#getter-red)"/>
          <path d="M282 165 313 168 313 199 303 210 285 201Z" fill="url(#getter-red)"/><path d="M407 168 438 165 435 201 417 210 407 199Z" fill="url(#getter-red)"/>
        </g>
        <g class="getter-torso">
          <path d="M321 99 399 99 411 143 391 190 329 190 309 143Z" fill="url(#getter-red)"/>
          <path d="M321 102 343 116 377 116 399 102 388 143 332 143Z" fill="url(#getter-metal)"/>
          <path d="M341 119H379V139H341Z" fill="#182c29"/><path d="M347 125H373V132H347Z" fill="#79ffb4" stroke="none"/>
          <path d="M337 157H383L377 189H343Z" fill="#d2dcce"/><path d="M339 166H381M342 178H378" fill="none"/>
          <path d="M329 190H391L397 211 371 224H348L322 211Z" fill="#e6b642"/>
        </g>
        <g class="getter-head">
          <path d="M346 97 342 76 349 50 371 50 378 76 373 97Z" fill="url(#getter-red)"/>
          <path d="M349 52 336 30 323 26 337 61 346 68M371 52 384 30 397 26 383 61 374 68" fill="#e9c85c"/>
          <path d="M347 74 357 79H363L373 74 369 96 360 103 351 96Z" fill="url(#getter-metal)"/>
          <path d="M348 69 358 73 356 80 348 76M372 69 362 73 364 80 372 76" fill="#82ffc1" stroke="#185a44" stroke-width="1"/>
          <path d="M355 88H365M356 94H364" fill="none" stroke-width="1.5"/>
        </g>
      </g>
      <circle class="getter-flare" cx="360" cy="157" r="100" fill="#baffdc"/>
      <text class="getter-label" x="360" y="345" text-anchor="middle" fill="#baffdc" font-family="Consolas,monospace" font-size="16" letter-spacing="7">GETTER-1</text>
    </svg>`;
  window.BlogEasterEggs = {
    video: id => videos[id],
    mount({ content, id, iconButton }) {
      const video = videos[id];
      if (!video) throw new Error('Unknown Easter egg.');
      content.classList.add('easter-egg', `easter-egg-${id}`);
      const frame = document.createElement('iframe');
      frame.className = 'easter-egg-video'; frame.title = video.title;
      frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      frame.allowFullscreen = true; frame.referrerPolicy = 'strict-origin-when-cross-origin';
      const embed = new URL('https://player.bilibili.com/player.html');
      embed.search = new URLSearchParams({ bvid: video.bvid, p: '1', autoplay: '1', danmaku: '0' });
      frame.src = embed.href;
      content.append(frame);
      if (id === 'getta') {
        const stage = document.createElement('div'); stage.className = 'getter-stage is-combining';
        stage.innerHTML = getterDrawing;
        const replay = iconButton('restart', '重播盖塔合体动画'); replay.className = 'getter-replay';
        replay.onclick = () => { stage.classList.remove('is-combining'); void stage.offsetWidth; stage.classList.add('is-combining'); };
        stage.append(replay); content.append(stage);
        // Each card owns its SVG paint servers, including when several animations are open.
        stage.querySelectorAll('[id]').forEach(element => {
          const old = element.id, unique = `${old}-${crypto.randomUUID()}`;
          element.id = unique;
          stage.querySelectorAll(`[fill="url(#${old})"]`).forEach(node => node.setAttribute('fill', `url(#${unique})`));
        });
      }
      return { destroy() { frame.src = 'about:blank'; frame.remove(); content.replaceChildren(); } };
    },
  };
})();
