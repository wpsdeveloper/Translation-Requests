import {describe, expect, test} from "vitest";
import {getSchoolOptions, formatDate, formatTime, getBadgeClass} from "../client/main.js";

const sampleData = [
  {
    id: 12345657,
    school: "Washington HS",
    status: "Needs Approval",
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
    status: "Scheduled",
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

describe('format dates and times', () => {  
  const date = new Date("2022-12-20T09:27:13.000-05:00");
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

describe('get badge class', () => {
  test('returns correct badge class', () => {
    expect(getBadgeClass("Needs Approval")).toBe("badge-needs-approval"); 
    expect(getBadgeClass("Approved")).toBe("badge-approved");
    expect(getBadgeClass("Scheduled")).toBe("badge-scheduled");
    expect(getBadgeClass("Sent for translation")).toBe("badge-sent-for-translation");
    expect(getBadgeClass("Denied")).toBe("badge-denied");
    expect(getBadgeClass("Completed")).toBe("badge-completed");
    expect(getBadgeClass("Unknown")).toBe("badge"); 
    expect(getBadgeClass("")).toBe("badge"); 
    expect(getBadgeClass()).toBe("badge"); 
  
  })
});