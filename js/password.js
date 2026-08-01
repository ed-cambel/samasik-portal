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
        student: {
            'passwordone': 'https://docs.google.com/document/d/1q6IlU97SQAzOEch1CoJWpQ1wY4P3g2DwzHBA7GknMhU/edit?tab=t.jo819iz6j5l4',
            'passwordtwo': 'https://www.canva.com/design/DAHNjQvNu1g/bLLjXDnaURxsmCM7tKP9Vw/edit',
        },
        resident: {
            'passwordone': 'https://docs.google.com/document/d/1q6IlU97SQAzOEch1CoJWpQ1wY4P3g2DwzHBA7GknMhU/edit?tab=t.jo819iz6j5l4',
            'passwordtwo': 'https://www.canva.com/design/DAHNjQvNu1g/bLLjXDnaURxsmCM7tKP9Vw/edit',
        },
        alumni: {
            'passwordone': 'https://docs.google.com/document/d/1q6IlU97SQAzOEch1CoJWpQ1wY4P3g2DwzHBA7GknMhU/edit?tab=t.jo819iz6j5l4',
            'passwordtwo': 'https://www.canva.com/design/DAHNjQvNu1g/bLLjXDnaURxsmCM7tKP9Vw/edit',
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