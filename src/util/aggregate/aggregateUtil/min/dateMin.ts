const getDateMin = (dateArray: Date[]) => {
  const minDateNumber = dateArray.reduce(
    (min, date) => Math.min(min, date.getTime()),
    Number.POSITIVE_INFINITY,
  );

  return new Date(minDateNumber);
};

export { getDateMin };
