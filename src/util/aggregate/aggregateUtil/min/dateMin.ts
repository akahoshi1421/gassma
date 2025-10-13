const getDateMin = (dateArray: Date[]) => {
  const dateNumber = dateArray.map((date) => date.getTime());
  const minDateNumber = Math.min(...dateNumber);

  return new Date(minDateNumber);
};

export { getDateMin };
