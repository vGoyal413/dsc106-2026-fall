import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectGrid = document.querySelector('.projects');
const pageHeading = document.querySelector('.projects-title');
pageHeading.textContent = `${projects.length} Projects`;

let arcMaker = d3.arc().innerRadius(0).outerRadius(50);
let colorScale = d3.scaleOrdinal(d3.schemeTableau10);

let searchText = '';
let activeYear = null;

function applyFilters() {
  let matchingSearch = projects.filter((project) => {
    let allText = Object.values(project).join('\n').toLowerCase();
    return allText.includes(searchText.toLowerCase());
  });
  if (activeYear !== null && !matchingSearch.some((p) => p.year === activeYear)) {
    activeYear = null;
  }

  let shownProjects =
    activeYear === null
      ? matchingSearch
      : matchingSearch.filter((p) => p.year === activeYear);

  renderProjects(shownProjects, projectGrid, 'h2');

  drawPie(matchingSearch);
}

function handleYearClick(year) {
  activeYear = activeYear === year ? null : year;
  applyFilters();
}

function drawPie(projectList) {
  let yearCounts = d3.rollups(
    projectList,
    (group) => group.length,
    (p) => p.year,
  );
  let pieData = yearCounts.map(([year, count]) => {
    return { value: count, label: year };
  });

  let pieLayout = d3.pie().value((d) => d.value);
  let slices = pieLayout(pieData);

  let pieSvg = d3.select('#projects-pie-plot');
  pieSvg.selectAll('path').remove();
  let legendList = d3.select('.legend');
  legendList.selectAll('li').remove();

  slices.forEach((slice) => {
    pieSvg
      .append('path')
      .attr('d', arcMaker(slice))
      .attr('fill', colorScale(slice.data.label))
      .attr('class', slice.data.label === activeYear ? 'selected' : '')
      .on('click', () => handleYearClick(slice.data.label));
  });

  pieData.forEach((entry) => {
    legendList
      .append('li')
      .attr('style', `--color:${colorScale(entry.label)}`)
      .attr('class', entry.label === activeYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${entry.label} <em>(${entry.value})</em>`)
      .on('click', () => handleYearClick(entry.label));
  });
}

let searchBox = document.querySelector('.searchBar');
searchBox.addEventListener('input', (event) => {
  searchText = event.target.value;
  applyFilters();
});

applyFilters();