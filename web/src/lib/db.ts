import Dexie, { Table } from 'dexie';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  isList?: boolean;
  listItems?: string[];
  category?: string;
  reroute?: boolean;
  detectedCategory?: string;
}

export interface CachedScheme {
  id?: number;
  name: string;
  desc: string;
  benefit: string;
  eligibility: string;
  icon: string;
  tags: string[];
}

export interface UserSettings {
  id?: number;
  key: string;
  value: any;
}

export class AshaDatabase extends Dexie {
  chatMessages!: Table<ChatMessage, string>;
  schemes!: Table<CachedScheme, number>;
  settings!: Table<UserSettings, number>;

  constructor() {
    super('AshaDatabase');
    this.version(1).stores({
      chatMessages: 'id, sender, timestamp, category',
      schemes: '++id, name, *tags',
      settings: '++id, key'
    });
  }
}

export const db = new AshaDatabase();
