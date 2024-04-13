type FindData = {
  where: {
    [key: string]: any;
  };
};

type UpdateData = {
  where: {
    [key: string]: any;
  };
  data: {
    [key: string]: any;
  };
};

type DeleteData = FindData;

export { FindData, UpdateData, DeleteData };
