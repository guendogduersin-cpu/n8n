// Initialize showcase animation
function initShowcaseAnimation() {
    const showcaseCards = document.querySelectorAll('.showcase-card');

    showcaseCards.forEach((card, cardIndex) => {
        const images = card.querySelectorAll('.showcase-img');
        let currentIndex = 0;

        // Stagger the start time for each card
        setTimeout(() => {
            setInterval(() => {
                // Hide current image
                images[currentIndex].classList.remove('active');

                // Move to next image
                currentIndex = (currentIndex + 1) % images.length;

                // Show next image
                images[currentIndex].classList.add('active');
            }, 1000); // Change every 1 second
        }, cardIndex * 333); // Offset each card by 333ms for visual interest
    });
}

// Start animation when page loads
document.addEventListener('DOMContentLoaded', initShowcaseAnimation);
