// Custom matchers for test
export const expectArrayToEqualIgnoringOrder = (
  actual: any[],
  expected: any[],
) => {
  expect(actual).toHaveLength(expected.length);

  // Sort both arrays by JSON stringifying each object for comparison
  const sortedActual = [...actual].sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b)),
  );
  const sortedExpected = [...expected].sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b)),
  );

  expect(sortedActual).toEqual(sortedExpected);
};
