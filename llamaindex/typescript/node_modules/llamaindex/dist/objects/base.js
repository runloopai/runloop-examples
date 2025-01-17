import { BaseObjectNodeMapping, ObjectRetriever } from "@llamaindex/core/objects";
import { TextNode } from "@llamaindex/core/schema";
const convertToolToNode = (tool)=>{
    const nodeText = `
    Tool name: ${tool.metadata.name}
    Tool description: ${tool.metadata.description}
  `;
    return new TextNode({
        text: nodeText,
        metadata: {
            name: tool.metadata.name
        },
        excludedEmbedMetadataKeys: [
            "name"
        ],
        excludedLlmMetadataKeys: [
            "name"
        ]
    });
};
export class SimpleToolNodeMapping extends BaseObjectNodeMapping {
    _tools;
    constructor(objs = []){
        super();
        this._tools = {};
        for (const tool of objs){
            this._tools[tool.metadata.name] = tool;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objNodeMapping() {
        return this._tools;
    }
    toNode(tool) {
        return convertToolToNode(tool);
    }
    _addObj(tool) {
        this._tools[tool.metadata.name] = tool;
    }
    _fromNode(node) {
        if (!node.metadata) {
            throw new Error("Metadata must be set");
        }
        return this._tools[node.metadata.name];
    }
    persist(persistDir, objNodeMappingFilename) {
    // Implement the persist method
    }
    toNodes(objs) {
        return objs.map((obj)=>this.toNode(obj));
    }
    addObj(obj) {
        this._addObj(obj);
    }
    fromNode(node) {
        return this._fromNode(node);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromObjects(objs, ...args) {
        return new SimpleToolNodeMapping(objs);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fromObjects(objs, ...args) {
        return new SimpleToolNodeMapping(objs);
    }
}
export class ObjectIndex {
    _index;
    _objectNodeMapping;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(index, objectNodeMapping){
        this._index = index;
        this._objectNodeMapping = objectNodeMapping;
    }
    static async fromObjects(// eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects, objectMapping, // eslint-disable-next-line @typescript-eslint/no-explicit-any
    indexCls, // eslint-disable-next-line @typescript-eslint/no-explicit-any
    indexKwargs) {
        if (objectMapping === null) {
            objectMapping = SimpleToolNodeMapping.fromObjects(objects, {});
        }
        const nodes = objectMapping.toNodes(objects);
        const index = await indexCls.init({
            nodes,
            ...indexKwargs
        });
        return new ObjectIndex(index, objectMapping);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async insertObject(obj) {
        this._objectNodeMapping.addObj(obj);
        const node = this._objectNodeMapping.toNode(obj);
        await this._index.insertNodes([
            node
        ]);
    }
    get tools() {
        return this._objectNodeMapping.objNodeMapping();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async asRetriever(kwargs) {
        return new ObjectRetriever(this._index.asRetriever(kwargs), this._objectNodeMapping);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    asNodeRetriever(kwargs) {
        return this._index.asRetriever(kwargs);
    }
}
