(() => {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];

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

    /* XP bar: set the width from the data-fill attribute */
    setTimeout(() => {
        $$('[data-fill]').forEach(bar => {
            bar.style.width = bar.dataset.fill + '%';
        });
    }, 300);
})();