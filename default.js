///<reference path='Babylon.js-2.0/references/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/references/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
var App;
(function (App) {
    var HOLO_ALPHA = .6;
    function hud(name, hoverModel) {
        var materialName = name + '-mat1';
        var hoverMaterialName = name + '-mat2';
        function hudControl(name, material, x) {
            return {
                name: name,
                type: 'sphere',
                position: { x: x, y: -1, z: 3 },
                relativeTo: '$camera',
                diameter: .4,
                segments: 12,
                material: hoverModel == name ? hoverMaterialName : material
            };
        }
        function ballTextMaterial(name, msg) {
            return {
                name: name,
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                alpha: HOLO_ALPHA,
                diffuseTexture: {
                    type: 'dynamicTexture',
                    name: name + "-texture",
                    width: 128,
                    height: 128,
                    wAng: Math.PI / 2,
                    vScale: -1,
                    vOffset: -.25,
                    uOffset: -.1,
                    renderCallback: 'function callback(texture) { texture.drawText("' + msg + '", null, 80, "bold 70px Segoe UI", "white", "#555555"); }; callback;'
                }
            };
        }
        return [
            ballTextMaterial('plus', '+'),
            ballTextMaterial('minus', '-'),
            ballTextMaterial('random', 'R'),
            { name: hoverMaterialName, type: 'material', diffuseColor: { r: 1, g: 0.2, b: .2 }, alpha: HOLO_ALPHA },
            hudControl(name + "-hud1", 'plus', -.5),
            hudControl(name + "-hud2", 'minus', 0),
            hudControl(name + "-hud3", 'random', .5)
        ];
    }
    function createWorld() {
        function basicLights() {
            return [
                {
                    name: 'light1',
                    type: 'directionalLight',
                    position: { x: 0, y: 13, z: 3 },
                    relativeTo: "ground1",
                    direction: { x: 0, y: -13, z: .1 },
                    intensity: .7,
                    diffuse: { r: .9, g: .9, b: 1 },
                    specular: { r: 1, g: 1, b: 1 }
                },
                {
                    name: 'light2',
                    type: 'pointLight',
                    relativeTo: "$camera",
                    position: { x: 0, y: 0, z: 0 },
                    intensity: .6,
                    diffuse: { r: 1, g: 1, b: 1 },
                    specular: { r: .3, g: .3, b: .3 }
                }
            ];
        }
        function select(pattern) {
            return function (x) {
                return x.filter(function (item) { return item.name.indexOf(pattern) != -1; }).map(function (item) { return item.name; });
            };
        }
        function groundFromHeightMap(name, width, depth, minHeight, maxHeight, heightMapUrl, material) {
            return {
                name: name,
                type: 'groundFromHeightMap',
                position: { x: 0, y: 0, z: 0 },
                relativeTo: "$origin",
                width: width,
                depth: depth,
                minHeight: minHeight,
                maxHeight: maxHeight,
                segments: 8,
                url: heightMapUrl,
                material: material
            };
        }
        function table(name, position, relativeTo) {
            var width = 16;
            var depth = 8;
            var legHeight = 4;
            var legTopSize = 1;
            var topThickness = .2;
            var materialName = name + '-wood';
            function tableLeg(part, position) {
                return {
                    name: name + "-" + part,
                    type: 'box',
                    position: position,
                    relativeTo: relativeTo,
                    size: 1,
                    scaling: { x: legTopSize, y: legHeight, z: legTopSize },
                    material: materialName
                };
            }
            ;
            return [
                { name: materialName, type: 'material', diffuseTexture: { type: 'texture', url: 'wood.jpg' } },
                {
                    name: name + '-v-top',
                    type: 'box',
                    position: { x: position.x, y: position.y + legHeight, z: position.z },
                    relativeTo: relativeTo,
                    size: 1,
                    scaling: { x: width, y: topThickness, z: depth },
                    material: materialName
                },
                tableLeg('v-leftfront', {
                    x: position.x - (width / 2) + (legTopSize / 2),
                    y: position.y + (legHeight / 2) - (topThickness / 2),
                    z: position.z - (depth / 2) + (legTopSize / 2)
                }),
                tableLeg('v-rightfront', {
                    x: position.x + (width / 2) - (legTopSize / 2),
                    y: position.y + (legHeight / 2) - (topThickness / 2),
                    z: position.z - (depth / 2) + (legTopSize / 2)
                }),
                tableLeg('v-leftback', {
                    x: position.x - (width / 2) + (legTopSize / 2),
                    y: position.y + (legHeight / 2) - (topThickness / 2),
                    z: position.z + (depth / 2) - (legTopSize / 2)
                }),
                tableLeg('v-rightback', {
                    x: position.x + (width / 2) - (legTopSize / 2),
                    y: position.y + (legHeight / 2) - (topThickness / 2),
                    z: position.z + (depth / 2) - (legTopSize / 2)
                }),
            ];
        }
        return [
            {
                name: 'camera1',
                type: 'freeCamera',
                position: { x: 0, y: 10, z: -17 },
                relativeTo: "$origin",
                target: { x: 0, y: 5, z: 0 },
                attachControl: "renderCanvas"
            },
            basicLights(),
            {
                name: 'dirt',
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                diffuseTexture: { type: 'texture', url: 'ground.jpg', uScale: 4, vScale: 4 }
            },
            groundFromHeightMap('ground1', 50, 50, 0, 3, "heightMap.png", "dirt"),
            table('table1', { x: 0, y: 0, z: 0 }, 'ground1'),
            { name: 'shadow2', type: 'shadowGenerator', light: 'light1', renderList: select("table1-v") }
        ];
    }
    function statusMessage(model) {
        function statusTextMaterial(name, msg1, msg2) {
            return {
                name: name,
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                alpha: HOLO_ALPHA,
                diffuseTexture: {
                    type: 'dynamicTexture',
                    name: name + "-texture",
                    width: 512,
                    height: 60,
                    vScale: 1,
                    renderCallback: 'function callback(texture) { \n' + '    texture.drawText("' + msg1 + '", 5, 20, "bold 20px Segoe UI", "white", "#555555"); \n' + '    texture.drawText("' + msg2 + '", 5, 40, "bold 16px Segoe UI", "white", null); \n' + '}; callback;'
                }
            };
        }
        var topStatusName = 'topStatus(' + model.scrollSpeed + ')';
        return [
            statusTextMaterial(topStatusName, "Virtualized scrolling through 100 items (current:" + model.scrollSpeed + ")", "+ increase scroll left, - increase scroll right, R randomizes values"),
            {
                name: 'status',
                type: 'plane',
                position: { x: -1.2, y: -1, z: 3 },
                scaling: { x: 1.25 / 3, y: .20 / 3, z: 1 },
                rotation: { x: 0, y: -.2, z: 0 },
                relativeTo: '$camera',
                size: 2,
                material: topStatusName
            }
        ];
    }
    function initialize() {
        var values = [];
        for (var i = 0; i < 100; i++) {
            values.push(i);
        }
        return {
            values: values.map(function (x) { return Math.round(Math.random() * 11); }),
            scrollSpeed: -.1,
            offsetX: 0,
            columnStart: 5,
            columnCount: 7,
            hover: ""
        };
    }
    App.initialize = initialize;
    // UNDONE: need real click registration
    //
    function clicked(model) {
        var h = model.hover;
        switch (model.hover) {
            case "hud1-hud1":
                model.scrollSpeed = (((model.scrollSpeed * 100) - 5) | 0) / 100;
                break;
            case "hud1-hud2":
                model.scrollSpeed = (((model.scrollSpeed * 100) + 5) | 0) / 100;
                break;
            case "hud1-hud3":
                model.values = model.values.map(function (x) { return Math.round(Math.random() * 11); });
                break;
        }
        model.hover = h;
        return model;
    }
    App.clicked = clicked;
    function updateModel(time, model) {
        model.offsetX += model.scrollSpeed;
        if (model.offsetX < -2.5) {
            model.offsetX = 0;
            model.columnStart++;
        }
        else if (model.offsetX > 0) {
            model.offsetX = -2.5;
            model.columnStart--;
        }
        return model;
    }
    App.updateModel = updateModel;
    function render(time, model) {
        var itemsPerColumn = 3;
        var totalColumns = (model.values.length / itemsPerColumn) | 0;
        var offsetX = model.offsetX;
        var startIndex = model.columnStart * itemsPerColumn % model.values.length;
        var endIndex1 = Math.min(startIndex + model.columnCount * itemsPerColumn, model.values.length);
        var valuesToRender = model.values.slice(startIndex, endIndex1);
        if (endIndex1 - startIndex < model.columnCount * itemsPerColumn) {
            valuesToRender = valuesToRender.concat(model.values.slice(0, model.columnCount * itemsPerColumn - valuesToRender.length));
        }
        var displayIndex = function (index) { return (index + startIndex) % model.values.length; };
        var calcX = function (index) { return 2.5 + offsetX + (((index / itemsPerColumn) | 0) - model.columnCount / 2) * 2.5; };
        function holo_diffuse(name, url) {
            return { name: name, type: 'material', diffuseTexture: { type: 'texture', url: url }, alpha: HOLO_ALPHA };
        }
        return [
            createWorld(),
            statusMessage(model),
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (value) { return holo_diffuse('image(' + value + ')', 'images/' + value + '.jpg'); }),
            valuesToRender.map(function (value, index) { return {
                name: 'vis(' + displayIndex(index) + ')',
                type: 'plane',
                position: {
                    x: calcX(index),
                    y: 1.5 + ((index % itemsPerColumn)) * 2.5,
                    z: -Math.abs(calcX(index) / 6)
                },
                rotation: { x: .3, y: calcX(index) / 16, z: 0 },
                relativeTo: "table1-v-top",
                size: 2,
                material: 'image(' + value + ')'
            }; }),
            hud('hud1', model.hover)
        ];
    }
    App.render = render;
    ;
})(App || (App = {}));
var Rnb;
(function (Rnb) {
    var Runtime;
    (function (Runtime) {
        // UNDONE to enabled $camera, we stash away a camera reference. Seems like there
        // should be a cleaner way to do this more generically
        //
        var globalCamera;
        // creation of new meshes can be expensive, to avoid hanging the UI thread, I limit
        // the number of expensive operations per frame. The rest will be picked up on the 
        // next frame
        //
        var MAX_UPDATES = 20;
        // all of these update handlers are pretty bogus. Once DIFF becomes smart enough, we should clearly only 
        // update the changed values.
        // 
        function updatePosition(item, r, realObjects) {
            // eventually "$origin" shouldn't be supported except for surface reconstruction
            //
            var relativeTo = item.relativeTo || "$origin";
            switch (relativeTo) {
                case "$origin":
                    r.position.x = item.position.x;
                    r.position.y = item.position.y;
                    r.position.z = item.position.z;
                    break;
                case "$camera":
                    r.parent = globalCamera;
                    r.position.x = item.position.x;
                    r.position.y = item.position.y;
                    r.position.z = item.position.z;
                    break;
                default:
                    var relative = realObjects[relativeTo];
                    if (relative) {
                        // UNDONE: right now this is relative to the center of the object, we really
                        // need proper pins on any mesh point... also, consider rotation, scale, etc... 
                        //
                        r.position.x = relative.position.x + item.position.x;
                        r.position.y = relative.position.y + item.position.y;
                        r.position.z = relative.position.z + item.position.z;
                    }
                    else {
                        r.position.x = item.position.x;
                        r.position.y = item.position.y;
                        r.position.z = item.position.z;
                    }
                    break;
            }
        }
        function updateGeometryProps(item, includeExpensive, realObjects, r) {
            if (item.scaling) {
                r.scaling.x = item.scaling.x;
                r.scaling.y = item.scaling.y;
                r.scaling.z = item.scaling.z;
            }
            if (item.rotation) {
                r.rotation.x = item.rotation.x;
                r.rotation.y = item.rotation.y;
                r.rotation.z = item.rotation.z;
            }
            updatePosition(item, r, realObjects);
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
            plane: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = BABYLON.Mesh.CreatePlane(item.name, item.size, scene);
                    updateGeometryProps(item, true, realObjects, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, true, realObjects, realObjects[rawItem.name]);
                }
            },
            box: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = BABYLON.Mesh.CreateBox(item.name, item.size, scene);
                    updateGeometryProps(item, true, realObjects, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, true, realObjects, realObjects[rawItem.name]);
                }
            },
            cylinder: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = BABYLON.Mesh.CreateCylinder(item.name, item.height, item.diameterTop, item.diameterBottom, item.tessellation || 20, item.subdivisions, scene);
                    updateGeometryProps(item, true, realObjects, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, true, realObjects, realObjects[rawItem.name]);
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
                        // anything used in mesh creation forces a regen of the mesh, this is why updating "scaling" is much
                        // better than adjusting "height"
                        //
                        if (n.height !== o.height || n.diameterTop !== o.diameterTop || n.diameterBottom !== o.diameterBottom || n.tessellation !== o.tessellation || n.subdivisions !== o.subdivisions) {
                            newItem.action = "recreate";
                        }
                        else {
                            // preserve recreate from previous diffs
                            newItem.action = o.action || "update";
                        }
                        // UNDONE: target diff
                        return newItem;
                    }
                }
            },
            torus: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = BABYLON.Mesh.CreateTorus(item.name, item.diameter, item.thickness, item.tessellation || 20, scene);
                    updateGeometryProps(item, true, realObjects, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, true, realObjects, realObjects[rawItem.name]);
                }
            },
            sphere: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = BABYLON.Mesh.CreateSphere(item.name, item.segments || 16, item.diameter, scene, true);
                    updateGeometryProps(item, true, realObjects, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    updateGeometryProps(item, true, realObjects, realObjects[item.name]);
                }
            },
            ground: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = BABYLON.Mesh.CreateGround(item.name, item.width, item.depth, item.segments, scene);
                    updateGeometryProps(item, true, realObjects, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, false, realObjects, realObjects[rawItem.name]);
                }
            },
            groundFromHeightMap: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = BABYLON.Mesh.CreateGroundFromHeightMap(item.name, item.url, item.width, item.depth, item.segments, item.minHeight, item.maxHeight, scene, false);
                    updateGeometryProps(item, true, realObjects, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, false, realObjects, realObjects[rawItem.name]);
                }
            },
            hemisphericLight: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = new BABYLON.HemisphericLight(item.name, new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z), scene);
                    updateLightProps(item, r);
                    if (item.groundColor) {
                        r.groundColor.r = item.groundColor.r;
                        r.groundColor.g = item.groundColor.g;
                        r.groundColor.b = item.groundColor.b;
                    }
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name];
                    updateLightProps(item, r);
                    if (item.groundColor) {
                        r.groundColor.r = item.groundColor.r;
                        r.groundColor.g = item.groundColor.g;
                        r.groundColor.b = item.groundColor.b;
                    }
                }
            },
            pointLight: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = new BABYLON.PointLight(item.name, new BABYLON.Vector3(item.position.x, item.position.y, item.position.z), scene);
                    updateLightProps(item, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name];
                    updatePosition(item, r, realObjects);
                    updateLightProps(item, r);
                }
            },
            directionalLight: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = new BABYLON.DirectionalLight(item.name, new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z), scene);
                    updatePosition(item, r, realObjects);
                    updateLightProps(item, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name];
                    r.direction = new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z);
                    updatePosition(item, r, realObjects);
                    updateLightProps(item, r);
                }
            },
            shadowGenerator: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = new BABYLON.ShadowGenerator(1024, realObjects[item.light]);
                    r.usePoissonSampling = item.usePoissonSampling;
                    r.useVarianceShadowMap = item.useVarianceShadowMap;
                    var renderList = r.getShadowMap().renderList;
                    for (var i = 0; i < item.renderList.length; i++) {
                        renderList.push(realObjects[item.renderList[i]]);
                    }
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name];
                    var renderList = r.getShadowMap().renderList;
                    var needRecreate = true;
                    if (renderList.length == item.renderList.length) {
                        var allMatch = true;
                        for (var i = 0; i < item.renderList.length && needRecreate; i++) {
                            allMatch = allMatch && (renderList[i].name === item.renderList[i]);
                        }
                        needRecreate = !allMatch;
                    }
                    if (needRecreate) {
                        renderList.splice(0, renderList.length);
                        for (var i = 0; i < item.renderList.length; i++) {
                            renderList.push(realObjects[item.renderList[i]]);
                        }
                    }
                }
            },
            material: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name] = new BABYLON.StandardMaterial(item.name, scene);
                    if (item.alpha) {
                        r.alpha = item.alpha;
                    }
                    if (item.diffuseColor) {
                        r.diffuseColor = new BABYLON.Color3(item.diffuseColor.r, item.diffuseColor.g, item.diffuseColor.b);
                    }
                    if (item.diffuseTexture) {
                        var sharedTexture;
                        var dynamicTexture;
                        var texture = item.diffuseTexture;
                        if (item.diffuseTexture.type === "texture") {
                            sharedTexture = new BABYLON.Texture(texture.url, scene);
                        }
                        else if (item.diffuseTexture.type === "dynamicTexture") {
                            var dt = item.diffuseTexture;
                            sharedTexture = dynamicTexture = new BABYLON.DynamicTexture(dt.name, { width: dt.width, height: dt.height }, scene, true);
                        }
                        r.diffuseTexture = sharedTexture;
                        if (texture.uOffset) {
                            sharedTexture.uOffset = texture.uOffset;
                        }
                        if (texture.vOffset) {
                            sharedTexture.vOffset = texture.vOffset;
                        }
                        if (texture.uScale) {
                            sharedTexture.uScale = texture.uScale;
                        }
                        if (texture.vScale) {
                            sharedTexture.vScale = texture.vScale;
                        }
                        if (texture.uAng) {
                            sharedTexture.uAng = texture.uAng;
                        }
                        if (texture.vAng) {
                            sharedTexture.vAng = texture.vAng;
                        }
                        if (texture.wAng) {
                            sharedTexture.wAng = texture.wAng;
                        }
                        if (item.diffuseTexture.type === "dynamicTexture") {
                            var t = eval(dt.renderCallback);
                            t.call(null, dynamicTexture);
                        }
                    }
                    if (item.specularColor) {
                        r.specularColor = new BABYLON.Color3(item.specularColor.r, item.specularColor.g, item.specularColor.b);
                    }
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    // UNDONE: update material - need really diffing for that
                }
            },
            freeCamera: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = globalCamera = realObjects[item.name] = new BABYLON.FreeCamera(item.name, new BABYLON.Vector3(item.position.x, item.position.y, item.position.z), scene);
                    r.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                    if (item.attachControl) {
                        r.attachControl(document.getElementById(item.attachControl), true);
                    }
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r = realObjects[item.name];
                    r.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                    updatePosition(item, r, realObjects);
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
                        if (n.position.x !== o.position.x || n.position.y !== o.position.y || n.position.z !== o.position.z) {
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
            var result = [];
            for (var i = 0; i < scene.length; i++) {
                var value = scene[i];
                if (value instanceof Array) {
                    var composite = flatten(value);
                    for (var i2 = 0; i2 < composite.length; i2++) {
                        result.push(composite[i2]);
                    }
                }
                else {
                    result.push(value);
                }
            }
            return result;
        }
        // functions in the graph allow for lazy evaluation and graph queries, the common
        // one I hit was the desire to get a list of all XXX elements to create shadows
        //
        function resolveFunctions(scene) {
            var result = [];
            for (var i = 0; i < scene.length; i++) {
                var value = scene[i];
                if (value) {
                    var childKeys = Object.keys(value);
                    for (var i2 = 0; i2 < childKeys.length; i2++) {
                        if (value[childKeys[i2]] instanceof Function) {
                            value[childKeys[i2]] = value[childKeys[i2]](scene);
                        }
                    }
                }
                result.push(value);
            }
            return result;
        }
        // Incredibly niave implementation of DIFF... really this should just be replaced
        // by React, i need to see how hard that would be with my own custom OM as the
        // backend/DOM.
        //
        // When this switched from a record diff (SceneGraph used to be a record) this introduced
        // another side effect - reordering of elements will end up with extra delete/create, this
        // isn't desirable.
        //
        function diff(master, newScene) {
            var newFlat = resolveFunctions(flatten(newScene));
            if (!master) {
                for (var i = 0; i < newFlat.length; i++) {
                    newFlat[i].action = "create";
                }
                return newFlat;
            }
            else {
                var result = [];
                var masterIndex = 0;
                var newIndex = 0;
                for (newIndex = 0; newIndex < newFlat.length; newIndex++) {
                    var foundMatch = false;
                    for (var masterSearch = 0; !foundMatch && masterSearch + masterIndex < master.length; masterSearch++) {
                        // found match, diff the two and advance "masterIndex" up to current
                        //
                        if (master[masterSearch + masterIndex].name == newFlat[newIndex].name && master[masterSearch + masterIndex].type == newFlat[newIndex].type) {
                            foundMatch = true;
                            for (var i = 0; i < masterSearch; i++) {
                                var del = master[masterIndex++];
                                del.action = "delete";
                                result.push(del);
                            }
                            // second, diff the two items, now we are up to "current"
                            //
                            var n = newFlat[newIndex];
                            var o = master[masterIndex++];
                            var diff_handler = handlers[o.type].diff;
                            if (diff_handler) {
                                result.push(diff_handler(n, o));
                            }
                            else {
                                n.action = "update";
                                result.push(n);
                            }
                        }
                    }
                    if (!foundMatch) {
                        newFlat[newIndex].action = "create";
                        result.push(newFlat[newIndex]);
                    }
                }
                for (; masterIndex < master.length; masterIndex++) {
                    var del = master[masterIndex];
                    del.action = "delete";
                    result.push(del);
                }
                return result;
            }
        }
        ;
        // Poorly factored and horribly inneficient. This started as 20 lines, and kept growing. 
        // Desparately needs refactoring and some design work
        //
        function applyActions(dom, scene, realObjects) {
            var result = [];
            var updateCount = 0;
            for (var i = 0; i < dom.length; i++) {
                var item = dom[i];
                // hack, hack, hack... 
                //
                if (updateCount > MAX_UPDATES) {
                    if (item.action == "update" || item.action == "delete" || item.action == "recreate") {
                        result.push(item);
                    }
                    continue;
                }
                switch (item.action) {
                    case "create":
                        updateCount++;
                        delete item.action;
                        handlers[item.type].create(item, dom, scene, realObjects);
                        result.push(item);
                        break;
                    case "recreate":
                        updateCount++;
                        realObjects[item.name].dispose();
                        delete realObjects[item.name];
                        delete item.action;
                        handlers[item.type].create(item, dom, scene, realObjects);
                        result.push(item);
                        break;
                    case "update":
                        delete item.action;
                        handlers[item.type].update(item, dom, scene, realObjects);
                        result.push(item);
                        break;
                    case "delete":
                        updateCount++;
                        realObjects[item.name].dispose();
                        delete realObjects[item.name];
                        break;
                    default:
                        result.push(item);
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
            var engine = new BABYLON.Engine(canvas, true);
            var scene = new BABYLON.Scene(engine);
            var lastDom = null;
            var realObjects = {};
            var model = App.initialize();
            // UNDONE: need to do mouse/etc for x-browser
            //
            function updateHover(evt) {
                var pickResult = scene.pick(evt.offsetX, evt.offsetY, function (mesh) {
                    return mesh.name.indexOf("ground") == -1;
                });
                if (pickResult.hit) {
                    if (model.hover !== pickResult.pickedMesh.name) {
                        model.hover = pickResult.pickedMesh.name;
                    }
                }
                else {
                    if (model.hover) {
                        model.hover = "";
                    }
                }
            }
            canvas.addEventListener("pointermove", updateHover);
            canvas.addEventListener("pointerup", function (evt) {
                updateHover(evt);
                if (model.hover) {
                    model = App.clicked(model);
                }
            });
            var frameCount = 0;
            var updateFrame = function () {
                model = App.updateModel(frameCount, model);
                lastDom = diff(lastDom, App.render(frameCount, model));
                lastDom = applyActions(lastDom, scene, realObjects);
                frameCount++;
            };
            updateFrame();
            engine.runRenderLoop(function () {
                updateFrame();
                scene.render();
            });
            window.addEventListener("resize", function () {
                engine.resize();
            });
        }));
    })(Runtime = Rnb.Runtime || (Rnb.Runtime = {}));
})(Rnb || (Rnb = {}));
