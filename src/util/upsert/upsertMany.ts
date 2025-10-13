import type { CreateData } from "../../types/createTypes";
import type {
  FindData,
  UpdateData,
  UpsertData,
  UpsertManyReturn,
} from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { createFunc } from "../create/create";
import { findFirstFunc } from "../find/findFirst";
import { updateManyFunc } from "../update/updateMany";

const upsertManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  upsertData: UpsertData,
): UpsertManyReturn => {
  const findData: FindData = {
    where: upsertData.where,
  };

  const findResult = findFirstFunc(gassmaControllerUtil, findData);

  if (!findResult) {
    const newData: CreateData = {
      data: upsertData.create,
    };

    createFunc(gassmaControllerUtil, newData);

    return { count: 1 };
  }

  const updateData: UpdateData = {
    where: upsertData.where,
    data: upsertData.update,
  };

  return updateManyFunc(gassmaControllerUtil, updateData);
};

export { upsertManyFunc };
