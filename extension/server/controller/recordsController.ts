import db, { IRecords } from '../db/index';

export function list() {
  return db.records.toArray();
}

export function save(record: IRecords) {
  return db.records.put(record);
}

export function query(filter: { scope: string, query: string }) {
  const { scope, query } = filter;

  return db.records
    .where({
      scope,
      query,
    })
    .toArray();
}

export function addTimes(result: IRecords) {
  return db.records.update(result.id, { times: result.times + 1 });
}

export async function log(attrs: IRecords) {
  const { scope, query, result } = attrs;
  const resp = await db.records.get({
    scope,
    query,
    result,
  });

  if (resp) {
    return addTimes(resp);
  } else {
    return save({
      ...attrs,
      times: 1,
    });
  }
}
