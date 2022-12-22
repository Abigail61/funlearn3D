const THREE = require('three');
const MTLLoader = require('three-mtl-loader');
const GameObject = require('./GameObject');
const Component = require('./Component');
const Scene = require('./Scene');
require('three-obj-loader')(THREE);
const GameConfig = require('./GameConfig');
const ENV_CLIENT = !(typeof window === 'undefined');
const fs = ENV_CLIENT ? undefined : require('fs');

const MODEL_PATH = 'vox/';
const PREFAB_PATH = 'pref/';
const SCENE_PATH = 'scene/';

// mtl 加载器
const mtlLoader = new MTLLoader();
mtlLoader.setTexturePath(MODEL_PATH);
mtlLoader.setPath(MODEL_PATH);

// obj 加载器
const objLoader = new THREE.OBJLoader();
objLoader.setPath(MODEL_PATH);

// json 模型加载器
const objectLoader = new THREE.ObjectLoader();
objectLoader.setTexturePath(MODEL_PATH);

// prefab 数据加载器
const prefLoader = new THREE.FileLoader();
prefLoader.oldLoad = prefLoader.load;
prefLoader.parse = (data) => JSON.parse(data);
prefLoader.load = function (path, callback) {
    prefLoader.oldLoad(path, (data) => {
        callback(prefLoader.parse(data));
    });
};
prefLoader.setPath(PREFAB_PATH);

// scene 数据加载器
const sceneLoader = new THREE.FileLoader();
sceneLoader.oldLoad = sceneLoader.load;
sceneLoader.parse = (data) => JSON.parse(data);
sceneLoader.load = function (path, callback) {
    sceneLoader.oldLoad(path, (data) => {
        callback(sceneLoader.parse(data));
    });
};
sceneLoader.setPath(SCENE_PATH);

const Resource = {
    // TODO 这里预先加载 之后新建直接复制
    Model: {},
    Prefab: {}
};

function getCachedModelName() {
    let a = [];
    for (let key in Resource.Model) {
        a.push(key);
    }
    return a;
}
// =================================
// 加载模型 start
// =================================
/**
 * 加载 obj 格式模型
 * @param name
 * @returns {Promise}
 */
Resource.loadOBJ = function(name) {
    return new Promise(function(resolve) {
        // console.log('resource.loadOBJ() name =', name, 'has cache =', Resource.Model[name] !== undefined);
        // console.log('resource.loadOBJ() now Resource.Model =', getCachedModelName());
        // console.log('');

        // cache
        if (Resource.Model[name]) {
            resolve(Resource.Model[name].clone());
            return;
        }
        // load from model
        if (ENV_CLIENT) {
            parseTextInner(name + ".mtl", mtlLoader, (material) => {
                material.preload();
                objLoader.setMaterials(material);
                parseTextInner(name + ".obj", objLoader, (obj) => {
                    Resource.Model[name] = obj;
                    // console.log('resource.loadOBJ() completed name =', name, 'has cache =', Resource.Model[name] !== undefined);
                    // console.log('resource.loadOBJ() now Resource.Model =', getCachedModelName());
                    // console.log('');
                    resolve(obj.clone());
                });
            });
        } else {
            // 服务端不加载贴图
            parseTextInner(name + ".obj", objLoader, (obj) => {
                Resource.Model[name] = obj;
                // console.log('resource.loadOBJ() completed name =', name, 'has cache =', Resource.Model[name] !== undefined);
                // console.log('resource.loadOBJ() now Resource.Model =', getCachedModelName());
                // console.log('');
                resolve(obj.clone());
            });
        }
    });
};

/**
 * 加载 JSON 格式模型
 * @param name
 * @returns {Promise<any>}
 */
Resource.loadJSON = function(name) {
    return new Promise(function(resolve) {
        // cache
        if (Resource.Model[name]) {
            resolve(Resource.Model[name].clone());
            return;
        }
        // load from model
        parseTextInner(MODEL_PATH + name + '.json', objectLoader, (obj) => {
            Resource.Model[name] = obj;
            resolve(obj.clone());
        });
    });
};

/**
 * 生成空物体
 * @returns {Promise<any>}
 */
Resource.loadEMPTY = function () {
    return new Promise(function (resolve) {
        resolve(new THREE.Object3D());
    })
};

// =================================
// 加载模型 end
// =================================
// 加载自定义数据格式 start
// =================================

/**
 * 加载 prefab
 * @param name
 * @returns {Promise<any>}
 */
Resource.loadPrefab = function(name) {
    return new Promise(function(resolve) {
        // cache
        if (Resource.Prefab[name]) {
            resolve(Resource.Prefab[name].clone());
            return;
        }
        // load from pref
        parseTextInner(name + '.json', prefLoader, (data) => {
            parseGameObjectInner(data).then((obj) => {
                Resource.Prefab[name] = obj;
                resolve(obj.clone());
            });
        });
    });
};

Resource.loadScene = function(name) {

    return new Promise(function (resolve) {
        // console.log('resource.loadScene() Resource.Model =', getCachedModelName());

        parseTextInner(name + '.json', sceneLoader, (data) => {
            const Scene = require('./Scene');
            let scene = new Scene();
            // 先加载 prefab
            let requiredPrefabs = [];
            data.prefabs.forEach((prefname) => {
                requiredPrefabs.push(Resource.loadPrefab(prefname));
                // console.log('resource.js loadScene prefab', prefname);
            });
            Promise.all(requiredPrefabs).then(() => {
                // 再加载场景中objects
                let gameObjects = [];
                // console.log('resource.js loadScene data', data);
                data.objects.forEach(json => {
                    gameObjects.push(json.prefab ? Resource.loadPrefab(json.prefab) : parseGameObjectInner(json))
                });
                Promise.all(gameObjects).then(arr => {
                    arr.forEach(i => scene.add(i));
                    resolve(scene);
                });
            });
        });
    }).catch(err => {
        console.log('resource.js loadScene');
        console.log(err.message);
    });

};

// =================================
// 加载自定义数据格式 end
// =================================
// 内部方法 start
// =================================

/**
 * 解析文本到指定对象
 * @param path 浏览器路径
 * @param loader 浏览器用 load 接口，服务端用 parse 接口
 * @param callback 接收解析出的对象
 */
function parseTextInner(path, loader, callback) {
    if (ENV_CLIENT) {
        loader.load(path, callback);
    } else {
        // console.log('old path', path);
        let pathPrefix = MODEL_PATH;
        if (loader === objectLoader) pathPrefix = '';
        if (loader === prefLoader) pathPrefix = PREFAB_PATH;
        if (loader === sceneLoader) pathPrefix = SCENE_PATH;
        path = process.cwd() + '/public/' + pathPrefix + path;
        // console.log('new path', path);
        fs.readFile(path, 'utf8', (err, data) => {
            // post process
            if (loader === objectLoader) data = JSON.parse(data);
            callback(loader.parse(data));
        });
    }
}

/**
 * 解析自定义的 GameObject 格式
 * @param data
 */
function parseGameObjectInner(data) {
    return new Promise(resolve => {
        // 使用字符串拼凑函数名
        // TODO char0 char1等都是loadObj
        Resource['load' + data.objType.toUpperCase()](data.objName).then((obj) => {
            // console.log('resoruce.js parseGameObjectInner function', 'load' + data.objType.toUpperCase());
            // console.log('resoruce.js parseGameObjectInner obj', obj);
            if (data.name) obj.name = data.name;
            // console.log('resoruce.js parseGameObjectInner obj.name', obj.name);
            if (data.position) obj.position.set(data.position[0], data.position[1], data.position[2]);
            if (data.rotation) obj.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
            if (data.scale) obj.scale.set(data.scale[0], data.scale[1], data.scale[2]);
            // TODO 构建GameObject
            let ret = new GameObject(obj);
            if (data.networkId) ret.networkId = data.networkId;
            // TODO 添加触发器
            data.components.forEach((comp) => {
                let constructor = Component.serializedComponents[comp.name];//Components[comp.name];
                // console.log('    comp.name:' + comp.name);
                // console.log('    type of constructor:' + typeof constructor);
                // console.log('');
                let component = new constructor();
                component.props = comp.props || {};
                ret.addComponent(component);
            });
            postProcess(data.name, obj);
            resolve(ret);
        });
    });
}

/**
 * 对于一些特殊情况进行后处理
 * 这部分优雅的解决方案是修改扩充 threejs 源码
 * @param name
 * @param obj
 */
function postProcess(name, obj) {
    if (name === 'player') {
        // 设定 player 头和身体的相对位置
        obj.children[1].position.y = 0.8;
        //obj.position.y = 0.5;
        //obj.position.z = 3;
    }
}

module.exports = Resource;