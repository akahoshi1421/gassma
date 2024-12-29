import { CreateData } from "../../types/createTypes";
import {
  FindData,
  UpdateData,
  UpsertData,
  UpsertManyReturn,
} from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { createFunc } from "../create/create";
import { findFirstFunc } from "../find/findFirst";
import { updateManyFunc } from "../update/updateMany";

const upsertManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  upsertData: UpsertData
): UpsertManyReturn => {
  const findData = {
    where: upsertData.where,
  } as FindData;

  const findResult = findFirstFunc(gassmaControllerUtil, findData);

  if (!findResult) {
    const newData = {
      data: upsertData.create,
    } as CreateData;

    createFunc(gassmaControllerUtil, newData);

    return { count: 1 };
  }

  const updateData = {
    where: upsertData.where,
    data: upsertData.update,
  } as UpdateData;

  return updateManyFunc(gassmaControllerUtil, updateData);
};

export { upsertManyFunc };
