type FindData = {
  where: {
    [key: string]: any;
  };
  select?: {
    [key: string]: true;
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

type UpsertData = {
  where: {
    [key: string]: any;
  };
  update: {
    [key: string]: any;
  };
  create: {
    [key: string]: any;
  };
};

type DeleteData = FindData;

export { FindData, UpdateData, DeleteData, UpsertData };
