import {describe, expect, test} from "vitest";
import {getSchoolOptions, renderTableRows, formatDate, formatTime} from "./main.js";

const sampleData = [
  {
    id: 12345657,
    school: "Washington HS",
    status: "Pending",
    requestDate: new Date("2023/01/01"),
    startTime: new Date("09:00:00"),
    endTime: new Date("10:00:00"),
    submittedDate: new Date("2022-12-20T09:27:13.000-04:00"),
    reqType: "Interpretation",
    name: "John Doe",
  },
  {
    id: 12345658,
    school: "Lincoln HS",
    status: "In Progress",
    requestDate: new Date("2023/01/02"),
    startTime: new Date("09:00:00"),
    endTime: new Date("10:00:00"),
    submittedDate: new Date("2022-12-10T09:27:13.000-04:00"),
    reqType: "Translation",
    name: "Jane Smith",
  },
  {
    id: 12345659,
    school: "Lincoln HS",
    status: "Completed", 
    requestDate: new Date("2023/01/03"),
    startTime: new Date("09:00:00"),
    endTime: new Date("10:00:00"),
    submittedDate: new Date("2022-12-11T09:27:13.000-04:00"),
    reqType: "Interpretation",
    name: "Bob Johnson",
  },
];

describe('getSchoolOptions', () => {
  test('returns only all for empty array', () => {
    expect(getSchoolOptions([])).toEqual(['all']);
  });

  test('return All and two schools, no duplicates', () => {
    expect(getSchoolOptions(sampleData)).toEqual(['all', "Lincoln HS", "Washington HS"]);
  });
});

// describe('renderTableRows', () => {
//   test('blank for empty array', () => {
//     expect(renderTableRows([])).toBe("");
//   });

//   test('creates rows', () => {
//     expect(renderTableRows(sampleData)).toBe(
//       `<tr data-id="12345657" class="">
//         <td><span class="badge badge-pending">Pending</span></td>
//         <td>1/1/2023</td>
//         <td>12/20/2022</td>
//         <td>Interpretation</td>
//         <td>John Doe</td>
//       </tr><tr data-id="12345658" class="">
//         <td><span class="badge badge-in-progress">In Progress</span></td>
//         <td>1/2/2023</td>
//         <td>12/10/2022</td>
//         <td>Translation</td>
//         <td>Jane Smith</td>
//       </tr><tr data-id="12345659" class="">
//         <td><span class="badge badge-completed">Completed</span></td>
//         <td>1/3/2023</td>
//         <td>12/11/2022</td>
//         <td>Interpretation</td>
//         <td>Bob Johnson</td>
//       </tr>`
//     );
//   });
// });

describe('format dates and times', () => {  
  const date = new Date("2022-12-20T09:27:13.000-05:00");
  console.log("time:", date.toLocaleTimeString);
  test('formats date', () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("2023/01/01")).toBe("");
    expect(formatDate(date, "MMM D, YYYY")).toBe("Dec 20, 2022");
  });
  test('formats time', () => {
    expect(formatTime("")).toBe("");
    expect(formatTime("09:00:00")).toBe("");
    expect(formatTime(date, "h:mm A")).toBe("9:27 AM");
  });
});