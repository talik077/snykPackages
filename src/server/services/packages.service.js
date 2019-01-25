const rp = require('request-promise');
const graphDB = require('../database/packages.neo4j');
const registryUrl = 'https://registry.npmjs.org';

const scanRegistry = async (packageName, packageVersion) => {
    const root = await fetchData(packageName, packageVersion);
    let nodes = [], links = [], queue = [root];
    while (queue.length > 0) {
        const curr = queue.shift();
        const { name, version } = curr;
        const isExists = await graphDB.isExists(name, version);
        if (!isExists && !isScanned(nodes, curr)) {
            nodes.push({ name, version });
            try {
                let data = await fetchData(curr.name, curr.version);
                if (data && data.dependencies) {
                    // transform deps object to array
                    const depsArray = _getDepsArray(data.dependencies);
                    queue = queue.concat(depsArray);
                    _addLinks(links, curr, depsArray);
                }
            } catch (err) {
                console.log(`Error fetching data for ${getNodeKey(name, version)}: ${err}`)
            }
        }
    }
    return [nodes, links, root];
};

const isScanned = (nodes, curr) => {
    const node = nodes.find((elem) => elem.name === curr.name && elem.version === curr.version);
    return typeof node !== 'undefined';
};

const _addLinks = (links, node, neighbors) => {
    if (neighbors && neighbors.length > 0) {
        const from = getNodeKey(node.name, node.version);
        for (let neighbor of neighbors) {
            let to = getNodeKey(neighbor.name, neighbor.version);
            links.push({ from, to });
        }
    }
};

const _getDepsArray = (dependencies) => {
    return Object.keys(dependencies).reduce((arr, name) => {
        let version = getVersionWithoutPrefix(dependencies[name]);
        arr.push({ name, version });
        return arr;
    }, [])
};


const fetchData = async (packageName, packageVersion) => {
    const version = getVersionWithoutPrefix(packageVersion);
    const requestUri = `${registryUrl}/${packageName}/${version}`;
    try {
        return await rp.get(requestUri, { json: true });
    } catch (error) {
        console.log(error);
    }
};

const getNestedTree = (flatArray) => {
    const relationships = flatArray.records[0].get('rels');
    const nodes = flatArray.records[0].get('nodes');

    let map = {}, tree = [], isVisited = {};
    nodes.forEach(({ properties }, index) => {
        const { name, ...other } = properties;
        map[name] = index; // initialize the map
        tree.push({ name, attributes: { ...other }, children: [] }); // initialize the children
    });

    relationships.forEach(({ from, to }) => {
        const parentName = from.properties.name;
        const childName = to.properties.name;
        if (isVisited[childName]) {
            return;
        }
        isVisited[parentName] = true;
        tree[map[parentName]].children.push(tree[map[childName]]);
    });

    return tree[0]; //root
};

const getVersionWithoutPrefix = (version = 'latest') => {
    const specialChar = new RegExp('[~^<>=]', 'g');
    return version.replace(specialChar, '');
};

const getNodeKey = (...args) => args.join('@');

module.exports = {
    scanRegistry,
    getNodeKey,
    getNestedTree
};

