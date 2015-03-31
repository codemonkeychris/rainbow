function render(time, model) {
    var root = { children: [] };

    var objectBaseY = 1;

    root.children["camera1"] = {
        type: 'freeCamera',
        x: (Math.sin(time/40) * 10), 
        y: objectBaseY+5, 
        z: (Math.sin((time+20)/40) * 10),
        target: {x:0, y:objectBaseY, z:0}
    };
    root.children["light1"] = {
        type: 'directionalLight',
        x: 0, 
        y: objectBaseY+12, 
        z: 0,
        direction: {x:0, y:-1, z:.1},
        intensity: .7,
        diffuse: {r:.9, g:.9, b:1},
        specular: {r:1, g:1, b:1},
    };

    root.children["light2"] = {
        type: 'directionalLight',
        x: root.children["camera1"].x, 
        y: root.children["camera1"].y * 2, 
        z: root.children["camera1"].z*1.2,
        direction: {
            x:-root.children["camera1"].x, 
            y:-root.children["camera1"].y, 
            z:-root.children["camera1"].z
        },
        diffuse: {r:.5, g:.5, b:.5},
        specular: {r:1, g:1, b:1},
    };

    root.children["material1"] = {
        type: 'material',
        diffuseTexture: {type:'texture', url:'seamless_stone_texture.jpg'}
    };

    root.children["groundMaterial"] = {
        type: 'material',
        diffuseTexture: {type:'texture', url:'ground.jpg', uScale:4, vScale:4, specularColor: {r:0, g:0, b:0}}
    };

    var shadowNames = [];
    for (var i=0; i<=model.length; i++) {
        var name = 'vis('+i+')';
        shadowNames.push(name);
        root.children[name] = { 
            type:'box', 
            x: i - model.length / 2,
            y: 1 + (model[i] / 2),
            z: 0,
            size: 1,
            scaling: { x:.8, y:model[i], z:.8 },
            material: "material1"
        };
    }

    root.children["ground1"] = { 
        type: 'ground', 
        width:50, 
        depth:50, 
        segments:8, 
        material:"groundMaterial" 
    };

    root.children["shadow1"] = { 
        type: 'shadowGenerator',
        light: "light2", 
        renderList: shadowNames
    };

    root.children["shadow2"] = { 
        type: 'shadowGenerator',
        light: "light1", 
        renderList: shadowNames
    };

    return root;
};

(function() {
    var MAX_UPDATES = 20;

    function diff(master, newScene) {
        if (!master) {
                var keys = Object.keys(newScene.children);
            for (var i=0; i<keys.length; i++) {
                newScene.children[keys[i]].action = "create";
            }
            return newScene;
        }
        else {
            var keys = Object.keys(master.children);
            for (var i=0; i<keys.length; i++) {
                var name = keys[i];
                if (!newScene.children[name]) {
                    master.children[name].action = "delete";
                }
                else {
                    newScene.children[name].instance = master.children[name].instance;
                    master.children[name] = newScene.children[name];
                    master.children[name].action = "update";
                    newScene.children[name] = null;
                }
            }
            var keys = Object.keys(newScene.children);
            for (var i=0; i<keys.length; i++) {
                var name = keys[i];
                if (newScene.children[name]) {
                    newScene.children[name].action = "create";
                    master.children[name] = newScene.children[name];
                }
            }
            return master;
        }
    };
    function applyActions(dom, scene) {
        var keys = Object.keys(dom.children);
        var result = { children: {} };

        var updateCount = 0;

        for (var i=0; i<keys.length; i++) {
            var name = keys[i];
            var item = dom.children[name];

            // hack, hack, hack... 
            //
            if (updateCount > MAX_UPDATES) {
                if (item.action == "update" || item.action == "delete") {
                    result.children[name] = item;
                }
                continue;
            }

            switch (item.action) {
                case "create":
                    updateCount++;
                    switch (item.type) {
                        case "shadowGenerator":
                            item.instance = new BABYLON.ShadowGenerator(1024, result.children[item.light].instance);
                            item.instance.usePoissonSampling = true;
                            var renderList = item.instance.getShadowMap().renderList;
                            for (var i=0; i<item.renderList.length; i++) {
                                renderList.push(result.children[item.renderList[i]].instance);
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
                                item.instance.material = result.children[item.material].instance;
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
                                item.instance.material = result.children[item.material].instance;
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
                                item.instance.material = result.children[item.material].instance;
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
                    result.children[name] = item;
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
                    result.children[name] = item;
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