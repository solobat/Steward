import Dexie from 'dexie';

const db: any = new Dexie('steward');

/**
 * cid: plugin/website.. id
 * result: Some text you can customize
 */
db.version(1).stores({
  records: '++id,[scope+query],result,mode'
});

export default db;