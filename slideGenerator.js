
/**
 * Generate an HTML slide from a structured specification.
 * @param {Object} spec - Slide specification from Setup Agent
 * @param {string} spec.slideTitle
 * @param {string} [spec.sectionTitle]
 * @param {string} [spec.slideType]
 * @param {string[]} [spec.contentPoints]
 * @param {string[]} [spec.images] - Paths to user uploaded images
 * @param {Object} [spec.charts] - Chart.js configuration { type, labels, datasets }
 * @returns {string} HTML string
 */
function generateHtmlSlide(spec = {}) {
  const {
    slideTitle = '',
    sectionTitle = '',
    slideType = 'content',
    contentPoints = [],
    images = [],
    charts = null,
  } = spec;

  const chartId = charts ? `chart_${Date.now()}_${Math.random().toString(36).slice(2,8)}` : null;

  const listHtml = contentPoints.length
    ? `<ul class="list-disc pl-6 space-y-2 mt-4">${contentPoints
        .map(pt => `<li>${pt}</li>`)
        .join('')}</ul>`
    : '';

  const imagesHtml = images
    .map(img => `<img src="${img}" class="my-4 max-h-64 mx-auto" />`)
    .join('');

  const chartHtml = charts
    ? `<div class="h-64 mt-6"><canvas id="${chartId}"></canvas></div>
<script>
(() => {
  const ctx = document.getElementById('${chartId}').getContext('2d');
  new Chart(ctx, {
    type: '${charts.type}',
    data: {
      labels: ${JSON.stringify(charts.labels)},
      datasets: ${JSON.stringify(charts.datasets)},
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#fff' } } },
      scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } }
    }
  });
})();
</script>`
    : '';

  const stripes = `<div class="adidas-stripes p-4">
  <div class="stripe"></div>
  <div class="stripe"></div>
  <div class="stripe"></div>
</div>`;

  const html = `<div class="slide-container relative">
  <img src="/slidex-logo.svg" alt="Logo" class="w-24 absolute top-4 left-4" />
  <div class="slide-content">
    <h2 class="text-4xl mb-2">${slideTitle}</h2>
    ${sectionTitle ? `<h3 class="text-xl text-secondary mb-4">${sectionTitle}</h3>` : ''}
    ${listHtml}
    ${imagesHtml}
    ${chartHtml}
  </div>
  ${stripes}
</div>`;

  return html;
}

module.exports = { generateHtmlSlide };
