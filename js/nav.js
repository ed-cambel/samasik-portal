document.body.insertAdjacentHTML('afterbegin', `
    <nav class="navbar">
        <div class="nav-container">
            <a href="#top" class="nav-org">
                <img src="/assets/images/logo_white.png" class="nav-logo">
                <span class="nav-org-name">Samahang Sikolohiya</span>
            </a>
    
            <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false">
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
            </button>
    
            <ul class="nav-links" id="navLinks">
                <li class="drawer-header">
                    <span class="drawer-title">Menu</span>
                    <button class="drawer-close" id="drawerClose" aria-label="Close menu">&times;</button>
                </li>
    
                <li><a href="/index.html" class="nav-link">Home</a></li>
                <li><a href="/about.html" class="nav-link">About</a></li>
                <li><a href="/database.html" class="nav-link">Database</a></li>
    
                <li class="dropdown">
                    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">
                        Committees <span class="arrow">▼</span>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a href="/committees/executive-comm.html">Executive Committee</a></li>
                        <li><a href="/committees/edres-comm.html">Lupon ng Edukasyon at Pananaliksik</a></li>
                        <li><a href="/committees/eventslogs-comm.html">Lupon ng Kaganapan at Pagtustos</a></li>
                        <li><a href="/committees/creatives-comm.html">Lupon ng Sining at Paglikha</a></li>
                        <li><a href="/committees/pubs-comm.html">Lupon ng Lathalain</a></li>
                        <li><a href="/committees/sec-comm.html">Lupon ng Kahiliman</a></li>
                        <li><a href="/committees/finance-comm.html">Lupon ng Salapi</a></li>
                    </ul>
                </li>
    
                <li class="dropdown">
                    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">
                        Inventory <span class="arrow">▼</span>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a href="/inventory.html">Borrowing Instructions</a></li>
                        <li><a href="/inventory.html">Inventory Sheet</a></li>
                        <li><a href="/inventory.html">Downloadable Forms</a></li>
                    </ul>
                </li>
            </ul>
    
            <div class="nav-backdrop" id="navBackdrop"></div>
        </div>
    </nav>
    `);

document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const drawerClose = document.getElementById('drawerClose');
    const navLinks = document.getElementById('navLinks');
    const navBackdrop = document.getElementById('navBackdrop');
    const dropdowns = document.querySelectorAll('.dropdown');

    // open menu
    function openMenu() {
        navLinks.classList.add('open');
        navBackdrop.classList.add('active');
        navToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    // close menu
    function closeMenu() {
        navLinks.classList.remove('open');
        navBackdrop.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    function closeAllDropdowns() {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
            const toggleBtn = dropdown.querySelector('.dropdown-toggle');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        });
    }

    navToggle.addEventListener('click', openMenu);
    drawerClose.addEventListener('click', closeMenu);
    navBackdrop.addEventListener('click', closeMenu);

    // close menu on esc key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
            closeMenu();
        }
    });

    // mobile dropdown
    dropdowns.forEach(dropdown => {
        const toggleBtn = dropdown.querySelector('.dropdown-toggle');

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents click from immediately bubbling to the document
            const isOpen = dropdown.classList.contains('open');

            closeAllDropdowns(); // Closes other open dropdowns

            if (!isOpen) {
                dropdown.classList.add('open');
                toggleBtn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    document.addEventListener('click', (e) => {
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
                const toggleBtn = dropdown.querySelector('.dropdown-toggle');
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    document.querySelectorAll('.nav-link, .dropdown-menu a').forEach(link => {
        const linkPath = new URL(link.href).pathname;
        const currentPath = window.location.pathname;

        if (linkPath === currentPath || (linkPath === '/index.html' && currentPath === '/')) {
            link.classList.add('active');
        }
    });
});