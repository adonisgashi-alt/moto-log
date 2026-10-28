// "Load more" on the blog index and topic pages.
// The index shows the featured newest post plus 9 in the grid (three full rows of three); a topic page shows its first 9.
// Load more adds 9 at a time, so the grid stays on full rows.
// Topics are separate pages (/blog/<topic>), so the filter links need no script.
// Every post stays in the HTML so crawlers see all the links, and hidden cards never load their images.
const PAGE = 9;
const cards = [...document.querySelectorAll("#post-grid .post-card")].filter((c) => !("featured" in c.dataset));
const more = document.getElementById("load-more");

let limit = PAGE;

const render = () => {
  cards.forEach((c, i) => (c.hidden = i >= limit));
  more.hidden = cards.length <= limit;
};

more.addEventListener("click", () => {
  limit += PAGE;
  render();
});

render();
