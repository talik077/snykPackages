const graphDB = require('../database/packages.neo4j');
const packagesService = require('../services/packages.service');

const getPackageGraph = async (req, res) => {
    const { name, version } = req.params;
    try {
        const [nodes, links, root] = await packagesService.scanRegistry(name, version);
        const rootKey = packagesService.getNodeKey(root.name, root.version);
        const response = await graphDB.updateGraph(nodes, links);
        /***
         * GET NESTED TREE FROM DB
         * const graph = await graphDB.getPackageTree(rootKey);
         * res.status(200).json(graph.records[0]._fields);
         */

        // CONSTRUCT NESTED TREE
        const flatArray = await graphDB.getPackagesFlattened(rootKey);
        const nestedArray = packagesService.getNestedTree(flatArray);
        res.status(200).json(nestedArray);
    } catch (err) {
        res.status(500).json([]);
    }
};

module.exports = {
    getPackageGraph
};
