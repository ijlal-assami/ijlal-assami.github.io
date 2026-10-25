(() => {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const root = document.documentElement;

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

    const applyPalette = index => {
        root.style.setProperty('--accent', palettes[index].a);
        root.style.setProperty('--accent-2', palettes[index].b);

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
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

    startReveal();

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
})();