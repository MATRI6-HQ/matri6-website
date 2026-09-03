// Force scroll to top on page load/refresh -- but only when the URL has no
// fragment. The footer links to index.html#join from every page, and the old
// unconditional scrollTo(0, 0) fired after the browser had jumped to the
// anchor, dumping the visitor back at the top of the home page instead.
const hasTargetHash = () => {
    const hash = window.location.hash;
    if (!hash || hash === '#') return false;
    try {
        return !!document.querySelector(hash);
    } catch (err) {
        return false; // not a valid selector
    }
};

if (history.scrollRestoration) {
    history.scrollRestoration = hasTargetHash() ? 'auto' : 'manual';
}

if (!hasTargetHash()) {
    window.scrollTo(0, 0);
    window.addEventListener('load', () => {
        if (!hasTargetHash()) window.scrollTo(0, 0);
    });
} else {
    // Let the snap layout settle, then land precisely on the target section.
    window.addEventListener('load', () => {
        const target = document.querySelector(window.location.hash);
        if (target) requestAnimationFrame(() => target.scrollIntoView());
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Automatically open external links in a new tab
    document.querySelectorAll('a').forEach(link => {
        if (link.hostname !== window.location.hostname && link.hostname !== '') {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });


    const container = document.querySelector('.scroll-container');
    const header = document.getElementById('main-header');
    
    if (!container) return;
    
    if (header) {
        // Initialize section data attribute
        header.setAttribute('data-section', '1');

        // Handle scroll animation for the header.
        // rAF-throttled and passive: this fires on every scroll tick and was
        // previously blocking the scroll thread while writing to the DOM.
        let headerTick = false;
        const updateHeader = () => {
            headerTick = false;
            const scrollY = window.scrollY;
            const vh = window.innerHeight;
            
            // Toggle 'scrolled' class after scrolling down a bit (e.g., 50px)
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            // Determine active section for line animations
            let currentSection = 1;
            if (scrollY > vh * 0.5 && scrollY < vh * 1.5) {
                currentSection = 2;
            } else if (scrollY >= vh * 1.5 && scrollY < vh * 2.5) {
                currentSection = 3;
            } else if (scrollY >= vh * 2.5 && scrollY < vh * 3.5) {
                currentSection = 4;
            } else if (scrollY >= vh * 3.5 && scrollY < vh * 4.5) {
                currentSection = 5;
            } else if (scrollY >= vh * 4.5 && scrollY < vh * 5.5) {
                currentSection = 6;
            } else if (scrollY >= vh * 5.5 && scrollY < vh * 6.5) {
                currentSection = 7;
            } else if (scrollY >= vh * 6.5) {
                currentSection = 8;
            }
            
            header.setAttribute('data-section', currentSection);
        };
        window.addEventListener('scroll', () => {
            if (headerTick) return;
            headerTick = true;
            requestAnimationFrame(updateHeader);
        }, { passive: true });
        updateHeader();
    }

    // Custom hover cursor logic for Ecosystem Grid.
    // Pointer-driven only: bound behind a fine-pointer query so touch devices
    // never register the listener at all.
    const cursorImage = document.getElementById('cursor-image');
    const gridItems = document.querySelectorAll('.grid-item');
    let cursorX = 0, cursorY = 0;

    if (cursorImage && gridItems.length && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        
        if (cursorImage.classList.contains('visible')) {
            cursorImage.style.left = cursorX + 'px';
            cursorImage.style.top = cursorY + 'px';
        }
    }, { passive: true });

    gridItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const imgSrc = item.getAttribute('data-image');
            if (imgSrc) {
                cursorImage.style.backgroundImage = `url('${imgSrc}')`;
            }
            if (item.classList.contains('right-align')) {
                cursorImage.classList.add('align-left');
            } else {
                cursorImage.classList.remove('align-left');
            }
            cursorImage.classList.add('visible');
            cursorImage.style.left = cursorX + 'px';
            cursorImage.style.top = cursorY + 'px';
        });
        
        item.addEventListener('mouseleave', () => {
            cursorImage.classList.remove('visible');
        });
    });
    }
    
    // Select a random palette on page load
    const palettes = [
        { bg: '#18181b', line: '#3b82f6' }, // Dark / Vibrant Blue
        { bg: '#050505', line: '#ff7722' }, // Black / Orange
        { bg: '#0f172a', line: '#10b981' }, // Slate / Emerald
        { bg: '#1e1b4b', line: '#c084fc' }, // Indigo / Purple
        { bg: '#450a0a', line: '#fca5a5' }, // Dark Red / Light Red
        { bg: '#f8f9fa', line: '#050505' }, // Off-white / Black
        { bg: '#020617', line: '#eab308' }  // Deep space / Yellow
    ];
    const currentPalette = palettes[Math.floor(Math.random() * palettes.length)];
    
    // Cache the tile map so resizing the window doesn't constantly morph the design
    const tileMap = new Map();
    const getTileType = (col, row, prefix = '') => {
        const key = `${prefix}_${col},${row}`;
        if (!tileMap.has(key)) {
            tileMap.set(key, Math.random() > 0.5);
        }
        return tileMap.get(key);
    };
    
    const initGeoCanvas = (canvasId, options = {}) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const resizeAndDraw = () => {
            const parent = canvas.parentElement;
            if (!parent || parent.clientWidth === 0) return; // Prevent drawing if hidden or detached
            
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            
            const w = canvas.width;
            const h = canvas.height;
            
            const activePalette = options.fixedPalette || currentPalette;
            
            if (activePalette.bg === 'transparent') {
                ctx.clearRect(0, 0, w, h);
            } else {
                ctx.fillStyle = activePalette.bg;
                ctx.fillRect(0, 0, w, h);
            }
            
            // Tile settings
            const S = options.tileSize || 100; // Tile size
            const N = options.linesPerTileHalf || 4;   // Number of lines per tile half
            const gridUnit = S / (2 * N); // Base coordinate grid unit
            
            ctx.lineWidth = options.lineWidthRatio ? gridUnit * options.lineWidthRatio : gridUnit;
            ctx.lineCap = 'square'; 
            ctx.lineJoin = 'miter';
            ctx.strokeStyle = activePalette.line;
            
            const cols = Math.ceil(w / S) + 1;
            const rows = Math.ceil(h / S) + 1;
            
            for (let col = -1; col <= cols; col++) {
                for (let row = -1; row <= rows; row++) {
                    const x = col * S;
                    const y = row * S;
                    
                    const isForwardSlash = getTileType(col, row, canvasId);
                    
                    ctx.beginPath();
                    if (isForwardSlash) {
                        for (let i = 0; i < N; i++) {
                            const o1 = (i * 2 + 1) * gridUnit;
                            const o2 = S - o1;
                            ctx.moveTo(x + o1, y);
                            ctx.lineTo(x + S, y + o2);
                            ctx.moveTo(x, y + o1);
                            ctx.lineTo(x + o2, y + S);
                        }
                    } else {
                        for (let i = 0; i < N; i++) {
                            const offset = (i * 2 + 1) * gridUnit;
                            ctx.moveTo(x + offset, y);
                            ctx.lineTo(x, y + offset);
                            ctx.moveTo(x + S, y + offset);
                            ctx.lineTo(x + offset, y + S);
                        }
                    }
                    ctx.stroke();
                }
            }
        };

        window.addEventListener('resize', resizeAndDraw);
        // Small timeout ensures layout is fully calculated before first draw
        setTimeout(resizeAndDraw, 10);
    };

    // FAQ Tab switching logic for Section 6
    const faqTabs = document.querySelectorAll('.faq-tab');
    faqTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and lists
            document.querySelectorAll('.faq-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.faq-list-container').forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show target list
            const targetId = tab.getAttribute('data-target');
            const targetList = document.getElementById(targetId);
            if (targetList) {
                targetList.classList.add('active');
            }
        });
    });

    // FAQ Accordion logic.
    // The trigger is now a <button> inside an <h3>, so walk up to .faq-item
    // rather than assuming the parent, and mirror the open state into
    // aria-expanded so screen readers get the same information as the "+" icon.
    const faqHeaders = document.querySelectorAll('.faq-header');
    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.closest('.faq-item');
            if (!item) return;
            const isOpen = item.classList.contains('open');

            // Close all items
            document.querySelectorAll('.faq-item').forEach(faq => {
                faq.classList.remove('open');
                const btn = faq.querySelector('.faq-header');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            });

            // If it wasn't open, open it
            if (!isOpen) {
                item.classList.add('open');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });

    initGeoCanvas('geoCanvas');
    initGeoCanvas('aipGeoCanvas', { fixedPalette: { bg: '#151515', line: '#252525' } });
    initGeoCanvas('visionGeoCanvas', { fixedPalette: { bg: '#58aaf2', line: '#050505' } });
    initGeoCanvas('ecoGeoCanvasLeft', { fixedPalette: { bg: '#ff6c3d', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });
    initGeoCanvas('ecoGeoCanvasRight', { fixedPalette: { bg: '#ff6c3d', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });
    
    // Section 8 (Contact) title canvases
    initGeoCanvas('contactGeoCanvasLeft', { fixedPalette: { bg: 'transparent', line: '#ffffff' }, tileSize: 50, linesPerTileHalf: 2 });
    initGeoCanvas('contactGeoCanvasRight', { fixedPalette: { bg: 'transparent', line: '#ffffff' }, tileSize: 50, linesPerTileHalf: 2 });
    
    // Why MATRI6 canvases
    initGeoCanvas('whyTitleCanvas', { fixedPalette: { bg: '#202123', line: '#fed648' }, tileSize: 50, linesPerTileHalf: 2, lineWidthRatio: 0.25 });
    initGeoCanvas('whyCanvas1', { fixedPalette: { bg: 'transparent', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });
    initGeoCanvas('whyCanvas2', { fixedPalette: { bg: 'transparent', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });
    initGeoCanvas('whyCanvas3', { fixedPalette: { bg: 'transparent', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });
    initGeoCanvas('whyCanvas4', { fixedPalette: { bg: 'transparent', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });
    initGeoCanvas('whyCanvas5', { fixedPalette: { bg: 'transparent', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });
    initGeoCanvas('whyCanvas6', { fixedPalette: { bg: 'transparent', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });

    // Vision Header Animation
    const visionHeader = document.querySelector('.vision-header h2');
    const visionSection = document.querySelector('.vision-section');
    if (visionHeader && visionSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visionHeader.classList.add('animate-in');
                } else {
                    // Remove if you want it to re-animate every time you scroll back down
                    visionHeader.classList.remove('animate-in');
                }
            });
        }, { threshold: 0.2 }); // Trigger when 20% of the section is visible
        observer.observe(visionSection);
    }

    // Horizontal Scroll Track Logic (for aiproducts.html)
    const stickyWrapper = document.querySelector('.sticky-wrapper');
    const hTrack = document.querySelector('.horizontal-scroll-track');
    if (stickyWrapper && hTrack) {
        let hTick = false;
        const updateTrack = () => {
            hTick = false;
            const rect = stickyWrapper.getBoundingClientRect();
            const wrapperTop = rect.top;
            
            // Only transform when the wrapper reaches or passes the top of the viewport
            if (wrapperTop <= 0) {
                // How far we have scrolled within the wrapper
                const scrolledDistance = -wrapperTop;
                
                // The total scrollable distance within the sticky wrapper
                // (subtracting window.innerHeight because the last slide rests on screen)
                const maxScroll = rect.height - window.innerHeight;
                
                let progress = scrolledDistance / maxScroll;
                // Clamp progress between 0 and 1
                progress = Math.max(0, Math.min(1, progress));
                
                // Max horizontal translate distance (total width of track - 1 viewport width)
                const maxTranslate = hTrack.scrollWidth - window.innerWidth;
                
                hTrack.style.transform = `translateX(${-progress * maxTranslate}px)`;
            } else {
                hTrack.style.transform = `translateX(0px)`;
            }
        };
        window.addEventListener('scroll', () => {
            if (hTick) return;
            hTick = true;
            requestAnimationFrame(updateTrack);
        }, { passive: true });
        updateTrack();
    }

    // Smooth in-page navigation (the vision CTA -> Join MATRI6).
    // The page is scroll-snap-type: y mandatory with scroll-snap-stop: always, which
    // halts a native smooth scroll at every section it crosses. Snapping is switched
    // off for the duration of the flight and restored on landing -- we finish exactly
    // on the target's snap point, so putting it back is seamless.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let activeScroll = null;

    const endScroll = () => {
        if (!activeScroll) return;
        cancelAnimationFrame(activeScroll.frame);
        document.documentElement.style.scrollSnapType = activeScroll.snapType;
        activeScroll = null;
    };

    const smoothScrollToY = (endY, duration = 900) => {
        const startY = window.scrollY;
        endY = Math.round(endY);
        if (endY === startY) return;

        endScroll();
        const root = document.documentElement;
        activeScroll = { frame: 0, snapType: root.style.scrollSnapType };
        root.style.scrollSnapType = 'none';

        if (reducedMotion.matches) {
            window.scrollTo(0, endY);
            endScroll();
            return;
        }

        const startTime = performance.now();
        const step = now => {
            const t = Math.min(1, (now - startTime) / duration);
            window.scrollTo(0, startY + (endY - startY) * easeInOutCubic(t));
            if (t < 1) {
                activeScroll.frame = requestAnimationFrame(step);
            } else {
                window.scrollTo(0, endY); // land exactly on the snap point
                endScroll();
            }
        };
        activeScroll.frame = requestAnimationFrame(step);
    };

    const smoothScrollTo = (target, duration = 900) =>
        smoothScrollToY(window.scrollY + target.getBoundingClientRect().top, duration);

    const smoothScrollToTop = (duration = 900) => smoothScrollToY(0, duration);

    // Hand control straight back if the user starts scrolling mid-flight
    ['wheel', 'touchstart', 'keydown'].forEach(evt =>
        window.addEventListener(evt, endScroll, { passive: true }));

    /*
      The MATRI6 wordmark links home from every page. On the home page itself
      that would be a pointless full reload, so intercept it and fly back to the
      top with the same eased scroll the in-page CTAs use. Everywhere else it is
      left alone and navigates normally.
    */
    const brandLinks = document.querySelectorAll('.brand-link');
    // Every page is an index.html under a clean-URL directory, so an endsWith
    // test would match /about/index.html too. Only the site root counts.
    const onHomePage = window.location.pathname === '/' ||
        window.location.pathname === '/index.html';

    brandLinks.forEach(link => {
        link.addEventListener('click', e => {
            if (!onHomePage) return;            // let the browser navigate
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            smoothScrollToTop();
            // Drop any lingering #hash so the URL matches where we actually are.
            if (window.location.hash) {
                history.pushState(null, '', window.location.pathname);
            }
        });
    });

    // Catches both bare fragments (#join) and same-page links that carry a path
    // (/#join in the footer). Without the second case, "Contact the team" on the
    // home page would reload the whole page to reach a section already on screen.
    document.querySelectorAll('a[href*="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const url = new URL(link.href, window.location.href);
            if (url.origin !== window.location.origin) return;
            if (url.pathname !== window.location.pathname) return;
            const hash = url.hash;
            if (!hash || hash === '#') return;
            let target = null;
            try { target = document.querySelector(hash); } catch (err) { return; }
            if (!target) return;
            e.preventDefault();
            smoothScrollTo(target);
            // Move focus as well as the viewport, otherwise the skip link and the
            // in-page CTAs scroll sighted users but leave keyboard focus stranded
            // at the top of the document.
            if (!target.hasAttribute('tabindex')) {
                target.setAttribute('tabindex', '-1');
            }
            target.focus({ preventScroll: true });
            history.pushState(null, '', hash); // keep the URL shareable and the back button working
        });
    });

});

// Coming Soon Popup Logic.
// The modal previously had no keyboard path in or out: opening it left focus
// behind on the page, Escape did nothing, and Tab walked straight out into the
// content behind the overlay. Focus is now moved in, trapped, and returned.
(function () {
    let lastFocused = null;

    const getModal = () => document.getElementById('comingSoonModal');

    const focusablesIn = modal => Array.from(
        modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.hasAttribute('disabled'));

    window.showComingSoonPopup = function (e) {
        if (e) e.preventDefault();
        const modal = getModal();
        if (!modal) return;
        lastFocused = document.activeElement;
        modal.classList.add('show');
        modal.removeAttribute('aria-hidden');
        const focusable = focusablesIn(modal);
        if (focusable.length) focusable[0].focus();
    };

    window.closeComingSoonPopup = function () {
        const modal = getModal();
        if (!modal) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
        lastFocused = null;
    };

    // Click the backdrop to dismiss
    document.addEventListener('click', function (e) {
        const modal = getModal();
        if (modal && e.target === modal) {
            window.closeComingSoonPopup();
        }
    });

    document.addEventListener('keydown', function (e) {
        const modal = getModal();
        if (!modal || !modal.classList.contains('show')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            window.closeComingSoonPopup();
            return;
        }

        if (e.key !== 'Tab') return;

        // Keep Tab inside the dialog while it is open.
        const focusable = focusablesIn(modal);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
})();

/*
  Static header legibility guard.

  .static-header uses mix-blend-mode: difference so the MATRI6 wordmark inverts
  against whatever is behind it. That reads well over dark and light grounds,
  but a saturated mid-tone (#5865F2, #0fb981, #ff6c3d ...) inverts to a colour
  of almost identical luminance, which makes the wordmark vanish. Here we sample
  the backdrop under the header and, only when the inverted result would be too
  low contrast, drop to a solid light/dark wordmark instead.
*/
(function () {
    const header = document.querySelector('.static-header');
    if (!header) return;

    const MIN_CONTRAST = 3.0;          // WCAG AA for large text
    const INK_DARK = [17, 17, 17];     // .header-solid.on-light
    const INK_LIGHT = [255, 255, 255]; // .header-solid.on-dark

    function relLuminance(rgb) {
        const a = rgb.map(function (v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    function contrast(a, b) {
        const la = relLuminance(a), lb = relLuminance(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    }

    // Nearest ancestor with an actually opaque background colour.
    function backdropAt(x, y) {
        header.style.pointerEvents = 'none';
        let el = document.elementFromPoint(x, y);
        header.style.pointerEvents = '';

        while (el && el !== document.documentElement) {
            const parts = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
            if (parts && (parts.length < 4 || parseFloat(parts[3]) > 0.5)) {
                return [+parts[0], +parts[1], +parts[2]];
            }
            el = el.parentElement;
        }
        return null;
    }

    function update() {
        const rect = header.getBoundingClientRect();
        const bg = backdropAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
        if (!bg) return;

        const inverted = bg.map(function (v) { return 255 - v; });

        if (contrast(inverted, bg) >= MIN_CONTRAST) {
            header.classList.remove('header-solid', 'on-dark', 'on-light');
        } else {
            // Pick whichever of the two solid inks actually scores higher rather
            // than thresholding on luminance -- mid-tones like #ff6c3d sit close
            // enough to the middle that a fixed cutoff picks the wrong one.
            const dark = contrast(INK_DARK, bg) >= contrast(INK_LIGHT, bg);
            header.classList.add('header-solid');
            header.classList.toggle('on-light', dark);
            header.classList.toggle('on-dark', !dark);
        }
    }

    let queued = false;
    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
            queued = false;
            update();
        });
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // main.js is loaded at the end of <body>, so layout is already available:
    // resolve the first state synchronously rather than waiting on a frame,
    // otherwise the wordmark can paint in the wrong colour before rAF runs.
    update();
    window.addEventListener('load', update);
})();
