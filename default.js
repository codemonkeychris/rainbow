///<reference path='Babylon.js-2.0/references/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/references/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
// beginings of TypeScript definition for OM
//
var Rnb;
(function (Rnb) {
})(Rnb || (Rnb = {}));
// UNDONE: need to think about JSON objects vs. creation functions... 
//
var App;
(function (App) {
    /**
     * Returns a two light system, one light at cameraPos, the other a top down ambient light
    */
    function basicLights(cameraPos) {
        return {
            type: 'composite',
            light1: {
                type: 'directionalLight',
                position: { x: 0, y: 13, z: 0 },
                direction: { x: 0, y: -1, z: .1 },
                intensity: .7,
                diffuse: { r: .9, g: .9, b: 1 },
                specular: { r: 1, g: 1, b: 1 }
            },
            light2: {
                type: 'directionalLight',
                position: { x: cameraPos.x, y: cameraPos.y * 2, z: cameraPos.z * 1.2 },
                direction: {
                    x: -cameraPos.x,
                    y: -cameraPos.y,
                    z: -cameraPos.z
                },
                diffuse: { r: .5, g: .5, b: .5 },
                specular: { r: 1, g: 1, b: 1 }
            }
        };
    }
    function diffuse(url) {
        return { type: 'material', diffuseTexture: { type: 'texture', url: url } };
    }
    function shadowFor(lightName, renderList) {
        return { type: 'shadowGenerator', light: lightName, renderList: renderList };
    }
    function flatGround(width, depth, material) {
        return {
            type: 'ground',
            x: 0,
            y: 0,
            z: 0,
            width: width,
            depth: depth,
            segments: 8,
            material: material
        };
    }
    function groundFromHeightMap(width, depth, minHeight, maxHeight, heightMapUrl, material) {
        return {
            type: 'groundFromHeightMap',
            x: 0,
            y: 0,
            z: 0,
            width: width,
            depth: depth,
            minHeight: minHeight,
            maxHeight: maxHeight,
            segments: 8,
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
        return function (x) {
            return Object.keys(x).filter(function (i) { return i.indexOf(pattern) != -1; });
        };
    }
    function render(time, model) {
        // UNDONE: "ig*" is ignored... design question - if this was an array, it would look 
        // better but then the definition of "name/id" on other elements would be more ugly... 
        //
        var cameraX = (Math.sin(time / 40) * 10);
        var cameraY = 5;
        var cameraZ = (Math.sin((time + 20) / 40) * 10);
        var sphereScale = Math.abs(Math.sin(time / 20)) * 3;
        return {
            camera1: {
                type: 'freeCamera',
                x: 0,
                y: 2,
                z: -5,
                target: { x: 0, y: 3, z: 0 },
                attachControl: "renderCanvas"
            },
            ig: basicLights({ x: cameraX, y: cameraY, z: cameraZ }),
            material1: diffuse('seamless_stone_texture.jpg'),
            groundMaterial: {
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                diffuseTexture: { type: 'texture', url: 'ground.jpg', uScale: 4, vScale: 4 }
            },
            ground1: groundFromHeightMap(50, 50, 0, 3, "heightMap.png", "groundMaterial"),
            ig2: model.reduce(function (prev, current, index, arr) {
                var name = 'vis(' + index + ')';
                prev[name] = {
                    type: 'box',
                    x: index - arr.length / 2,
                    y: 3 + (current / 4),
                    z: 0,
                    size: 1,
                    scaling: { x: .8, y: current / 2, z: .8 },
                    material: "material1"
                };
                return prev;
            }, { type: 'composite' }),
            "vis(-1)": {
                type: 'sphere',
                x: 2,
                y: 3,
                z: 2,
                diameter: 1,
                scaling: { x: sphereScale, y: sphereScale, z: sphereScale },
                segments: 12,
                material: "material1"
            },
            shadow1: shadowFor('light2', select("vis(")),
            shadow2: shadowFor('light1', select("vis("))
        };
    }
    App.render = render;
    ;
})(App || (App = {}));
(function () {
    // creation of new meshes can be expensive, to avoid hanging the UI thread, I limit
    // the number of expensive operations per frame. The rest will be picked up on the 
    // next frame
    //
    var MAX_UPDATES = 20;
    // all of these update handlers are pretty bogus. Once DIFF becomes smart enough, we should clearly only 
    // update the changed values.
    // 
    function updatePosition(item, r) {
        r.position.x = item.x;
        r.position.y = item.y;
        r.position.z = item.z;
    }
    function updateGeometryProps(item, includeExpensive, realObjects, r) {
        if (item.scaling) {
            r.scaling.x = item.scaling.x;
            r.scaling.y = item.scaling.y;
            r.scaling.z = item.scaling.z;
        }
        updatePosition(item, r);
        if (includeExpensive) {
            r.receiveShadows = true;
            if (item.material) {
                r.material = realObjects[item.material];
            }
        }
    }
    function updateLightProps(item, r) {
        r.intensity = item.intensity || 1;
        if (item.diffuse) {
            r.diffuse = new BABYLON.Color3(item.diffuse.r, item.diffuse.g, item.diffuse.b);
        }
        if (item.specular) {
            r.specular = new BABYLON.Color3(item.specular.r, item.specular.g, item.specular.b);
        }
    }
    var handlers = {
        box: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = BABYLON.Mesh.CreateBox(name, item.size, scene);
                updateGeometryProps(item, true, realObjects, r);
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                updateGeometryProps(rawItem, false, realObjects, realObjects[name]);
            }
        },
        sphere: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = BABYLON.Mesh.CreateSphere(name, item.segments || 16, item.diameter, scene, true);
                updateGeometryProps(item, true, realObjects, r);
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                updateGeometryProps(item, false, realObjects, realObjects[name]);
            }
        },
        ground: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = BABYLON.Mesh.CreateGround(name, item.width, item.depth, item.segments, scene);
                updateGeometryProps(item, true, realObjects, r);
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                updateGeometryProps(rawItem, false, realObjects, realObjects[name]);
            }
        },
        groundFromHeightMap: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = BABYLON.Mesh.CreateGroundFromHeightMap(name, item.url, item.width, item.depth, item.segments, item.minHeight, item.maxHeight, scene, false);
                updateGeometryProps(item, true, realObjects, r);
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                updateGeometryProps(rawItem, false, realObjects, realObjects[name]);
            }
        },
        hemisphericLight: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = new BABYLON.HemisphericLight(name, new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z), scene);
                updateLightProps(item, r);
                if (item.groundColor) {
                    r.groundColor.r = item.groundColor.r;
                    r.groundColor.g = item.groundColor.g;
                    r.groundColor.b = item.groundColor.b;
                }
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name];
                updateLightProps(item, r);
                if (item.groundColor) {
                    r.groundColor.r = item.groundColor.r;
                    r.groundColor.g = item.groundColor.g;
                    r.groundColor.b = item.groundColor.b;
                }
            }
        },
        pointLight: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = new BABYLON.PointLight(name, new BABYLON.Vector3(item.position.x, item.position.y, item.position.z), scene);
                updateLightProps(item, r);
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name];
                updatePosition(item.position, r);
                updateLightProps(item, r);
            }
        },
        directionalLight: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = new BABYLON.DirectionalLight(name, new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z), scene);
                updatePosition(item.position, r);
                updateLightProps(item, r);
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name];
                r.direction = new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z);
                updatePosition(item.position, r);
                updateLightProps(item, r);
            }
        },
        shadowGenerator: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = new BABYLON.ShadowGenerator(1024, realObjects[item.light]);
                r.usePoissonSampling = true;
                var renderList = r.getShadowMap().renderList;
                for (var i = 0; i < item.renderList.length; i++) {
                    renderList.push(realObjects[item.renderList[i]]);
                }
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                // UNDONE: update shadowGenerator
            }
        },
        material: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = new BABYLON.StandardMaterial(name, scene);
                if (item.diffuseTexture) {
                    if (item.diffuseTexture.type == "texture") {
                        var texture = item.diffuseTexture;
                        var realTexture = new BABYLON.Texture(texture.url, scene);
                        r.diffuseTexture = realTexture;
                        if (texture.uScale) {
                            realTexture.uScale = texture.uScale;
                        }
                        if (texture.vScale) {
                            realTexture.vScale = texture.vScale;
                        }
                        if (item.specularColor) {
                            r.specularColor = new BABYLON.Color3(item.specularColor.r, item.specularColor.g, item.specularColor.b);
                        }
                    }
                }
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                // UNDONE: update material - need really diffing for that
            }
        },
        freeCamera: {
            create: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name] = new BABYLON.FreeCamera(name, new BABYLON.Vector3(item.x, item.y, item.z), scene);
                r.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                if (item.attachControl) {
                    r.attachControl(document.getElementById(item.attachControl), true);
                }
            },
            update: function (rawItem, name, dom, scene, realObjects) {
                var item = rawItem;
                var r = realObjects[name];
                r.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                updatePosition(item, r);
            },
            diff: function (newItem, oldItem) {
                if (!oldItem) {
                    newItem.action = "create";
                    return newItem;
                }
                else if (!newItem) {
                    oldItem.action = "delete";
                    return oldItem;
                }
                else {
                    var n = newItem;
                    var o = oldItem;
                    if (n.x !== o.x || n.y !== o.y || n.z !== o.z) {
                        newItem.action = "update";
                    }
                    // UNDONE: target diff
                    return newItem;
                }
            }
        }
    };
    // JS records don't compose well in functional contexts, you can't merged function records easily (a+b), 
    // so I opt'd for a simple {type:'composite'} which will be flattened before processing and completely
    // erased.
    //
    function flatten(scene) {
        var result = {};
        var keys = Object.keys(scene);
        for (var i = 0; i < keys.length; i++) {
            var name = keys[i];
            var value = scene[name];
            if (scene[name].type == 'composite') {
                var compKeys = Object.keys(value);
                for (var i2 = 0; i2 < compKeys.length; i2++) {
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
    // functions in the graph allow for lazy evaluation and graph queries, the common
    // one I hit was the desire to get a list of all XXX elements to create shadows
    //
    function resolveFunctions(scene) {
        var result = {};
        var keys = Object.keys(scene);
        for (var i = 0; i < keys.length; i++) {
            var name = keys[i];
            var value = scene[name];
            if (value) {
                var childKeys = Object.keys(value);
                for (var i2 = 0; i2 < childKeys.length; i2++) {
                    if (value[childKeys[i2]] instanceof Function) {
                        value[childKeys[i2]] = value[childKeys[i2]](scene);
                    }
                }
            }
            result[name] = value;
        }
        return result;
    }
    // Incredibly niave implementation of DIFF... really this should just be replaced
    // by React, i need to see how hard that would be with my own custom OM as the
    // backend/DOM
    //
    function diff(master, newScene) {
        newScene = resolveFunctions(flatten(newScene));
        if (!master) {
            var keys = Object.keys(newScene);
            for (var i = 0; i < keys.length; i++) {
                newScene[keys[i]].action = "create";
            }
            return newScene;
        }
        else {
            var result = {};
            var masterKeys = Object.keys(master);
            var keys = Object.keys(newScene);
            for (var i = 0; i < keys.length; i++) {
                var name = keys[i];
                var n = newScene[name];
                var o = master[name];
                var type = (n && n.type) || (o && o.type);
                var diff_handler = handlers[type].diff;
                if (diff_handler) {
                    result[name] = diff_handler(n, o);
                    if (!result[name]) {
                        throw "bad diff handler!";
                    }
                }
                else {
                    if (!o) {
                        result[name] = n;
                        result[name].action = "create";
                    }
                    else {
                        result[name] = n;
                        result[name].action = "update";
                    }
                }
            }
            for (var i = 0; i < masterKeys.length; i++) {
                var name = masterKeys[i];
                if (!newScene[name]) {
                    result[name] = master[name];
                    result[name].action = "delete";
                }
            }
            return result;
        }
    }
    ;
    // Poorly factored and horribly inneficient. This started as 20 lines, and kept growing. 
    // Desparately needs refactoring and some design work
    //
    function applyActions(dom, scene, realObjects) {
        var keys = Object.keys(dom);
        var result = {};
        var updateCount = 0;
        for (var i = 0; i < keys.length; i++) {
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
                    delete item.action;
                    handlers[item.type].create(item, name, dom, scene, realObjects);
                    result[name] = item;
                    break;
                case "update":
                    delete item.action;
                    handlers[item.type].update(item, name, dom, scene, realObjects);
                    result[name] = item;
                    break;
                case "delete":
                    updateCount++;
                    realObjects[name].dispose();
                    delete realObjects[name];
                    break;
                default:
                    result[name] = item;
                    break;
            }
        }
        return result;
    }
    ;
    // Simplistic startup, need to think about the app bootstrap and actual app model.
    // Lots of questions - for example should we embrace React for the HTML UI and just go all in?
    //
    window.addEventListener("load", (function () {
        var canvas = document.getElementById("renderCanvas");
        var modelInput = (document.getElementById("modelInput"));
        var updateButton = (document.getElementById("updateButton"));
        var engine = new BABYLON.Engine(canvas, true);
        var lastDom = null;
        var realObjects = {};
        var model = JSON.parse(modelInput.value);
        updateButton.addEventListener("click", function () {
            model = JSON.parse(modelInput.value);
        });
        var frameCount = 0;
        var scene = new BABYLON.Scene(engine);
        var updateFrame = function () {
            lastDom = diff(lastDom, App.render(frameCount++, model));
            lastDom = applyActions(lastDom, scene, realObjects);
            document.getElementById("domOutput").innerHTML = JSON.stringify(lastDom, undefined, 2);
        };
        updateFrame();
        setInterval(updateFrame, 32);
        engine.runRenderLoop(function () {
            scene.render();
        });
        window.addEventListener("resize", function () {
            engine.resize();
        });
    }));
})();
