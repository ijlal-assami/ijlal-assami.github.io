(() => {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const root = document.documentElement;

    // People can turn on "reduce motion" in their device settings. We respect it.
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Safe localStorage helpers: some browsers block storage, so we wrap it in try/catch */
    const store = {
        get(key) {
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch {}
        }
    };

    /* Toast notifications: small popups in the bottom-right corner */
    const toastBox = $('#toasts');

    const toast = (title, text) => {
        const box = document.createElement('div');
        box.className = 'toast';
        box.innerHTML = '<b></b><span></span>';
        $('b', box).textContent = title;
        $('span', box).textContent = text;
        toastBox.append(box);

        // After 3.2 seconds: play the slide-out animation, then remove the element
        setTimeout(() => {
            box.classList.add('out');
            setTimeout(() => box.remove(), 400);
        }, 3200);
    };

    /* Color theme picker: changes the two accent colors of the whole page */
    const palettes = [
        { name: 'Cyber',     a: '#4ff0d0', b: '#8b6cff' },
        { name: 'Bubblegum', a: '#ff6bcb', b: '#6c8bff' },
        { name: 'Gold',      a: '#ffd166', b: '#ff7a59' },
        { name: 'Red',       a: '#ff4655', b: '#6d28d9' }
    ];

    const paletteBox = $('#palette');
    let themeColors = [palettes[0].a, palettes[0].b];   // the animated background uses these

    const applyPalette = index => {
        root.style.setProperty('--accent', palettes[index].a);
        root.style.setProperty('--accent-2', palettes[index].b);
        themeColors = [palettes[index].a, palettes[index].b];

        // Mark the chosen square as pressed
        $$('button', paletteBox).forEach((button, i) => {
            button.setAttribute('aria-pressed', i === index);
        });

        store.set('palette', index);
    };

    // One small square (button) for each palette
    palettes.forEach((palette, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'swatch';
        button.style.setProperty('--sw-a', palette.a);
        button.style.setProperty('--sw-b', palette.b);
        button.setAttribute('aria-label', 'Color theme: ' + palette.name);
        button.addEventListener('click', () => applyPalette(index));
        paletteBox.append(button);
    });

    // Restore the saved choice, or use the first palette
    const savedPalette = Number(store.get('palette'));
    applyPalette(palettes[savedPalette] ? savedPalette : 0);

    /* Mobile menu */
    const menuBtn = $('#menuBtn');
    const navLinks = $('#navLinks');

    const setMenu = open => {
        navLinks.classList.toggle('open', open);
        menuBtn.setAttribute('aria-expanded', open);
    };

    menuBtn.addEventListener('click', () => {
        setMenu(!navLinks.classList.contains('open'));
    });

    // Close the menu after tapping a link
    $$('a', navLinks).forEach(a => {
        a.addEventListener('click', () => setMenu(false));
    });

    /* Smooth scrolling (Lenis): the page glides and slows down softly instead of jumping */
    let lenis = null;

    // If the library did not load (for example offline), the page just scrolls the normal way
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            autoRaf: true,    // Lenis updates itself on every animation frame
            lerp: 0.09,       // lower = smoother, and it takes longer to stop
            anchors: true     // menu links and buttons like href="#about" glide to their section too
        });
    }

    /* Typing effect */
    const phrases = [
        'learning PHP.',
        'building real projects.',
        'leveling up my JavaScript.',
        'grinding HTML and CSS.'
    ];
    const typing = $('#typing');

    let phraseIndex = 0;    // which phrase we are on
    let charIndex = 0;      // how many letters are shown right now
    let deleting = false;   // typing forward, or deleting?

    const tick = () => {
        const phrase = phrases[phraseIndex];
        typing.textContent = phrase.slice(0, charIndex);

        // Move one letter forward or backward
        charIndex += deleting ? -1 : 1;

        let delay = deleting ? 35 : 75;

        if (!deleting && charIndex > phrase.length) {
            deleting = true;
            delay = 1400;   // pause when the phrase is complete
        } else if (deleting && charIndex < 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            charIndex = 0;
            delay = 400;    // short pause before the next phrase
        }

        setTimeout(tick, delay);
    };

    // Skip the animation for people who turned off motion in their device settings
    if (reduceMotion) {
        typing.textContent = phrases[0];
    } else {
        tick();
    }

    /* Photo: loads images/me.jpg, falls back to the placeholder if the file is missing */
    const photo = $('#photoImg');
    const placeholder = $('#photoPlaceholder');

    photo.addEventListener('load', () => {
        photo.hidden = false;
        placeholder.style.display = 'none';
    });

    photo.addEventListener('error', () => {
        photo.hidden = true;
        placeholder.style.display = '';
    });

    photo.src = 'images/me.jpg';

    /* Skill bars: each bar is 10 small segments, built here to keep the HTML short */
    $$('.segs').forEach(bar => {
        for (let i = 0; i < 10; i++) {
            bar.append(document.createElement('span'));
        }
    });

    // Light up the segments one by one, up to the level in data-level
    const fillSegments = bar => {
        $$('span', bar).forEach((segment, i) => {
            if (i < Number(bar.dataset.level)) {
                setTimeout(() => segment.classList.add('on'), i * 110);
            }
        });
    };

    /* Scroll reveal: fade elements in when they scroll into view */
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const item = entry.target;
            item.classList.add('show');

            // A skill card also lights up its bar
            const skillBar = $('.segs', item);
            if (skillBar) fillSegments(skillBar);

            // The player card also fills its XP bar
            const xpBar = $('[data-fill]', item);
            if (xpBar) xpBar.style.width = xpBar.dataset.fill + '%';

            revealObserver.unobserve(item);   // only once
        });
    }, { threshold: 0.15 });

    const startReveal = () => $$('.reveal').forEach(item => revealObserver.observe(item));

    /* Scroll progress: the colored line under the navbar grows as you scroll down */
    const header = $('header');

    const updateProgress = () => {
        const maxScroll = root.scrollHeight - root.clientHeight;
        const percent = maxScroll > 0 ? (root.scrollTop / maxScroll) * 100 : 0;
        header.style.setProperty('--p', percent + '%');
    };

    addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    /* Active menu link + one-time achievement toasts */
    const menuLinks = $$('.nav-links a[href^="#"]');
    const unlocked = new Set();   // sections that already showed their toast

    const achievements = {
        skills: ['Achievement unlocked', 'Skill Tree discovered'],
        projects: ['Quest log opened', 'See what I have built so far'],
        contact: ['Quest update', 'Say hi to start a new quest']
    };

    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const id = entry.target.id;

            // Highlight the menu link of the section in the middle of the screen
            menuLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + id);
            });

            // Show the achievement toast only the first time
            if (achievements[id] && !unlocked.has(id)) {
                unlocked.add(id);
                toast(...achievements[id]);
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    $$('main section').forEach(section => sectionObserver.observe(section));

    /* Contact form: send to Formspree without leaving the page */
    const contactForm = $('#contactForm');
    const sendBtn = $('#sendBtn');
    const formStatus = $('#formStatus');

    // Only set up the form if all three elements exist, so a missing one can not crash the rest of the script
    if (contactForm && sendBtn && formStatus) {
        contactForm.addEventListener('submit', async e => {
            e.preventDefault();    // stop the browser from leaving the page

            const originalText = sendBtn.textContent;

            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';
            formStatus.textContent = 'Sending your message...';
            formStatus.dataset.status = 'sending';

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { Accept: 'application/json' }
                });

                if (!response.ok) {
                    throw new Error('Message delivery failed.');
                }

                formStatus.textContent = 'Message sent successfully! Thanks for reaching out.';
                formStatus.dataset.status = 'success';
                contactForm.reset();
                toast('Message sent', 'Your message has been sent successfully!');
            } catch (error) {
                formStatus.textContent = 'Sorry, your message could not be sent. Please try again.';
                formStatus.dataset.status = 'error';
                toast('Send failed', 'Please check your connection and try again.');
            } finally {
                sendBtn.disabled = false;
                sendBtn.textContent = originalText;
            }
        });
    }

    /* Easter egg: the Konami code (up up down down left right left right B A) */
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiStep = 0;   // how many keys of the code were typed correctly so far

    addEventListener('keydown', e => {
        // Ignore keys like Shift, so typing a capital B does not break the code
        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

        // Letters are compared in lowercase, so "B" and "b" both work
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

        if (key === konamiCode[konamiStep]) {
            konamiStep++;       // correct key: wait for the next one
        } else if (key === konamiCode[0]) {
            konamiStep = 1;     // wrong key, but it is the first key of the code: start again from there
        } else {
            konamiStep = 0;     // wrong key: start over
        }

        // The whole code was typed
        if (konamiStep === konamiCode.length) {
            konamiStep = 0;
            toast('Cheat code activated', '+30 lives. You found the secret!');
            root.classList.add('party');
            setTimeout(() => root.classList.remove('party'), 4000);
        }
    });

    /* Animated background: tiny pixel stars drift upward and link up like a skill tree */
    const bgCanvas = $('#bgCanvas');
    const bgCtx = bgCanvas.getContext('2d');
    const stars = [];
    const mouse = { x: -1000, y: -1000 };   // far away until the mouse moves
    const LINK_DISTANCE = 130;              // stars closer than this get a line between them
    let bgWidth = 0;
    let bgHeight = 0;
    let comet = null;                       // the shooting star that crosses the screen now and then
    let nextComet = 4000;                   // time (milliseconds) when the next comet may appear

    const randomBetween = (min, max) => min + Math.random() * (max - min);
    const wrap = (value, max) => ((value % max) + max) % max;   // keeps a number between 0 and max

    const newStar = () => ({
        x: Math.random() * bgWidth,
        y: Math.random() * bgHeight,
        size: Math.random() < 0.7 ? 2 : 3,        // pixel size
        depth: randomBetween(0.2, 1),             // far stars (small number) move less when you scroll
        vx: randomBetween(-0.12, 0.12),
        vy: randomBetween(-0.25, -0.05),          // drifts slowly upward
        color: Math.random() < 0.5 ? 0 : 1,       // 0 = main accent color, 1 = second accent color
        phase: Math.random() * Math.PI * 2        // so the stars do not all twinkle together
    });

    const resizeBackground = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);   // sharp on phones, but not too heavy
        bgWidth = window.innerWidth;
        bgHeight = window.innerHeight;
        bgCanvas.width = bgWidth * ratio;
        bgCanvas.height = bgHeight * ratio;
        bgCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

        // Fewer stars on small screens, so phones stay fast
        const count = Math.min(80, Math.round(bgWidth * bgHeight / 12000));
        while (stars.length < count) stars.push(newStar());
        stars.length = count;
    };

    const drawBackground = time => {
        bgCtx.clearRect(0, 0, bgWidth, bgHeight);
        const scrolled = window.scrollY;

        // 1. Move every star and work out where to draw it (scrolling shifts near stars more)
        stars.forEach(star => {
            if (!reduceMotion) {
                star.x = wrap(star.x + star.vx, bgWidth);
                star.y = wrap(star.y + star.vy, bgHeight);
            }
            star.drawX = Math.round(star.x);
            star.drawY = Math.round(wrap(star.y - scrolled * star.depth * 0.3, bgHeight));
        });

        // 2. Draw a line between two stars that are close to each other
        bgCtx.lineWidth = 1;
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const a = stars[i];
                const b = stars[j];
                const distance = Math.hypot(a.drawX - b.drawX, a.drawY - b.drawY);
                if (distance > LINK_DISTANCE) continue;

                bgCtx.globalAlpha = (1 - distance / LINK_DISTANCE) * 0.32;   // closer = clearer
                bgCtx.strokeStyle = themeColors[a.color];
                bgCtx.beginPath();
                bgCtx.moveTo(a.drawX + 1, a.drawY + 1);
                bgCtx.lineTo(b.drawX + 1, b.drawY + 1);
                bgCtx.stroke();
            }
        }

        // 3. Draw a line from the mouse to the stars around it
        stars.forEach(star => {
            const distance = Math.hypot(star.drawX - mouse.x, star.drawY - mouse.y);
            if (distance > 150) return;

            bgCtx.globalAlpha = (1 - distance / 150) * 0.6;
            bgCtx.strokeStyle = themeColors[0];
            bgCtx.beginPath();
            bgCtx.moveTo(star.drawX + 1, star.drawY + 1);
            bgCtx.lineTo(mouse.x, mouse.y);
            bgCtx.stroke();
        });

        // 4. Draw the stars (small squares that twinkle)
        stars.forEach(star => {
            bgCtx.globalAlpha = reduceMotion ? 0.7 : 0.55 + 0.35 * Math.sin(time * 0.002 + star.phase);
            bgCtx.fillStyle = themeColors[star.color];
            bgCtx.fillRect(star.drawX, star.drawY, star.size, star.size);
        });

        // 5. A comet now and then: a short trail of fading gold pixels
        if (!reduceMotion) {
            if (!comet && time > nextComet) {
                comet = { x: randomBetween(0, bgWidth * 0.7), y: -20, vx: randomBetween(5, 7), vy: randomBetween(2.5, 3.5) };
            }

            if (comet) {
                comet.x += comet.vx;
                comet.y += comet.vy;

                for (let i = 0; i < 12; i++) {
                    bgCtx.globalAlpha = (1 - i / 12) * 0.8;
                    bgCtx.fillStyle = '#ffd166';   // the same gold as the XP bar
                    bgCtx.fillRect(Math.round(comet.x - comet.vx * i * 1.5), Math.round(comet.y - comet.vy * i * 1.5), 3, 3);
                }

                if (comet.x > bgWidth + 40 || comet.y > bgHeight + 40) {
                    comet = null;
                    nextComet = time + randomBetween(7000, 14000);
                }
            }
        }

        bgCtx.globalAlpha = 1;

        // Keep animating (people with "reduce motion" only get one still picture)
        if (!reduceMotion) requestAnimationFrame(drawBackground);
    };

    // The mouse position (only on devices that have a real mouse)
    if (matchMedia('(hover: hover)').matches) {
        addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        document.addEventListener('mouseleave', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });
    }

    addEventListener('resize', () => {
        resizeBackground();
        if (reduceMotion) requestAnimationFrame(drawBackground);   // redraw the still picture
    });

    resizeBackground();
    requestAnimationFrame(drawBackground);

    /* Game-style loading screen */
    const loader = $('#loader');
    const loadBar = $('#loadBar');
    const runner = $('#runner');
    const loadPct = $('#loadPct');
    const loadMsg = $('#loadMsg');
    const loadTip = $('#loadTip');

    // Build the 20 little squares of the loading bar
    for (let i = 0; i < 20; i++) {
        loadBar.append(document.createElement('span'));
    }
    const barSegments = $$('span', loadBar);

    // Show one random tip
    const tips = [
        'Tip: try the Konami code somewhere on the page.',
        'Tip: pick your favorite color theme in the navbar.',
        'Tip: scroll down to fill the XP bar.'
    ];
    loadTip.textContent = tips[Math.floor(Math.random() * tips.length)];

    // The message changes as the percentage grows
    const messages = [
        { from: 0, text: 'Booting up...' },
        { from: 25, text: 'Loading HTML...' },
        { from: 50, text: 'Loading CSS...' },
        { from: 70, text: 'Loading JavaScript...' },
        { from: 90, text: 'Loading PHP...' },
        { from: 100, text: 'Ready!' }
    ];

    const currentMessage = percent => {
        // Take the last message whose "from" is not above the percentage
        return messages.filter(m => percent >= m.from).pop().text;
    };

    const duration = reduceMotion ? 500 : 2800;   // how long loading takes (milliseconds)

    let pageLoaded = document.readyState === 'complete';
    if (!pageLoaded) {
        addEventListener('load', () => { pageLoaded = true; });
    }

    const finishLoading = () => {
        loader.classList.add('done');       // slide the loading screen up
        setTimeout(startReveal, 300);       // let the slide start first, so it stays smooth
        setTimeout(() => {
            loader.remove();
            root.classList.remove('loading');   // unlock scrolling
            if (lenis) lenis.start();
        }, 900);
    };

    let startTime = null;

    const frame = now => {
        if (startTime === null) startTime = now;   // first frame

        let percent = Math.min(100, (now - startTime) / duration * 100);
        if (!pageLoaded) percent = Math.min(percent, 90);   // never 100% before the page is really loaded

        loadPct.textContent = Math.floor(percent) + '%';
        runner.style.setProperty('--x', percent / 100);
        barSegments.forEach((segment, i) => {
            segment.classList.toggle('on', i < Math.floor(percent / 5));
        });
        loadMsg.textContent = currentMessage(percent);

        if (percent < 100) {
            requestAnimationFrame(frame);
        } else {
            setTimeout(finishLoading, 450);
        }
    };

    // Show the loading screen only once per browser session
    let seenLoader = false;
    try {
        seenLoader = sessionStorage.getItem('seenLoader') === '1';
    } catch {}

    if (seenLoader) {
        loader.remove();
        root.classList.remove('loading');
        startReveal();
    } else {
        try {
            sessionStorage.setItem('seenLoader', '1');
        } catch {}
        if (lenis) lenis.stop();   // no scrolling while the loading screen is showing
        requestAnimationFrame(frame);
    }
})();
