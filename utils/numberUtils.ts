export function formatNumber(
  num: string | number | undefined,
  options: {
    decimals?: number;
    fixedDecimals?: boolean;
    withSplit?: boolean;
    toReadable?: boolean;
    roundMode?: "round" | "floor" | "ceil";
    prefix?: string;
    hideDecimalsForZero?: boolean;
  } = {}
) {
  if (num === undefined || num === "") {
    return "--";
  }
  if (isNaN(Number(num))) {
    return "--";
  }

  let decimals = options.decimals === undefined ? 6 : options.decimals;
  const withSplit = options.withSplit === undefined ? true : options.withSplit;
  const fixedDecimals =
    options.fixedDecimals === undefined ? true : options.fixedDecimals;
  const toReadable =
    options.toReadable === undefined ? true : options.toReadable;
  const roundMode = options.roundMode || "floor";
  const hideDecimalsForZero = !!options.hideDecimalsForZero;
  let suffix = "";

  if (hideDecimalsForZero && Number(num) === 0) {
    return "0";
  }

  let newNum = "0";
  if (toReadable && Number(num) >= 1000000000) {
    newNum = Number(num) / 1000000000 + "";
    suffix = "B";
    decimals = 3;
  } else if (toReadable && Number(num) >= 1000000) {
    newNum = Number(num) / 1000000 + "";
    suffix = "M";
    decimals = 3;
  } else if (toReadable && Number(num) >= 1000) {
    newNum = Number(num) / 1000 + "";
    suffix = "K";
    decimals = 3;
  } else {
    newNum = num + "";
  }

  const roundMethod =
    roundMode === "floor"
      ? Math.floor
      : roundMode === "ceil"
      ? Math.ceil
      : Math.round;

  newNum =
    roundMethod(Number(newNum) * Math.pow(10, decimals)) /
      Math.pow(10, decimals) +
    "";

  if (fixedDecimals) {
    newNum = Number(newNum).toFixed(decimals);
  }

  if (Number(newNum) === 0 && Number(num) > 0) {
    newNum = `<${options.prefix || ""}${1.0 / Math.pow(10, decimals)}`;
  } else {
    newNum = (options.prefix || "") + newNum;
  }

  if (withSplit) {
    var parts = newNum.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    newNum = parts.join(".") + suffix;
  } else {
    newNum = newNum + suffix;
  }

  return newNum;
}

export function formatLargeAmount(amount: string | number) {
  if (!isNaN(Number(amount)) && Number(amount) > 1000) {
    return formatNumber(amount, { decimals: 2 });
  }
  return formatNumber(amount, { decimals: 4 });
}

export function chainAmountToHuman(num: string | number) {
  if (num === "" || num === undefined || num === null || isNaN(Number(num))) {
    return "--";
  }
  const factor = "1000000000000000000";

  return Number(num) / Number(factor) + "";
}

export function formatScientificNumber(n: number | string) {
  return n.toLocaleString("fullwide", { useGrouping: false });
}
