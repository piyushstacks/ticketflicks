// Test date formatting to verify the fix works correctly
const testDate = "2026-01-28T00:00:00.000Z";

console.log("Original MongoDB date format:", testDate);
console.log("Fixed with toLocaleDateString():", new Date(testDate).toLocaleDateString());
console.log("Previous broken format (split/join):", testDate.split("-").join("/"));

// Test with different date formats
const testDates = [
  "2026-01-28T00:00:00.000Z",
  "2025-12-25",
  "2025-06-15T12:30:00.000Z"
];

console.log("\nTesting different date formats:");
testDates.forEach(date => {
  console.log(`${date} -> ${new Date(date).toLocaleDateString()}`);
});