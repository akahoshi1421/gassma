const getDateMax = (dateArray: Date[]) => {
  const dateNumber = dateArray.map((date) => date.getTime());
  const maxDateNumber = Math.max(...dateNumber);

  return new Date(maxDateNumber);
};

export { getDateMax };
