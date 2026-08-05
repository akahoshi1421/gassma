let transactionInProgress = false;

const isTransactionInProgress = (): boolean => transactionInProgress;

const setTransactionInProgress = (value: boolean): void => {
  transactionInProgress = value;
};

export { isTransactionInProgress, setTransactionInProgress };
