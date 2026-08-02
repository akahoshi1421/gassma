const getDateMax = (dateArray: Date[]) => {
  const maxDateNumber = dateArray.reduce(
    (max, date) => Math.max(max, date.getTime()),
    Number.NEGATIVE_INFINITY,
  );

  return new Date(maxDateNumber);
};

export { getDateMax };
