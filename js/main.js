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
})();