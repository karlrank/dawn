// Override Settings
var boostPFSInstantSearchConfig = {
	search: {
		//suggestionMode: 'test',
		//suggestionPosition: 'left'
	},
    general:{
      useShopifyRouteForMultiLanguageURL: true
    }
};

(function() {
	BoostPFS.inject(this);

	// Customize style of Suggestion box
	SearchInput.prototype.customizeInstantSearch = function() {};

	SearchInput.prototype.afterBindEvents = function() {
		// Fix cannot close search suggestion when clicking overlay 
		document.addEventListener('click', function(e) {
			if(this.searchAutoComplete && this.searchAutoComplete.isOpen && e && e.target) {
				var $clickedElement = jQ(e.target);
				var isClickSuggestion = $clickedElement.closest('.' + Class.searchSuggestionWrapper).length > 0;
				if (isClickSuggestion) {
					this.searchAutoComplete.$element.hide();
					this.searchAutoComplete.searchInput.onCloseAutocomplete();
					this.searchAutoComplete.isOpen = false;
				}
			}
		}.bind(this), true);
	}
    
    Utils.reBuildUrlBaseOnLocale = (url) => {
      // remove http or https
      url = url.replace('https://', '').replace('http://', '');

      // Rebuild URL based on Shopify's routes object
      var hasShopifyRoutes = Shopify && Shopify.routes && typeof Shopify.routes.root != 'undefined';
      if (Settings.getSettingValue('general.useShopifyRouteForMultiLanguageURL') && hasShopifyRoutes) {
        return Shopify.routes.root.replace(/\/$/, '') + url;

        // Rebuild URL based on published locales
      } else {
        var currentLocale = Settings.getSettingValue('general.current_locale');
        var publishedLocales = Settings.getSettingValue('general.published_locales');
        var publishedLocaleKeys = Object.keys(publishedLocales);
        var currentLocaleIndex = publishedLocaleKeys.indexOf(currentLocale);

        // If the locale isnt in the published list, or is default locale, return the normal url
        if (currentLocaleIndex < 0 || publishedLocales[currentLocale] == true) return url;

        var urlArr = url.split('/');
        if (urlArr.length > 1 && publishedLocaleKeys.length && currentLocale.length) {
          var isUrlHasLocaleString = publishedLocaleKeys.indexOf(urlArr[1]) > -1;
          if (isUrlHasLocaleString) {
            urlArr[1] = currentLocale;
          } else {
            urlArr.splice(1, 0, currentLocale);
          }
        }
        return urlArr.join('/');
      }
    }
})();