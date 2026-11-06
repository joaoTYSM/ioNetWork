function openResults(q) {
  show("results"); $("#q").value = q; $("#rl").innerHTML = "";
  RF2 = makeFeed($("#rl"), $("#rmore"), skRow, row, page => ({q, l: "a", page, x: 1, hs: searches().join("|")}), 6);
  RF2.load();
}
