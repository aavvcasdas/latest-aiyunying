import catalog from './catalog.json';

export type Character = (typeof catalog.characters)[number];
export type Action = Character['actions'][number];
export type View = 'preview' | 'library' | 'docs';
export type Background = 'lilac' | 'transparent' | 'dark';
export const CHARACTERS = catalog.characters;
export const CATEGORIES = ['全部动作', '基础动作', '情绪表达', '专属动作'];
export const REPOSITORY = 'https://github.com/aavvcasdas/latest-aiyunying/tree/arena%2F25fbb036-latest-aiyunying';
export const asset = (id: string, file: string) => `/assets/characters/${id}/${file}`;