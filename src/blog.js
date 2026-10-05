// Topic filter on the blog index
const buttons = document.querySelectorAll(".filter");
const cards = document.querySelectorAll("#post-grid .post-card");
const empty = document.getElementById("blog-empty");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const topic = btn.dataset.filter;
    buttons.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    let shown = 0;
    cards.forEach((card) => {
      const match = topic === "All" || card.dataset.category === topic;
      card.hidden = !match;
      if (match) shown++;
    });
    empty.hidden = shown !== 0;
  });
});
