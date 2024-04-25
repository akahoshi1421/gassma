import { CreateData } from "../../types/createTypes";
import { FindData, UpdateData, UpsertData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { createFunc } from "../create/create";
import { findFirstFunc } from "../find/findFirst";
import { updateManyFunc } from "../update/updateMany";

const upsertFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  upsertData: UpsertData
) => {
  const findData = {
    where: upsertData.where,
  } as FindData;

  const findResult = findFirstFunc(gassmaControllerUtil, findData);

  if (!findResult) {
    const newData = {
      data: upsertData.create,
    } as CreateData;

    createFunc(gassmaControllerUtil, newData);
    return;
  }

  const updateData = {
    where: upsertData.where,
    data: upsertData.update,
  } as UpdateData;

  updateManyFunc(gassmaControllerUtil, updateData);
};

export { upsertFunc };
