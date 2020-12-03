import Dexie from 'dexie';

export class StewardDatabase extends Dexie {
  records: Dexie.Table<IRecords, number>;

  constructor() {
    super('steward');

    this.version(1).stores({
      records: '++id,[scope+query],result,mode,times',
    });
  }
}

export interface IRecords {
  id?: number;
  scope: string;
  query: string;
  result: string;
  mode: string;
  times?: number;
}

const db = new StewardDatabase();

export default db;
