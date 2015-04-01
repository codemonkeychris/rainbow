
// UNDONE: need to think about JSON objects vs. creation functions... 
//

/**
 * Returns a two light system, one light at cameraPos, the other a top down ambient light
 */
function basicLights(cameraPos) {
    return {
        type: 'composite',
        light1 : {
            type: 'directionalLight',
            x: 0, 
            y: 13, 
            z: 0,
            direction: {x:0, y:-1, z:.1},
            intensity: .7,
            diffuse: {r:.9, g:.9, b:1},
            specular: {r:1, g:1, b:1},
        },
        light2 : {
            type: 'directionalLight',
            x: cameraPos.x, 
            y: cameraPos.y * 2, 
            z: cameraPos.z*1.2,
            direction: {
                x:-cameraPos.x, 
                y:-cameraPos.y, 
                z:-cameraPos.z
            },
            diffuse: {r:.5, g:.5, b:.5},
            specular: {r:1, g:1, b:1},
        }
    };
}
function diffuse(url, diffuseProps) { 
    diffuseProps = diffuseProps || {};
    diffuseProps.type = 'texture';
    diffuseProps.url = url;
    return { type: 'material', diffuseTexture: diffuseProps };
}
function shadowFor(lightName, renderList) { return { type: 'shadowGenerator', light: lightName, renderList: renderList }; }
function flatGround(width, depth, material) { 
    return {
        type: 'ground', 
        width:width, 
        depth:depth, 
        segments:8, 
        material:material 
    };
}
function groundFromHeightMap(width, depth, minHeight, maxHeight, heightMapUrl, material) {
    return { 
        type: 'groundFromHeightMap', 
        width:width, 
        depth:depth, 
        minHeight: minHeight,
        maxHeight: maxHeight,
        segments:8, 
        url: heightMapUrl,
        material: material 
    };
}
/**
 * Returns a function which will seach the tree for any objects with a name matching
 * pattern.
 *
 * @param {string} pattern The string pattern to search names for, for now it is a simple "indexOf" matching
 *
 * @return {function(o : any) => string[]} The circumference of the circle.
 */
 function select(pattern) {
    return function(x) { return Object.keys(x).filter(function(i) { return i.indexOf(pattern) != -1 })};
}

function render(time, model) {
    // UNDONE: "ig*" is ignored... design question - if this was an array, it would look 
    // better but then the definition of "name/id" on other elements would be more ugly... 
    //

    var cameraX = (Math.sin(time/40) * 10);
    var cameraY = 5;
    var cameraZ = (Math.sin((time+20)/40) * 10);

    return {
        camera1: {
            type: 'freeCamera',
            x: cameraX, 
            y: cameraY, 
            z: cameraZ,
            target: {x:0, y:3, z:0}
        },
        ig: basicLights({x: cameraX, y: cameraY, z: cameraZ}),
        material1 : diffuse('seamless_stone_texture.jpg'),
        groundMaterial : diffuse('ground.jpg', { uScale:4, vScale:4, specularColor: {r:0, g:0, b:0} }),
        ground1 : groundFromHeightMap(50, 50, 0, 3, "heightMap.png", "groundMaterial"),
        ig2: model.reduce(function (prev, current, index, arr) {
            var name = 'vis('+index+')';
            prev[name] = { 
                type:'box', 
                x: index - arr.length / 2,
                y: 3 + (current / 4),
                z: 0,
                size: 1,
                scaling: { x:.8, y:current/2, z:.8 },
                material: "material1"
            };
            return prev;
        }, { type: 'composite' }),
        shadow1 : shadowFor('light2', select("vis(")),
        shadow2 : shadowFor('light1', select("vis("))
    };
};

(function() {
    var MAX_UPDATES = 20;

    function flatten(scene) {
        var result = {};
        var keys = Object.keys(scene);
        for (var i=0; i<keys.length; i++) {
            var name = keys[i];
            var value = scene[name];
            if (scene[name].type == 'composite') {
                var compKeys = Object.keys(value);
                for (var i2=0; i2<compKeys.length; i2++) {
                    if (compKeys[i2] != 'type') {
                        result[compKeys[i2]] = value[compKeys[i2]];
                    }
                }
            }
            else {
                result[name] = scene[name];
            }
        }
        return result;
    }

    function resolveFunctions(scene) {
        var result = {};
        var keys = Object.keys(scene);
        for (var i=0; i<keys.length; i++) {
            var name = keys[i];
            var value = scene[name];
            if (value) {
                var childKeys = Object.keys(value);
                for (var i2=0; i2<childKeys.length; i2++) {
                    if (value[childKeys[i2]] instanceof Function) {
                        value[childKeys[i2]] = value[childKeys[i2]](scene);
                    }
                }
            }
            result[name] = value;
        }
        return result;
    }

    function diff(master, newScene) {
        newScene = resolveFunctions(flatten(newScene));
        if (!master) {
            var keys = Object.keys(newScene);
            for (var i=0; i<keys.length; i++) {
                newScene[keys[i]].action = "create";
            }
            return newScene;
        }
        else {
            var keys = Object.keys(master);
            for (var i=0; i<keys.length; i++) {
                var name = keys[i];
                if (!newScene[name]) {
                    master[name].action = "delete";
                }
                else {
                    newScene[name].instance = master[name].instance;
                    master[name] = newScene[name];
                    master[name].action = "update";
                    newScene[name] = null;
                }
            }
            var keys = Object.keys(newScene);
            for (var i=0; i<keys.length; i++) {
                var name = keys[i];
                if (newScene[name]) {
                    newScene[name].action = "create";
                    master[name] = newScene[name];
                }
            }
            return master;
        }
    };
    function applyActions(dom, scene) {
        var keys = Object.keys(dom);
        var result = { };

        var updateCount = 0;

        for (var i=0; i<keys.length; i++) {
            var name = keys[i];
            var item = dom[name];

            // hack, hack, hack... 
            //
            if (updateCount > MAX_UPDATES) {
                if (item.action == "update" || item.action == "delete") {
                    result[name] = item;
                }
                continue;
            }

            switch (item.action) {
                case "create":
                    updateCount++;
                    switch (item.type) {
                        case "shadowGenerator":
                            item.instance = new BABYLON.ShadowGenerator(1024, result[item.light].instance);
                            item.instance.usePoissonSampling = true;
                            var renderList = item.instance.getShadowMap().renderList;
                            for (var i=0; i<item.renderList.length; i++) {
                                renderList.push(result[item.renderList[i]].instance);
                            }
                            break;
                        case "sphere":
                            item.instance = BABYLON.Mesh.CreateSphere(name, item.segments || 16, item.size, scene);
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            item.instance.receiveShadows = true;
                            break;
                        case "box":
                            item.instance = BABYLON.Mesh.CreateBox(name, item.size, scene);
                            if (item.scaling) {
                                item.instance.scaling.x = item.scaling.x;
                                item.instance.scaling.y = item.scaling.y;
                                item.instance.scaling.z = item.scaling.z;
                            }
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            if (item.material) {
                                item.instance.material = result[item.material].instance;
                            }
                            break;
                        case "hemisphericLight":
                            item.instance = new BABYLON.HemisphericLight(name, new BABYLON.Vector3(0, 1, 0), scene);
                            item.instance.intensity = item.intensity;
                            break;
                        case "directionalLight":
                            item.instance = new BABYLON.DirectionalLight(name, new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z), scene);
                            item.instance.intensity = item.intensity || 1;
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            item.instance.diffuse = new BABYLON.Color3(item.diffuse.r, item.diffuse.g, item.diffuse.b);
                            item.instance.specular = new BABYLON.Color3(item.specular.r, item.specular.g, item.specular.b);
                            break;
                        case "pointLight":
                            item.instance = new BABYLON.PointLight(name, new BABYLON.Vector3(item.x, item.y, item.z), scene);
                            item.instance.diffuse = new BABYLON.Color3(item.diffuse.r, item.diffuse.g, item.diffuse.b);
                            item.instance.specular = new BABYLON.Color3(item.specular.r, item.specular.g, item.specular.b);
                            item.instance.intensity = item.intensity || 1;
                            break;
                        case "freeCamera":
                            item.instance = new BABYLON.FreeCamera(name, new BABYLON.Vector3(item.x, item.y, item.z), scene);
                            item.instance.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                            break;
                        case "ground":
                            item.instance = BABYLON.Mesh.CreateGround(name, item.width, item.depth, item.segments, scene);
                            item.instance.receiveShadows = true;
                            if (item.material) {
                                item.instance.material = result[item.material].instance;
                            }
                            break;
                        case "groundFromHeightMap":
                            item.instance = BABYLON.Mesh.CreateGroundFromHeightMap(name, 
                                item.url, 
                                item.width, 
                                item.depth, 
                                item.segments, 
                                item.minHeight, 
                                item.maxHeight,  
                                scene, 
                                false);
                            item.instance.receiveShadows = true;
                            if (item.material) {
                                item.instance.material = result[item.material].instance;
                            }
                            break;
                        case "material":
                            item.instance = new BABYLON.StandardMaterial(name, scene);
                            if (item.diffuseTexture) {
                                if (item.diffuseTexture.type == "texture") {
                                    item.instance.diffuseTexture = new BABYLON.Texture(item.diffuseTexture.url, scene);
                                    if (item.diffuseTexture.uScale) { item.instance.diffuseTexture.uScale = item.diffuseTexture.uScale }
                                    if (item.diffuseTexture.vScale) { item.instance.diffuseTexture.vScale = item.diffuseTexture.vScale }
                                    if (item.diffuseTexture.specularColor) { 
                                        item.instance.diffuseTexture.specularColor = 
                                            new BABYLON.Color3(
                                                item.diffuseTexture.specularColor.r, 
                                                item.diffuseTexture.specularColor.g, 
                                                item.diffuseTexture.specularColor.b
                                            ); 
                                    }
                                }
                            }
                            break;

                    }
                    item.action = null;
                    result[name] = item;
                    break;
                case "update":
                    // UNDONE: update material - need really diffing for that
                    // UNDONE: update shadow - need really diffing for that
                    // UNDONE: update material
                    // UNDONE: update groundFromHeightMap
                    //
                    item.action = null;
                    switch (item.type) {
                        case "sphere":
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            break;
                        case "box":
                            if (item.scaling) {
                                item.instance.scaling.x = item.scaling.x;
                                item.instance.scaling.y = item.scaling.y;
                                item.instance.scaling.z = item.scaling.z;
                            }
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            break;
                        case "pointLight":
                            item.instance.intensity = item.intensity || 1;
                            item.instance.diffuse = new BABYLON.Color3(item.diffuse.r, item.diffuse.g, item.diffuse.b);
                            item.instance.specular = new BABYLON.Color3(item.specular.r, item.specular.g, item.specular.b);
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            break;
                        case "directionalLight":
                            item.instance.intensity = item.intensity || 1;
                            item.instance.direction = new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z)
                            item.instance.diffuse = new BABYLON.Color3(item.diffuse.r, item.diffuse.g, item.diffuse.b);
                            item.instance.specular = new BABYLON.Color3(item.specular.r, item.specular.g, item.specular.b);
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            break;
                        case "hemisphericLight":
                            item.instance.intensity = item.intensity;
                            break;
                        case "freeCamera":
                            item.instance.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            break;
                        case "ground":
                            // UNDONE: update ground
                            break;
                    }
                    result[name] = item;
                    break;
                case "delete":
                    updateCount++;
                    item.instance.dispose();
                    break;    
            }
        }

        return result;
    };

    window.addEventListener("load", (function() {
        var canvas = document.getElementById("renderCanvas");
        var modelInput = document.getElementById("modelInput");
        var updateButton = document.getElementById("updateButton");

        var engine = new BABYLON.Engine(canvas, true);

        var lastDom = null;
        var model = JSON.parse(modelInput.value);
        updateButton.addEventListener("click", function() { model = JSON.parse(modelInput.value) });

        var createScene = function (t) {

            // This creates a basic Babylon Scene object (non-mesh)
            var scene = new BABYLON.Scene(engine);

            // UNDONE: how to do this in the new model?
            // This attaches the camera to the canvas
            // camera.attachControl(canvas, true);

            lastDom = diff(lastDom, render(0, model));
            lastDom = applyActions(lastDom, scene);

            return scene;

        };

        var scene = createScene();
        var t = 0;

        setInterval(function() {
            t++;
            lastDom = diff(lastDom, render(t, model));
            lastDom = applyActions(lastDom, scene);
        }, 32);

        engine.runRenderLoop(function () {
          scene.render();
        });

        // Resize
        window.addEventListener("resize", function () {
          engine.resize();
        });
    }));
})();