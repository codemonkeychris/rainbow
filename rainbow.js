///<reference path='Babylon.js-2.0/references/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/references/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
var Rainbow;
(function (Rainbow) {
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
                    r.wireframe = item.wireframe;
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
        // UNDONE: obviously "extends {hover:string}" is temporary... 
        function start(canvas, rootComponent) {
            var engine = new BABYLON.Engine(canvas, true);
            var scene = new BABYLON.Scene(engine);
            var lastDom = null;
            var realObjects = {};
            var model = rootComponent.initialize ? rootComponent.initialize() : { hover: "" };
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
