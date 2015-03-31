function render(time) {
    var root = { children: [] };
    root.children["camera1"] = {
        type: 'freeCamera',
        x: (Math.sin(time/40) * 10), 
        y: 5, 
        z: (Math.sin((time+20)/40) * 10),
        target: {x:0, y:0, z:0}
    };
    root.children["light1"] = {
        type: 'directionalLight',
        x: 0, 
        y: 10, 
        z: 0,
        direction: {x:0, y:-1, z:.1},
        intensity: .7,
        diffuse: {r:1, g:1, b:1},
        specular: {r:1, g:1, b:1},
    };

    root.children["light2"] = {
        type: 'directionalLight',
        x: root.children["camera1"].x, 
        y: root.children["camera1"].y, 
        z: root.children["camera1"].y,
        direction: {
            x:-root.children["camera1"].x, 
            y:-root.children["camera1"].y, 
            z:-root.children["camera1"].z
        },
        diffuse: {r:.5, g:0, b:0},
        specular: {r:1, g:0, b:0},
    };

    var size = .5;
    var slider = document.getElementById("size");
    var zsize=4;
    var ysize=4;
    var xsize=slider.value;
    var idx = 0;
    var sphereNames = [];
    for (var y=1; y<=ysize; y++) {
        for (var z=-zsize/2; z<=zsize/2; z++) {
            for (var x=-xsize/2; x<=xsize/2; x++) {
                var name = 'sphere('+(idx++)+')';
                sphereNames.push(name);
                var offset = (Math.abs((time % 60) - 30)/15)-1;
                root.children[name] = { 
                    type:'sphere', 
                    segments: 8,
                    size:size, 
                    x:offset*(x/4) + x*1.4*size, 
                    y:offset/2 + y*1.4*size, 
                    z:z*1.4*size
                };
            }
        }
    }

    root.children["material1"] = {
        type: 'material',
        diffuseTexture: {type:'texture', url:'seamless_stone_texture.jpg'}
    };

    root.children["box1"] = { 
        type: 'box', 
        size:1, 
        material: 'material1',
        x: 0, y: 1.5, z: -4, 
        scaling: {x:1,y:2, z:1} 
    };

    root.children["box2"] = { 
        type: 'box', 
        size:1, 
        material: 'material1',
        x: 0, y: 6, z: 0, 
        scaling: {x:4,y:.5, z:4} 
    };

    root.children["ground1"] = { type: 'ground', width:12, depth:12, segments:8 };

    sphereNames.push("box1");
    sphereNames.push("box2");

    root.children["shadow1"] = { 
        type: 'shadowGenerator',
        light: "light2", 
        renderList: sphereNames
    };

    root.children["shadow2"] = { 
        type: 'shadowGenerator',
        light: "light1", 
        renderList: sphereNames
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
                            item.instance = BABYLON.Mesh.CreateGround("ground1", item.width, item.depth, item.segments, scene);
                            item.instance.receiveShadows = true;
                            break;
                        case "material":
                            item.instance = new BABYLON.StandardMaterial(name, scene);
                            if (item.diffuseTexture) {
                                if (item.diffuseTexture.type == "texture") {
                                    item.instance.diffuseTexture = new BABYLON.Texture(item.diffuseTexture.url, scene);
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
        var engine = new BABYLON.Engine(canvas, true);

        var lastDom = null;

        var createScene = function (t) {

            // This creates a basic Babylon Scene object (non-mesh)
            var scene = new BABYLON.Scene(engine);

            // UNDONE: how to do this in the new model?
            // This attaches the camera to the canvas
            // camera.attachControl(canvas, true);

            lastDom = diff(lastDom, render(0));
            lastDom = applyActions(lastDom, scene);

            return scene;

        };

        var scene = createScene();
        var t = 0;

        setInterval(function() {
            t++;
            lastDom = diff(lastDom, render(t));
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