import {describe, expect, test, beforeEach, vi} from "vitest";

const sampleData = [
  {
    school: "Washington HS",
  },
  {
    school: "Lincoln HS",
  },
  {
    school: "Lincoln HS",
  },
];

let getSchoolOptions;
let renderFilterOptions;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '<select id="school-filter"></select>';
  const module = await import("./main.js");
  getSchoolOptions = module.getSchoolOptions;
  renderFilterOptions = module.renderFilterOptions;
});

describe('getSchoolOptions', () => {
  test('returns only all for empty array', () => {
    expect(getSchoolOptions([])).toEqual(['all']);
  });

  test('return All and two schools, no duplicates', () => {
    expect(getSchoolOptions(sampleData)).toEqual(['all', "Lincoln HS", "Washington HS"]);
  });
});

describe('getFilterOptions', () => {
  test('fills the select with only all for empty array', () => {
    renderFilterOptions([]);
    expect(document.getElementById('school-filter').innerHTML).toBe(`<option value="all">All schools</option>`);
  });

  test('fills the select with options', () => {
    renderFilterOptions(sampleData);
    expect(document.getElementById('school-filter').innerHTML).toBe(
      `<option value="all">All schools</option><option value="Lincoln HS">Lincoln HS</option><option value="Washington HS">Washington HS</option>`
    );
  });
});