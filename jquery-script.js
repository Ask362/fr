if (typeof jQuery === 'undefined') {
    console.error('jQuery not loaded');
} else {
    console.log('jQuery loaded, version:', jQuery.fn.jquery);
}

jQuery(document).ready(function ($) {
    console.log('jquery-script.js loaded');

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('Initial cart:', cart);

    function updateCartCount() {
        let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0) || 0;
        $('.cart-count').text(totalItems);
        console.log('Cart count updated:', totalItems);
    }
    updateCartCount();

    $(document).on('click', '.add-to-cart', function (e) {
        e.stopPropagation();
        console.log('Add to cart clicked');
        let productId = parseInt($(this).data('id'));
        let item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity++;
        } else {
            cart.push({ id: productId, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();

        $(this).animate({ opacity: 0.5 }, 200, function () {
            $(this).animate({ opacity: 1 }, 200);
        });
    });

    $(document).on('mouseenter', '.product-card', function () {
        $(this).css('box-shadow', '0 4px 8px rgba(0, 123, 255, 0.3)');
    }).on('mouseleave', '.product-card', function () {
        $(this).css('box-shadow', '0 2px 5px rgba(0, 0, 0, 0.1)');
    });

    $('#search-input').on('keypress', function (e) {
        if (e.which === 13) {
            let query = $(this).val().trim();
            if (query) {
                console.log('Search query:', query);
                window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
            }
        }
    });

    $('.search-icon').on('click', function () {
        let query = $('#search-input').val().trim();
        if (query) {
            console.log('Search query:', query);
            window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
        }
    });
});
