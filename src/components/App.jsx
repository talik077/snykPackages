import React from 'react';
import '../assets/scss/App.scss';
import axios from 'axios';
import { HashLoader } from 'react-spinners';
import Tree from 'react-d3-tree';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            graph: null,
            isSearching: false
        };
        this.packageName = 'react';
        this.packageVersion = 'latest';
        this.getPackageData = this.getPackageData.bind(this);
        this.onVersionChange = this.onVersionChange.bind(this);
        this.onNameChange = this.onNameChange.bind(this);
        this.onSearchClick = this.onSearchClick.bind(this);
    }

    componentDidMount() {
        this.setState({ isSearching: true }, this.getPackageData);
    }

    getPackageData() {
        const url = `http://127.0.0.1:8082/api/packages/${this.packageName}/${this.packageVersion}`;
        axios.get(url)
            .then(response => this.setState({ graph: response.data, isSearching: false }))
            .catch(err => console.log(`ERR ${err}`));
    }

    onVersionChange(event) {
        this.packageVersion = event.target.value;
    }

    onNameChange(event) {
        this.packageName = event.target.value;
    }

    onSearchClick() {
        this.setState({ isSearching: true }, this.getPackageData);
    }

    getTree() {
        const { graph } = this.state;
        return (
            <div className="tree-container">
                <Tree
                    data={graph}
                    initialDepth={1}
                    translate={{ x: 50, y: 200 }}
                    pathFunc={'elbow'}
                    styles={{
                        nodes: {
                            leafNode: {
                                circle: { fill: '#000' },
                                attributes: { stroke: '#000' }
                            },
                            node: {
                                circle: { fill: '#f5a623' },
                                attributes: { stroke: '#000' }
                            },

                        }
                    }}
                    zoom={0.8}
                />
            </div>
        )
    }

    render() {
        const { graph, isSearching } = this.state;
        return (
            <div className="container">
                <div className="column-left">
                    <img className="app-logo" src="/src/assets/img/snykdog.svg" onClick={() => location.reload()} />
                    <input className='search-input' onChange={this.onNameChange}
                           placeholder={`Package Name (${this.packageName})`} />
                    <input className='search-input' onChange={this.onVersionChange}
                           placeholder={`Package Version (${this.packageVersion})`} />
                    <button onClick={this.onSearchClick} className='search-btn'>Search</button>
                    <HashLoader loading={isSearching} css={{ margin: '65px' }} size={50} color={'#fff'} />
                    <span className='signature'>Tal Kaptsan @ 2019</span>
                </div>
                <div className="column-right">
                    {graph && this.getTree()}
                </div>
            </div>
        );
    }
}

export default App;
