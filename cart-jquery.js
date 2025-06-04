$(document).ready(function () {
    // Animation for cart items, address inputs, and payment inputs
    $('.cart-item, .address-input, .payment-input').hide().fadeIn(1000);

    // Hover effects for cart items and summary card
    $(document).on('mouseenter', '.cart-item, .summary-card', function () {
        $(this).css('box-shadow', '0 4px 8px rgba(0, 123, 255, 0.3)');
    }).on('mouseleave', '.cart-item, .summary-card', function () {
        $(this).css('box-shadow', 'none');
    });

    // Animation on quantity, address, and payment input changes
    $(document).on('change', '.quantity-input, .address-input, .payment-input', function () {
        $(this).closest('.cart-item, .summary-card').animate({ opacity: 0.5 }, 200, function () {
            $(this).animate({ opacity: 1 }, 200);
        });
    });

    // Animation on remove item
    $(document).on('click', '.remove-item', function () {
        let $item = $(this).closest('.cart-item');
        $item.slideUp(300, function () {
            // Removal handled by displayCart
        });
    });

    // Animation on checkout button
    $('#checkout-btn').on('click', function () {
        $(this).animate({ opacity: 0.7 }, 100, function () {
            $(this).animate({ opacity: 1 }, 100);
        });
    });

    // Animation on apply promocode button
    $('#apply-promocode').on('click', function () {
        $(this).animate({ opacity: 0.7 }, 100, function () {
            $(this).animate({ opacity: 1 }, 100);
        });
    });

    // Switch for button styling
    function applyButtonStyle(action) {
        let style;
        switch (action) {
            case 'checkout':
            case 'apply-promocode':
                style = { 'background-color': '#007bff', 'color': '#fff' };
                break;
            case 'remove':
                style = { 'background-color': '#dc3545', 'color': '#fff' };
                break;
            default:
                style = { 'background-color': '#6c757d', 'color': '#fff' };
        }
        return style;
    }

    $('#checkout-btn, #apply-promocode').css(applyButtonStyle('checkout'));
    $('.remove-item').css(applyButtonStyle('remove'));
});
