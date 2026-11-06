(async () => {
  await loadViews();
  bindChrome();
  bindHome();
  bindShorts();
  route();
  endIntro();
})();
