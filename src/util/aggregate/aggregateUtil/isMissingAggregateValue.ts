import { isMissingValue } from "../../other/isMissingValue";

// SQL の集計が NULL を無視するのに合わせた欠損判定
const isMissingAggregateValue = isMissingValue;

export { isMissingAggregateValue };
