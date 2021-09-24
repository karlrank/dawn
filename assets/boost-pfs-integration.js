var boostPFSIntegrationTemplate = {
  compileTemplate: {
    reviews: "var itemReviewsHtml = '<span class=\"shopify-product-reviews-badge\" data-id=\"' + data.id + '\"></span>';itemHtml = itemHtml.replace(/{{itemReviews}}/g, itemReviewsHtml);"
  },
  call3rdFunction: {
    reviews: "if (window.SPR) {  window.SPR.initDomEls();  window.SPR.loadBadges();}"
  }
};