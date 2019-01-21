const neo4j = require('neo4j-driver').v1;

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'snyk'));
const session = driver.session();

const getPackageTree = async (rootKey) => {
    return await session.run(`MATCH path = (p:Package {name:'${rootKey}'})-[children:HAS_DEPENDENCY*]->(:Package)
    WITH collect(path) as paths
    CALL apoc.convert.toTree(paths) yield value
    RETURN value;`);
};

const getPackagesFlattened = async (rootKey) => {
    return await session.run(`MATCH p = (:Package {name: '${rootKey}'})-[r*0..]->(x)
    WITH collect(DISTINCT x) as nodes, [r in collect(distinct last(r)) | {from: startNode(r), to: endNode(r) }] as rels
    RETURN nodes, rels`);
};

const updateGraph = async (nodes, links) => {
    try {
        await _insertNodes(nodes);
        await _insertLinks(links);
    } catch (err) {
        console.log(`Couldn't save data to neo4j: ${err}`);
    }
};

const _insertNodes = async (nodesArray) => {
    if (nodesArray.length > 0) {
        const query = nodesArray.reduce((str, node) => {
            let { name, version } = node;
            let nodeLabel = `${name}@${version}`;
            str += `MERGE (:Package {name : '${nodeLabel}', package: '${name}', version: '${version}' }) `;
            return str;
        }, '');
        return await session.run(query);
    }
};

const _insertLinks = async (linkArray) => {
    if (linkArray.length > 0) {
        const promises = linkArray.map((link, index) => {
            let { from, to } = link;
            return session.run(`MATCH (s${index}:Package {name: '${from}'})
                                MATCH (d${index}:Package {name: '${to}'})
                                MERGE (s${index})-[:HAS_DEPENDENCY]->(d${index})`);
        });
        return await Promise.all(promises);
    }
};


const isExists = async (packageName, packageVersion) => {
    const nodeLabel = `${packageName}@${packageVersion}`;
    const { records } = await session.run(`MATCH (p: Package {name: '${nodeLabel}'}) RETURN p`);
    return records && records.length > 0;
};

module.exports = {
    isExists,
    updateGraph,
    getPackagesFlattened,
    getPackageTree
};
