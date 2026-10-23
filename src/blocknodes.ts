import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from "lexical";
import { ElementNode } from "lexical";
export type SerializedAutomergeBlockNode = Spread<
  { blockId: string },
  SerializedElementNode
>;
export class AutomergeBlockNode extends ElementNode {
  __blockId: string;
  static getType(): string {
    return "automerge-block";
  }
  static clone(node: AutomergeBlockNode): AutomergeBlockNode {
    return new AutomergeBlockNode(node.__blockId, node.__key);
  }
  constructor(blockId: string, key?: NodeKey) {
    super(key);
    if (!blockId)
      throw new Error("AutomergeBlockNode requires a non-empty blockId");
    this.__blockId = blockId;
  }
  getBlockId(): string {
    return this.getLatest().__blockId;
  }
  setBlockId(blockId: string): void {
    if (!blockId) throw new Error("blockId must not be empty");
    this.getWritable().__blockId = blockId;
  }
  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement("div");
  }
  updateDOM(): false {
    return false;
  }
  exportJSON(): SerializedAutomergeBlockNode {
    return {
      ...super.exportJSON(),
      type: AutomergeBlockNode.getType(),
      blockId: this.getBlockId(),
    };
  }
  static importJSON(
    serialized: SerializedAutomergeBlockNode,
  ): AutomergeBlockNode {
    return new AutomergeBlockNode(serialized.blockId);
  }
}
export function $createAutomergeBlockNode(blockId: string): AutomergeBlockNode {
  return new AutomergeBlockNode(blockId);
}
export function $isAutomergeBlockNode(
  node: LexicalNode | null | undefined,
): node is AutomergeBlockNode {
  return node instanceof AutomergeBlockNode;
}
