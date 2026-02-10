// ZenTrack - Contact Form Module
// Handle contact form submissions

document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.onsubmit = function (e) {
            e.preventDefault();

            // Get form values
            const name = this.name.value.trim();
            const email = this.email.value.trim();
            const message = this.message.value.trim();

            // Validation
            if (!name || !email || !message) {
                window.zenTrack.showNotification('Please fill in all fields', 'warning');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                window.zenTrack.showNotification('Please enter a valid email address', 'warning');
                return;
            }

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="loading" style="display: inline-block; width: 16px; height: 16px;"></div> Sending...';

            // Compose mailto link
            const subject = encodeURIComponent("ZenTrack Contact Form Submission");
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);

            // Simulate sending delay for better UX
            setTimeout(() => {
                window.location.href = `mailto:kajal2005agarwal@gmail.com?subject=${subject}&body=${body}`;

                const contactResult = document.getElementById('contactResult');
                if (contactResult) {
                    contactResult.innerHTML = `
            <div style="background: #10b981; color: white; padding: 12px; border-radius: 8px; margin-top: 10px; animation: fadeInUp 0.5s;">
              ✅ Thank you for contacting us! Your email client should open now.
            </div>
          `;
                }

                window.zenTrack.showNotification('Message sent successfully!', 'success');
                window.zenTrack.addRecentActivity('Sent contact message');

                // Reset form
                this.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;

                // Clear success message after 5 seconds
                setTimeout(() => {
                    if (contactResult) contactResult.innerHTML = '';
                }, 5000);
            }, 1000);
        };

        // Add input validation feedback
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                if (this.value.trim() === '' && this.hasAttribute('required')) {
                    this.style.borderColor = '#ef4444';
                } else {
                    this.style.borderColor = '';
                }
            });

            input.addEventListener('focus', function () {
                this.style.borderColor = '';
            });
        });
    }
});
