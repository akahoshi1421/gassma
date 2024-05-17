import { CreateData, CreateManyData } from "../../types/createTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { createFunc } from "./create";

const createManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData
) => {
  const data = createManyData.data;

  data.forEach((oneCreateData) => {
    const create = {
      data: oneCreateData,
    } as CreateData;

    createFunc(gassmaControllerUtil, create);
  });
};

export { createManyFunc };
