/**
 * (c) Copyright 2011 Caroline Schnapp.
 * All Rights Reserved. Contact: mllegeorgesand@gmail.com
 * See http://wiki.shopify.com/Linked_Options
 */
(function(Shopify) {

  Shopify.optionsMap = {};

  Shopify.updateOptionsInSelector = function(selectorIndex) {

    switch (selectorIndex) {
      case 0:
        var key = 'root';
        var selector = jQuery('.single-option-selector:eq(0)');
        break;
      case 1:
        var key = jQuery('.single-option-selector:eq(0)').val();
        var selector = jQuery('.single-option-selector:eq(1)');
        break;
      case 2:
        var key = jQuery('.single-option-selector:eq(0)').val();
        key += ' / ' + jQuery('.single-option-selector:eq(1)').val();
        var selector = jQuery('.single-option-selector:eq(2)');
    }

    var initialValue = selector.val();
    selector.empty();
    var availableOptions = Shopify.optionsMap[key];
    for (var i=0; i<availableOptions.length; i++) {
      var option = availableOptions[i];
      var newOption = jQuery('<option></option>').val(option).html(option);
      selector.append(newOption);
    }
    if (jQuery.inArray(initialValue, availableOptions) !== -1) {
      selector.val(initialValue);
    }
    selector.trigger('change');

  };

  Shopify.linkOptionSelectors = function(product) {
    // Building our mapping object.
    for (var i=0; i<product.variants.length; i++) {
      var variant = product.variants[i];
      if (variant.available) {
        // Gathering values for the 1st drop-down.
        Shopify.optionsMap['root'] = Shopify.optionsMap['root'] || [];
        Shopify.optionsMap['root'].push(variant.option1);
        Shopify.optionsMap['root'] = Shopify.uniq(Shopify.optionsMap['root']);
        // Gathering values for the 2nd drop-down.
        if (product.options.length > 1) {
          var key = variant.option1;
          Shopify.optionsMap[key] = Shopify.optionsMap[key] || [];
          Shopify.optionsMap[key].push(variant.option2);
          Shopify.optionsMap[key] = Shopify.uniq(Shopify.optionsMap[key]);
        }
        // Gathering values for the 3rd drop-down.
        if (product.options.length === 3) {
          var key = variant.option1 + ' / ' + variant.option2;
          Shopify.optionsMap[key] = Shopify.optionsMap[key] || [];
          Shopify.optionsMap[key].push(variant.option3);
          Shopify.optionsMap[key] = Shopify.uniq(Shopify.optionsMap[key]);
        }
      }
    }

    // Update options right away.
    Shopify.updateOptionsInSelector(0);
    if (product.options.length > 1) Shopify.updateOptionsInSelector(1);
    if (product.options.length === 3) Shopify.updateOptionsInSelector(2);

    // When there is an update in the first dropdown.
    jQuery(".single-option-selector:eq(0)").change(function() {
      Shopify.updateOptionsInSelector(1);
      if (product.options.length === 3) Shopify.updateOptionsInSelector(2);
      return true;
    });

    // When there is an update in the second dropdown.
    jQuery(".single-option-selector:eq(1)").change(function() {
      if (product.options.length === 3) Shopify.updateOptionsInSelector(2);
      return true;
    });

  };

}(Shopify || {}));

/**
 * (c) Gavin Ballard
 * Bootstrap for Shopify
 */
(function(Shopify) {

  var BS4SF = Shopify.BS4SF || {};

  /**
   * Set up a Shopify product page to use the linked option selectors.
   *
   * @param product
   * @param options
   */
  BS4SF.setupProductPage = function(product, options) {
    // Don't bother setting up if we only have a single variant.
    if(product.variants.length < 2) {
      return;
    }

    // Get jQuery references to elements on the page.
    var $add = $('#product-add'),
        $price = $('#product-price');

    // Instantiate the OptionSelectors Javascript, and create a variant selected callback.
    new Shopify.OptionSelectors("product-select", { product: product, onVariantSelected: function(variant, selector) {
      // Variant doesn't exist or it's not available.
      if(!variant || !variant.available) {
        $add.prop('disabled', true).addClass('disabled');
        $price.html(variant ? 'Sold Out' : 'Currently Unavailable');
        return;
      }

      // Variant exists - enable the "Add to Cart" button and update the price.
      $add.prop('disabled', false).removeClass('disabled');

      // Instantiate the HTML
      var html = '';

      // Add Compare At price if present.
      if(variant.compare_at_price_max > variant.price) {
        html += '<del>' + Shopify.formatMoney(variant.compare_at_price_max, options.money_with_currency_format) + '</del> ';
      }

      // Add the actual price!
      html += Shopify.formatMoney(variant.price, options.money_with_currency_format);

      // Add the SALE tag if relevant.
      if(options.show_sale_tag && variant.compare_at_price_max > variant.price) {
        html += ' <span class="label label-success">SALE</span>';
      }

      // Update the price element and return.
      $price.html(html);
    }});

    // Link options if there's more than one option.
    if(product.options.length > 1) {
      Shopify.linkOptionSelectors(product);
    }
  };

  // Override the buildSelectors() method on the Shopify OptionSelectors object.
  // This is done so that Bootstrap 3 form classes are added to any dynamically
  // generated variant dropdowns.
  if(Shopify.OptionSelectors) {
    var oldBuildSelectors = Shopify.OptionSelectors.prototype.buildSelectors;
    Shopify.OptionSelectors.prototype.buildSelectors = function() {
      this.selectorDivClass = 'form-group';
      this.selectorClass = 'single-option-selector form-control';
      return oldBuildSelectors.call(this);
    };
  }

  // Augment the Shopify Module.
  Shopify.BS4SF = BS4SF;

}(Shopify || {}));

