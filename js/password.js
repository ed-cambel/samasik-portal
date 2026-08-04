(function () {
    const modalHTML = `
        <div id="password-modal-overlay" class="password-modal-overlay">
            <div class="password-modal">
                <h3>Password Required</h3>
                <input type="password" id="password-modal-input" placeholder="Enter password">
                <p id="password-modal-error" class="password-modal-error"></p>
                <div class="password-modal-actions">
                    <button id="password-modal-cancel" type="button">Cancel</button>
                    <button id="password-modal-submit" type="button">Submit</button>
                </div>
            </div>
        </div>
    `;

    const multiLinks = {
        navigation: {
            'passwordone': '/committees/executive.html',
            'passwordtwo': '/committees/edres.html',

        },
        database: {
            'passwordone': 'https://docs.google.com/spreadsheets/d/1Vn3uAOrsyGDzG23gwIJTg79XK6Qa_DUrGgVsIRCURmQ/edit?usp=sharing',      // BA Pysch Students
            'passwordtwo': 'https://docs.google.com/spreadsheets/d/1W9ktP5w-joFy2BeB_xX2V9LnYF5rIiOgxpfpxcd_I-4/edit?usp=sharing',      // Residents
            'passwordthree': 'https://docs.google.com/spreadsheets/d/13UBPlQATxvquySz5-q-KxK_MVix1YKI0cdXuixhJvHI/edit?usp=sharing',    // Alumni
        }
    };

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('password-modal-overlay');
    const input = document.getElementById('password-modal-input');
    const error = document.getElementById('password-modal-error');
    const submitBtn = document.getElementById('password-modal-submit');
    const cancelBtn = document.getElementById('password-modal-cancel');
    let activeLink = null;

    document.querySelectorAll('.password-protected').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            activeLink = this;
            input.value = '';
            error.textContent = '';
            overlay.classList.add('active');
            input.focus();
        });
    });

    function closeModal() {
        overlay.classList.remove('active');
        activeLink = null;
    }

    function submitPassword() {
        const entered = input.value.trim();

        if (activeLink.dataset.multi) {
            const targetUrl = multiLinks[activeLink.dataset.multi][entered];
            if (targetUrl) {
                window.location.href = targetUrl;
            } else {
                error.textContent = 'Incorrect password.';
                input.focus();
            }
        } else {
            if (entered === passwords[activeLink.dataset.url]) {
                window.location.href = activeLink.dataset.url;
            } else {
                error.textContent = 'Incorrect password.';
                input.focus();
            }
        }
    }

    submitBtn.addEventListener('click', submitPassword);
    cancelBtn.addEventListener('click', closeModal);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitPassword();
    });
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
    });
})();