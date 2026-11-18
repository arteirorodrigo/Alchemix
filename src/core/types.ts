export type ElementId = string;                  // slug: 'agua', 'barro', 'pocao-da-cura'
export type Cell = ElementId | null | '#';       // null = vazio, '#' = parede
export interface Pos { r: number; c: number }
export interface Board { rows: number; cols: number; cells: Cell[] }   // linha a linha
export interface ElementDef { id: ElementId; name: string; emoji: string; tier: number; kind: string; art?: string }
export interface Recipe { key: string; a: ElementId; b: ElementId; result: ElementId; tier: number; logic: string }
export interface Goal { element: ElementId; count: number }
export interface Move { from: Pos; to: Pos }
export interface Level {
  number: number; seed: number; board: Board; goals: Goal[]; moves: number;
  active: string[];            // Recipe.key ativas nesta fase
  newRecipe?: string;          // Recipe.key introduzida nesta fase
  solution: Move[];            // solução guardada pelo gerador
  fingerprint: string;
}
export interface ReactionEvent { a: Pos; b: Pos; at: Pos; recipe: string; collected: boolean }
export interface FallEvent { from: Pos; to: Pos }
export interface StepEvents { reactions: ReactionEvent[]; falls: FallEvent[] }
export interface MoveResult { board: Board; steps: StepEvents[]; collected: Record<ElementId, number>; newlySeen: string[] }
