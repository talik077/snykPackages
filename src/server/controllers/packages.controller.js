const rp = require('request-promise');
const registryUrl = 'https://registry.npmjs.org';

const getPackageGraph = async (req, res) => {
    const { name, version } = req.params;
    try {
        const [nodes, links] = await scanRegistry(name, version);
        console.log(nodes);
    } catch (err) {
        res.status(500).json([]);
    }

};

const scanRegistry = async (packageName, packageVersion) => {
    const root = await fetchData(packageName, packageVersion);
    let nodes = [], links = [], queue = [root];
    const map = { 'body-parser': 1.1 };
    while (queue.length > 0) {
        const curr = queue.shift();
        const { name, version } = curr;
        if (!map[name]) { // check if current node exists
            nodes.push({ name, version });
            try {
                let data = await fetchData(curr.name, curr.version);
                if (data && data.dependencies) {
                    const depsArray = getDepsArray(data.dependencies);
                    queue = queue.concat(depsArray);
                    addLinks(links, curr, depsArray);
                }
            } catch (err) {
                console.log(`Error fetching data for ${name}@${version}: ${err}`)
            }
        }
    }
    return [ nodes, links ];
};

const addLinks = (links, node, neighbors) => {
    if (neighbors && neighbors.length > 0) {
        const from = getNodeKey(node.name, node.version);
        for (let neighbor of neighbors) {
            let to = getNodeKey(neighbor.name, neighbor.version);
            links.push({ from, to });
        }
    }
};


const getDepsArray = (dependencies) => {
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

const getVersionWithoutPrefix = (version = 'latest') => {
    const specialChar = new RegExp('[~^<>=]', 'g');
    return version.replace(specialChar, '');
};

const getNodeKey = (...args) => args.join('@');


module.exports = {
    getPackageGraph
};
