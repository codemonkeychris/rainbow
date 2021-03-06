// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root 
//
///<reference path='../Babylon.js-2.0/References/poly2tri.d.ts' />
///<reference path='../Babylon.js-2.0/References/waa.d.ts' />
///<reference path='../Babylon.js-2.0/babylon.d.ts' />
var Rainbow;
(function (Rainbow) {
    var RecordOperations;
    (function (RecordOperations) {
        // from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
        // polyfill for ES6 assign method (fixed for TS warn/errors)
        //
        function assign(target) {
            'use strict';
            var sources = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                sources[_i - 1] = arguments[_i];
            }
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert first argument to object');
            }
            var to = Object(target);
            for (var i = 0; i < sources.length; i++) {
                var nextSource = sources[i];
                if (nextSource === undefined || nextSource === null) {
                    continue;
                }
                var keysArray = Object.keys(Object(nextSource));
                for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                    var nextKey = keysArray[nextIndex];
                    var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                    if (desc !== undefined && desc.enumerable) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
            return to;
        }
        RecordOperations.assign = assign;
        ;
        var o = Object;
        if (!o.assign) {
            Object.defineProperty(Object, 'assign', {
                enumerable: false,
                configurable: true,
                writable: true,
                value: assign
            });
        }
    })(RecordOperations = Rainbow.RecordOperations || (Rainbow.RecordOperations = {}));
})(Rainbow || (Rainbow = {}));
var Rainbow;
(function (Rainbow) {
    (function (BillboardMode) {
        BillboardMode[BillboardMode["None"] = 0] = "None";
        BillboardMode[BillboardMode["X"] = 1] = "X";
        BillboardMode[BillboardMode["Y"] = 2] = "Y";
        BillboardMode[BillboardMode["Z"] = 3] = "Z";
        BillboardMode[BillboardMode["All"] = 4] = "All";
    })(Rainbow.BillboardMode || (Rainbow.BillboardMode = {}));
    var BillboardMode = Rainbow.BillboardMode;
})(Rainbow || (Rainbow = {}));
var Rainbow;
(function (Rainbow) {
    var World;
    (function (World) {
        var HOLO_ALPHA = .6;
        var worldColors = {
            table: { r: 244 / 256, g: 122 / 256, b: 99 / 256 },
            walls: { r: 189 / 256, g: 180 / 256, b: 189 / 256 },
            floor: { r: 231 / 256, g: 231 / 256, b: 231 / 256 }
        };
        function createWalls(name, width, depth, height, position, relativeTo, material) {
            var thickness = .5;
            var yOffset = .5 + height / 2;
            return [
                {
                    type: 'box',
                    name: name + '-left',
                    size: 1,
                    position: { x: position.x - width / 2 + thickness / 2, y: position.y + yOffset, z: position.z },
                    scaling: { x: thickness, y: height, z: depth - thickness },
                    relativeTo: relativeTo,
                    enablePhysics: true,
                    mass: 20,
                    material: 'mat'
                },
                {
                    type: 'box',
                    name: name + '-right',
                    size: 1,
                    position: { x: position.x + width / 2 - thickness / 2, y: position.y + yOffset, z: position.z },
                    scaling: { x: thickness, y: height, z: depth - thickness },
                    relativeTo: relativeTo,
                    enablePhysics: true,
                    mass: 20,
                    material: 'mat'
                },
                {
                    type: 'box',
                    name: name + '-back',
                    size: 1,
                    position: { x: position.x, y: position.y + yOffset, z: position.z + depth / 2 },
                    scaling: { x: width, y: height, z: thickness },
                    relativeTo: relativeTo,
                    enablePhysics: true,
                    mass: 20,
                    material: 'mat'
                },
                {
                    type: 'box',
                    name: name + '-front',
                    size: 1,
                    position: { x: position.x, y: position.y + yOffset, z: position.z - depth / 2 },
                    scaling: { x: width, y: height, z: thickness },
                    relativeTo: relativeTo,
                    enablePhysics: true,
                    mass: 20,
                    material: 'mat'
                },
            ];
        }
        World.createWalls = createWalls;
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
                return function (x) { return x.filter(function (item) { return item.name.indexOf(pattern) != -1; }).map(function (item) { return item.name; }); };
            }
            function ground(name, width, depth, material) {
                // heightmap based ground doesn't work for physics... boo!
                return {
                    name: name,
                    type: 'box',
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "$origin",
                    size: 1,
                    scaling: { x: 100, y: 1, z: 100 },
                    material: material,
                    enablePhysics: true,
                    mass: 0,
                    friction: 3,
                    restitution: 0.001
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
                        material: materialName,
                        enablePhysics: true,
                        mass: 0,
                        friction: .5,
                        restitution: .07
                    };
                }
                ;
                return [
                    { name: materialName, type: 'material', diffuseColor: worldColors.table },
                    {
                        name: name + '-v-top',
                        type: 'box',
                        position: { x: position.x, y: position.y + legHeight, z: position.z },
                        relativeTo: relativeTo,
                        size: 1,
                        scaling: { x: width, y: topThickness, z: depth },
                        material: materialName,
                        enablePhysics: true,
                        mass: 0,
                        friction: 1,
                        restitution: .07
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
                { name: 'walls', type: 'material', diffuseColor: worldColors.walls },
                {
                    name: 'dirt',
                    type: 'material',
                    diffuseColor: worldColors.floor
                },
                ground('ground1', 50, 50, "dirt"),
                createWalls('wall1', 100, 100, 20, { x: 0, y: 0, z: 0 }, 'ground1', 'walls'),
                table('table1', { x: 0, y: 0, z: 0 }, 'ground1'),
                { name: 'shadow2', type: 'shadowGenerator', light: 'light1', renderList: select("table1-v") }
            ];
        }
        var click_handlers = {};
        function statusMessage(msg1, msg2) {
            function statusTextMaterial(name) {
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
                        renderCallback: 'function callback(texture) { \n' +
                            '    texture.drawText("' + msg1 + '", 5, 20, "bold 20px Segoe UI", "white", "#555555"); \n' +
                            '    texture.drawText("' + (msg2 ? msg2 : "") + '", 5, 40, "bold 16px Segoe UI", "white", null); \n' +
                            '}; callback;'
                    }
                };
            }
            var topStatusName = 'topStatus';
            return [
                statusTextMaterial(topStatusName),
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
        function hud(name, hoverModel, buttons) {
            var hoverMaterialName = name + '-mat2';
            function hudControl(name, material, x) {
                return {
                    name: name,
                    type: 'sphere',
                    position: { x: x, y: -1, z: 3 },
                    relativeTo: '$camera',
                    diameter: .3,
                    segments: 12,
                    material: hoverModel == name ? material + "-selected" : material
                };
            }
            function ballTextMaterial(name, msg, selected) {
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
                        renderCallback: 'function callback(texture) { texture.drawText("' + msg + '", null, 80, "50px Segoe UI", "black", "' + (selected ? '#FF0000' : '#CCCCCC') + '"); }; callback;'
                    }
                };
            }
            var scene = buttons.map(function (button, index) {
                var button_name = name + "-hud" + index;
                click_handlers[button_name] = button.clicked;
                return [
                    ballTextMaterial(button_name + '-mat', button.text, false),
                    ballTextMaterial(button_name + '-mat-selected', button.text, true),
                    hudControl(button_name, button_name + '-mat', index / 3)
                ];
            });
            scene.push({ name: hoverMaterialName, type: 'material', diffuseColor: { r: 1, g: 0.2, b: .2 }, alpha: HOLO_ALPHA });
            return scene;
        }
        function make(rootComponent, statusLine1, statusLine2, buttons) {
            return {
                updateModel: function (frameNumber, model) {
                    model.model.hover = model.hover;
                    if (rootComponent.updateModel) {
                        var nested = rootComponent.updateModel(frameNumber, model.model);
                        return { model: nested, hover: nested.hover };
                    }
                    else {
                        return model;
                    }
                },
                initialize: function () {
                    // UNDONE: hardcode what we are relative to... eventually want this
                    // to be clickable to move the rendering around... :)
                    //
                    var nested = rootComponent.initialize ? rootComponent.initialize() : {};
                    nested.position = { x: 0, y: 0, z: 0 };
                    nested.relativeTo = "table1-v-top";
                    return { model: nested, hover: "" };
                },
                clicked: function (model) {
                    if (rootComponent.clicked) {
                        model.model.hover = model.hover;
                        var nested = rootComponent.clicked(model.model);
                        model = { model: nested, hover: nested.hover };
                    }
                    if (click_handlers[model.hover]) {
                        // UNDONE: should click handlers return a new model, or just mutate?
                        click_handlers[model.hover](model.model);
                    }
                    return model;
                },
                render: function (frameNumber, model, data) {
                    return [
                        createWorld(),
                        rootComponent.render(frameNumber, model.model, data.model),
                        buttons && hud('hud1', model.hover, buttons),
                        (statusLine1 || statusLine2) && statusMessage(statusLine1, statusLine2)
                    ];
                }
            };
        }
        World.make = make;
    })(World = Rainbow.World || (Rainbow.World = {}));
})(Rainbow || (Rainbow = {}));
var Rainbow;
(function (Rainbow) {
    var Controls;
    (function (Controls) {
        var R = Rainbow;
        var StickyNote = (function () {
            function StickyNote(name) {
                this.name = name;
            }
            StickyNote.prototype.initialize = function () {
                return {};
            };
            // updateModel(time: number, model: StickyNoteViewModel) : StickyNoteViewModel {
            //     return model;
            // }
            // clicked: function() {
            // }
            StickyNote.prototype.render = function (time, viewModel, dataModel) {
                function statusTextMaterial(name) {
                    return {
                        name: name,
                        type: 'material',
                        specularColor: { r: 248 / 256, g: 202 / 256, b: 0 },
                        diffuseTexture: {
                            type: 'dynamicTexture',
                            name: name + "-texture",
                            width: 256,
                            height: 60,
                            vScale: 1,
                            renderCallback: 'function callback(texture) { \n' +
                                '    texture.drawText("' + dataModel[0] + '", 5, 20, "bold 15px Segoe UI", "black", "#F8CA00"); \n' +
                                '    texture.drawText("' + (dataModel[1] ? dataModel[1] : "") + '", 5, 40, "bold 12px Segoe UI", "black", null); \n' +
                                '}; callback;'
                        }
                    };
                }
                var topStatusName = this.name + '-mat';
                return [
                    statusTextMaterial(topStatusName),
                    {
                        name: this.name,
                        type: 'plane',
                        position: viewModel.position,
                        scaling: { x: 2, y: .5, z: 1 },
                        billboardMode: R.BillboardMode.All,
                        relativeTo: viewModel.relativeTo,
                        size: 2,
                        material: topStatusName
                    }
                ];
            };
            return StickyNote;
        })();
        Controls.StickyNote = StickyNote;
    })(Controls = Rainbow.Controls || (Rainbow.Controls = {}));
})(Rainbow || (Rainbow = {}));
var Rainbow;
(function (Rainbow) {
    var Runtime;
    (function (Runtime) {
        var R = Rainbow;
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
        function animatePosition(item, r, realObjects) {
            var relativeTo = item.relativeTo || "$origin";
            var basePosition = r.position;
            var offset = BABYLON.Vector3.Zero();
            switch (relativeTo) {
                case "$origin":
                case "$camera":
                    break;
                default:
                    var relative = realObjects[relativeTo];
                    if (relative) {
                        offset = relative.position;
                    }
                    break;
            }
            var goal = new BABYLON.Vector3(item.animation.position.x, item.animation.position.y, item.animation.position.z).add(offset);
            r.position = calcVector3AnimationFrame(basePosition, goal, item.animation.velocity);
        }
        function calcVector3AnimationFrame(current, goal, maxDelta) {
            maxDelta = maxDelta || .1;
            var delta = goal.subtract(current);
            var length = delta.length();
            var scale = 1;
            if (length > maxDelta) {
                scale = maxDelta / length;
            }
            var maxWithVelocity = delta.scale(scale);
            return current.add(maxWithVelocity);
        }
        function updateGeometryProps(item, includeExpensive, forcePositionOnPhysics, realObjects, r) {
            if (item.scaling) {
                if (forcePositionOnPhysics || !item.animation || !item.animation.scaling) {
                    r.scaling.x = item.scaling.x;
                    r.scaling.y = item.scaling.y;
                    r.scaling.z = item.scaling.z;
                }
                else {
                    r.scaling = calcVector3AnimationFrame(r.scaling, new BABYLON.Vector3(item.animation.scaling.x, item.animation.scaling.y, item.animation.scaling.z), item.animation.scalingVelocity);
                }
            }
            if (item.rotation) {
                if (forcePositionOnPhysics || !item.animation || !item.animation.rotation) {
                    r.rotation.x = item.rotation.x;
                    r.rotation.y = item.rotation.y;
                    r.rotation.z = item.rotation.z;
                }
                else {
                    r.rotation = calcVector3AnimationFrame(r.rotation, new BABYLON.Vector3(item.animation.rotation.x, item.animation.rotation.y, item.animation.rotation.z), item.animation.rotationVelocity);
                }
            }
            if (item.animation && item.animation.position) {
                if (forcePositionOnPhysics) {
                    updatePosition(item, r, realObjects);
                }
                else {
                    animatePosition(item, r, realObjects);
                }
            }
            else {
                if (forcePositionOnPhysics || !item.enablePhysics) {
                    updatePosition(item, r, realObjects);
                }
            }
            if (item.billboardMode) {
                switch (item.billboardMode) {
                    case R.BillboardMode.None:
                        r.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
                        break;
                    case R.BillboardMode.X:
                        r.billboardMode = BABYLON.Mesh.BILLBOARDMODE_X;
                        break;
                    case R.BillboardMode.Y:
                        r.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
                        break;
                    case R.BillboardMode.Z:
                        r.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Z;
                        break;
                    case R.BillboardMode.All:
                        r.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
                        break;
                }
            }
            if (includeExpensive) {
                r.receiveShadows = true;
                if (item.material) {
                    r.material = realObjects[item.material];
                }
            }
        }
        function updatePhysicsProps(item, r, physicsImposter) {
            if (item.enablePhysics) {
                r.setPhysicsState(physicsImposter, { mass: item.mass, friction: item.friction || 1, restitution: item.restitution || 1 });
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
            line: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        var initialLine = BABYLON.Mesh.CreateLines(item.name, item.points.map(function (v) { return new BABYLON.Vector3(v.x, v.y, v.z); }), scene);
                        r = initialLine;
                        if (item.color) {
                            initialLine.color = new BABYLON.Color3(item.color.r, item.color.g, item.color.b);
                        }
                    }
                    realObjects[item.name] = r;
                    updateGeometryProps(item, true, true, realObjects, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, true, false, realObjects, realObjects[rawItem.name]);
                }
            },
            plane: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        r = BABYLON.Mesh.CreatePlane(item.name, item.size, scene);
                    }
                    realObjects[item.name] = r;
                    updateGeometryProps(item, true, true, realObjects, r);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, true, false, realObjects, realObjects[rawItem.name]);
                }
            },
            box: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        r = BABYLON.Mesh.CreateBox(item.name, item.size, scene);
                    }
                    realObjects[item.name] = r;
                    updateGeometryProps(item, true, true, realObjects, r);
                    updatePhysicsProps(item, r, BABYLON.PhysicsEngine.BoxImpostor);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    updateGeometryProps(rawItem, true, false, realObjects, realObjects[rawItem.name]);
                }
            },
            cylinder: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        r = realObjects[item.name] = BABYLON.Mesh.CreateCylinder(item.name, item.height, item.diameterTop, item.diameterBottom, item.tessellation || 20, item.subdivisions, scene);
                    }
                    updateGeometryProps(item, true, true, realObjects, r);
                    updatePhysicsProps(item, r, BABYLON.PhysicsEngine.CylinderImpostor);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, true, false, realObjects, realObjects[rawItem.name]);
                },
                determineAction: function (newItem, oldItem) {
                    var n = newItem;
                    var o = oldItem;
                    // anything used in mesh creation forces a regen of the mesh, this is why updating "scaling" is much
                    // better than adjusting "height"
                    //
                    if (n.height !== o.height
                        || n.diameterTop !== o.diameterTop
                        || n.diameterBottom !== o.diameterBottom
                        || n.tessellation !== o.tessellation
                        || n.subdivisions !== o.subdivisions) {
                        newItem.action = "recreate";
                    }
                    else {
                        // preserve recreate from previous determineAction
                        newItem.action = o.action || "update";
                    }
                    // UNDONE: target determineAction
                    return newItem;
                }
            },
            torus: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        r = realObjects[item.name] = BABYLON.Mesh.CreateTorus(item.name, item.diameter, item.thickness, item.tessellation || 20, scene);
                    }
                    updateGeometryProps(item, true, true, realObjects, r);
                    updatePhysicsProps(item, r, BABYLON.PhysicsEngine.MeshImpostor);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, true, false, realObjects, realObjects[rawItem.name]);
                }
            },
            sphere: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        r = realObjects[item.name] = BABYLON.Mesh.CreateSphere(item.name, item.segments || 16, item.diameter, scene, true);
                    }
                    updateGeometryProps(item, true, true, realObjects, r);
                    updatePhysicsProps(item, r, BABYLON.PhysicsEngine.SphereImpostor);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    updateGeometryProps(item, true, false, realObjects, realObjects[item.name]);
                }
            },
            ground: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        r = realObjects[item.name] = BABYLON.Mesh.CreateGround(item.name, item.width, item.depth, item.segments, scene);
                    }
                    updateGeometryProps(item, true, true, realObjects, r);
                    updatePhysicsProps(item, r, BABYLON.PhysicsEngine.MeshImpostor);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, false, false, realObjects, realObjects[rawItem.name]);
                }
            },
            groundFromHeightMap: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        r = realObjects[item.name] =
                            BABYLON.Mesh.CreateGroundFromHeightMap(item.name, item.url, item.width, item.depth, item.segments, item.minHeight, item.maxHeight, scene, false);
                    }
                    updateGeometryProps(item, true, true, realObjects, r);
                    updatePhysicsProps(item, r, BABYLON.PhysicsEngine.MeshImpostor);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, false, false, realObjects, realObjects[rawItem.name]);
                }
            },
            extrudedShape: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        r = realObjects[item.name] =
                            BABYLON.Mesh.ExtrudeShape(item.name, item.shape.map(function (v) { return new BABYLON.Vector3(v.x, v.y, v.z); }), item.path.map(function (v) { return new BABYLON.Vector3(v.x, v.y, v.z); }), item.scale, 
                            /* rotation */ 0, scene, false);
                    }
                    updateGeometryProps(item, true, true, realObjects, r);
                    updatePhysicsProps(item, r, BABYLON.PhysicsEngine.MeshImpostor);
                },
                update: function (rawItem, dom, scene, realObjects) {
                    updateGeometryProps(rawItem, false, false, realObjects, realObjects[rawItem.name]);
                }
            },
            loadMesh: {
                create: function (rawItem, dom, scene, realObjects) {
                    var item = rawItem;
                    var r;
                    if (item.instanceName && item.instanceName !== item.name) {
                        r = realObjects[item.name] = realObjects[item.instanceName].createInstance(item.name);
                    }
                    else {
                        // UNDONE: need to deal with all objects created by this scene
                        //
                        BABYLON.SceneLoader.ImportMesh("", item.roolUrl, item.sceneFileName, scene, function (meshes, particleSystems, skeletons) {
                            r = realObjects[item.name] = meshes[0];
                            updateGeometryProps(item, true, true, realObjects, r);
                            updatePhysicsProps(item, r, BABYLON.PhysicsEngine.MeshImpostor);
                        });
                    }
                },
                update: function (rawItem, dom, scene, realObjects) {
                    var mesh = realObjects[rawItem.name];
                    if (mesh) {
                        updateGeometryProps(rawItem, false, false, realObjects, realObjects[rawItem.name]);
                    }
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
                    r.wireframe = item.wireframe;
                    r.backFaceCulling = !!item.backFaceCulling;
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
                determineAction: function (newItem, oldItem) {
                    var n = newItem;
                    var o = oldItem;
                    if (n.position.x !== o.position.x || n.position.y !== o.position.y || n.position.z !== o.position.z) {
                        newItem.action = "update";
                    }
                    // UNDONE: target determineAction
                    return newItem;
                }
            }
        };
        // JS records don't compose well in functional contexts, you can't merged function records easily (a+b), 
        // so I opt'd for a simple nested array convention which will be flattened before processing and completely
        // erased.
        //
        function flatten(scene) {
            var result = [];
            for (var i = 0; i < scene.length; i++) {
                var value = scene[i];
                if (value instanceof Array) {
                    var composite = flatten(value);
                    for (var i2 = 0; i2 < composite.length; i2++) {
                        if (composite[i2]) {
                            result.push(composite[i2]);
                        }
                    }
                }
                else if (value) {
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
                        if (master[masterSearch + masterIndex].name == newFlat[newIndex].name
                            && master[masterSearch + masterIndex].type == newFlat[newIndex].type) {
                            foundMatch = true;
                            // first, push the consumed items, to preserve order
                            //
                            for (var i = 0; i < masterSearch; i++) {
                                var del = master[masterIndex++];
                                del.action = "delete";
                                result.push(del);
                            }
                            // second, diff the two items, now we are up to "current"
                            //
                            var n = newFlat[newIndex];
                            var o = master[masterIndex++];
                            var determineAction_handler = handlers[o.type].determineAction;
                            if (determineAction_handler) {
                                result.push(determineAction_handler(n, o));
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
                // run to the end of master for any non-consumed items and mark them for deletion
                //
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
        Runtime._testExport = {
            diff: diff
        };
        // UNDONE: obviously "extends {hover:string}" is temporary... 
        // UNDONE: trackHoverOnMove exists because scene.pick is very expensive when you have lots
        // of objects on the screen. Since I'm playing with lots of stress tests (for fun), we need
        // a better solution... for now, throw in a temporary check
        //
        function start(canvas, rootComponent, trackHoverOnMove) {
            var engine = new BABYLON.Engine(canvas, true);
            var scene = new BABYLON.Scene(engine);
            scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.OimoJSPlugin());
            var lastDom = null;
            var realObjects = {};
            var model = rootComponent.initialize ? rootComponent.initialize() : { hover: "" };
            // UNDONE: need to do mouse/etc for x-browser
            //
            var lockHoverElement = false;
            function updateHover(evt) {
                if (lockHoverElement) {
                    return;
                }
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
            canvas.addEventListener("pointermove", function (evt) {
                if (trackHoverOnMove) {
                    updateHover(evt);
                }
            });
            canvas.addEventListener("pointerdown", function (evt) {
                lockHoverElement = true;
                updateHover(evt);
            });
            canvas.addEventListener("pointerup", function (evt) {
                lockHoverElement = false;
                updateHover(evt);
                if (model.hover && rootComponent.clicked) {
                    model = rootComponent.clicked(model);
                    if (!model)
                        throw "need a model!";
                }
            });
            var frameCount = 0;
            var updateFrame = function () {
                if (rootComponent.updateModel) {
                    model = rootComponent.updateModel(frameCount, model);
                    if (!model)
                        throw "need a model!";
                }
                lastDom = diff(lastDom, rootComponent.render(frameCount, model, model));
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
        }
        Runtime.start = start;
    })(Runtime = Rainbow.Runtime || (Rainbow.Runtime = {}));
})(Rainbow || (Rainbow = {}));
