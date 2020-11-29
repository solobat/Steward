import db from '../db/index';

export function list() {
  return db.records.toArray();
}

export function save(record) {
  return db.records.put(record);
}

export function query({ scope, query }) {
  return db.records
    .where({
      scope,
      query,
    })
    .toArray();
}

export function addTimes(result) {
  return db.records.update(result.id, { times: result.times + 1 });
}

export async function log(attrs) {
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
