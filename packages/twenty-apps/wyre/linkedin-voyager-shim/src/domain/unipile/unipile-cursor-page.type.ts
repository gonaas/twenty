export type UnipileCursorPage<TItem> = {
  items: TItem[];
  cursor: string | null;
};
