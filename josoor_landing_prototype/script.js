document.addEventListener('DOMContentLoaded', () => {
    
    // --- Carousel Logic ---
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    const slideInterval = 5000; // 5 seconds

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    // Auto-advance
    let carouselTimer = setInterval(nextSlide, slideInterval);

    // Optional: Pause on hover
    const carouselContainer = document.querySelector('.carousel-container');
    carouselContainer.addEventListener('mouseenter', () => {
        clearInterval(carouselTimer);
    });

    carouselContainer.addEventListener('mouseleave', () => {
        carouselTimer = setInterval(nextSlide, slideInterval);
    });


    // --- Scroll Indicators ---
    const scrollArrow = document.querySelector('.scroll-indicator');
    scrollArrow.addEventListener('click', () => {
        document.getElementById('insight').scrollIntoView({ behavior: 'smooth' });
    });

    // --- Entrance Animations (Simple Observer) ---
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Add 'fade-in-up' class to elements you want to animate on scroll
    // (You can add these classes to HTML elements if you want scroll animations)

});
