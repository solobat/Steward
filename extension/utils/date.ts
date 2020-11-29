export function format(date = new Date()) {
  const ret = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join(
    '-',
  );

  return ret;
}

export function isNewDate(date, last) {
  return format(date) !== format(last);
}
