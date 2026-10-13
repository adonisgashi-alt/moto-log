// Topic filter and "Load more" on the blog index.
// "All" shows the featured newest post plus 9 in the grid (three full rows of three); a topic shows its first 9 matches.
// Load more adds 9 at a time, so the grid stays on full rows.
// Every post stays in the HTML so crawlers see all the links, and hidden cards never load their images.
const PAGE = 9;
const buttons = document.querySelectorAll(".filter");
const cards = [...document.querySelectorAll("#post-grid .post-card")];
const feature = document.getElementById("blog-feature");
const heading = document.getElementById("blog-heading");
const empty = document.getElementById("blog-empty");
const more = document.getElementById("load-more");

let topic = "All";
let limit = PAGE;

const render = () => {
  const all = topic === "All";
  const matches = cards.filter((c) => (all ? !("featured" in c.dataset) : c.dataset.category === topic));
  matches.forEach((c, i) => (c.hidden = i >= limit));
  cards.filter((c) => !matches.includes(c)).forEach((c) => (c.hidden = true));
  feature.hidden = !all;
  heading.textContent = all ? "Latest insights and trends" : topic;
  empty.hidden = matches.length !== 0;
  more.hidden = matches.length <= limit;
};

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    topic = btn.dataset.filter;
    limit = PAGE;
    buttons.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    render();
  });
});

more.addEventListener("click", () => {
  limit += PAGE;
  render();
});

render();
