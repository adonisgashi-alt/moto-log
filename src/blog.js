// Topic filter on the blog index.
// "All" shows the featured newest post above a grid of the rest. Picking a topic hides the featured block and lists every
// matching post in one grid, newest first, so the results sit right under the (sticky) filter bar.
const buttons = document.querySelectorAll(".filter");
const cards = document.querySelectorAll("#post-grid .post-card");
const feature = document.getElementById("blog-feature");
const heading = document.getElementById("blog-heading");
const empty = document.getElementById("blog-empty");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const topic = btn.dataset.filter;
    const all = topic === "All";
    buttons.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    feature.hidden = !all;
    heading.textContent = all ? "Latest insights and trends" : topic;
    let shown = 0;
    cards.forEach((card) => {
      const match = all ? !("featured" in card.dataset) : card.dataset.category === topic;
      card.hidden = !match;
      if (match) shown++;
    });
    empty.hidden = shown !== 0;
  });
});
