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

    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwNs5wU70tvM4tEtyPhr-1C0Z4c1t0PL-JTIIwLAnhIbpF7Ja3c_zkkMOmxnWsN8CZkMQ/exec"; // ends in /exec

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

    async function submitPassword() {
        const entered = input.value.trim();
        const category = activeLink.dataset.multi;

        if (!category) {
            error.textContent = 'This link is not configured correctly.';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Checking...';

        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ password: entered, category })
            });
            const data = await res.json();

            if (data.success) {
                window.location.href = data.url;
            } else {
                error.textContent = 'Incorrect password.';
                input.focus();
            }
        } catch (err) {
            error.textContent = 'Something went wrong. Please try again.';
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
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