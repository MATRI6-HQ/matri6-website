// Force scroll to top on page load/refresh
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0));

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

        // Handle scroll animation for the header
        window.addEventListener('scroll', () => {
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
        });
    }

    // Custom hover cursor logic for Ecosystem Grid
    const cursorImage = document.getElementById('cursor-image');
    const gridItems = document.querySelectorAll('.grid-item');
    let cursorX = 0, cursorY = 0;
    
    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        
        if (cursorImage.classList.contains('visible')) {
            cursorImage.style.left = cursorX + 'px';
            cursorImage.style.top = cursorY + 'px';
        }
    });

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

    // Carousel logic for Section 5
    const setupCarousel = (trackId) => {
        const track = document.getElementById(trackId);
        if (!track) return;
        
        const prevBtn = track.parentElement.querySelector('.prev-btn');
        const nextBtn = track.parentElement.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const scrollAmount = track.querySelector('.media-card').clientWidth + window.innerWidth * 0.02; // card width + gap
                track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const scrollAmount = track.querySelector('.media-card').clientWidth + window.innerWidth * 0.02; // card width + gap
                track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }
    };

    // Initialize canvases
    setupCarousel('blogs-track');
    setupCarousel('news-track');
    
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

    // FAQ Accordion logic
    const faqHeaders = document.querySelectorAll('.faq-header');
    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isOpen = item.classList.contains('open');
            
            // Close all items
            document.querySelectorAll('.faq-item').forEach(faq => {
                faq.classList.remove('open');
            });
            
            // If it wasn't open, open it
            if (!isOpen) {
                item.classList.add('open');
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

    // Events MATRI6 canvases
    initGeoCanvas('eventsGeoCanvasLeft', { fixedPalette: { bg: 'transparent', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });
    initGeoCanvas('eventsGeoCanvasRight', { fixedPalette: { bg: 'transparent', line: '#202123' }, tileSize: 50, linesPerTileHalf: 2 });

    // Blogs & News Media Canvases
    for (let i = 1; i <= 5; i++) {
        initGeoCanvas(`blogsCanvas${i}`, { fixedPalette: { bg: '#202123', line: '#3a3a3a' }, tileSize: 40, linesPerTileHalf: 2 });
        initGeoCanvas(`newsCanvas${i}`, { fixedPalette: { bg: '#ffffff', line: '#202123' }, tileSize: 40, linesPerTileHalf: 2 });
    }

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
        window.addEventListener('scroll', () => {
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
        });
    }

});

// Coming Soon Popup Logic
window.showComingSoonPopup = function(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('comingSoonModal');
    if (modal) modal.classList.add('show');
};

window.closeComingSoonPopup = function() {
    const modal = document.getElementById('comingSoonModal');
    if (modal) modal.classList.remove('show');
};

document.addEventListener('click', function(e) {
    const modal = document.getElementById('comingSoonModal');
    if (modal && e.target === modal) {
        window.closeComingSoonPopup();
    }
});
