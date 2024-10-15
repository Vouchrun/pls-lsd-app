export const waitForTransactionReceipt = async (web3: any, hash: any) => {
  let receipt = null;
  while (!receipt) {
    try {
      receipt = await web3.eth.getTransactionReceipt(hash);
    } catch (error) {
      // console.error('Error while waiting for transaction receipt:', error);
    }
    if (!receipt) {
      await new Promise((resolve) => setTimeout(resolve, 1_000)); // Wait for 1 second before retrying
    }
  }
  return receipt;
};
