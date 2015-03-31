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
        type: 'hemisphericLight',
        intensity: 0.7
    };
    root.children["light2"] = {
        type: 'pointLight',
        x: Math.abs(((time+80) % 120)/30 - 30), 
        y: 5, 
        z:- 10,
        diffuse: {r:.5, g:0, b:0},
        specular: {r:1, g:0, b:0},
    };

    var size = .35;
    var slider = document.getElementById("size");
    var zsize=6;
    var ysize=6;
    var xsize=slider.value;
    for (var z=-zsize/2; z<=zsize/2; z++) {
        for (var y=1; y<=ysize; y++) {
            for (var x=-xsize/2; x<=xsize/2; x++) {
                var name = 'sphere('+x+','+y+','+z+')';
                var offset = (Math.abs((time % 60) - 30)/15)-1;
                root.children[name] = { 
                    type:'sphere', 
                    segments: 12,
                    size:size, 
                    x:offset + x*1.1*size, 
                    y:y*1.1*size, 
                    z:z*1.1*size
                };
            }
        }
    }

    root.children["ground1"] = { type: 'ground', width:12, depth:12, segments:8 };
    return root;
};

(function() {
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

        for (var i=0; i<keys.length; i++) {
            var name = keys[i];
            var item = dom.children[name];
            switch (item.action) {
                case "create":
                    switch (item.type) {
                        case "sphere":
                            item.instance = BABYLON.Mesh.CreateSphere(name, item.segments || 16, item.size, scene);
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            break;
                        case "hemisphericLight":
                            item.instance = new BABYLON.HemisphericLight(name, new BABYLON.Vector3(0, 1, 0), scene);
                            item.instance.intensity = item.intensity;
                            break;
                        case "pointLight":
                            item.instance = new BABYLON.PointLight(name, new BABYLON.Vector3(item.x, item.y, item.z), scene);
                            item.instance.diffuse = new BABYLON.Color3(item.diffuse.r, item.diffuse.g, item.diffuse.b);
                            item.instance.specular = new BABYLON.Color3(item.specular.r, item.specular.g, item.specular.b);
                            break;
                        case "freeCamera":
                            item.instance = new BABYLON.FreeCamera(name, new BABYLON.Vector3(item.x, item.y, item.z), scene);
                            item.instance.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                            break;
                        case "ground":
                            item.instance = BABYLON.Mesh.CreateGround("ground1", item.width, item.depth, item.segments, scene);
                            break;

                    }
                    item.action = null;
                    result.children[name] = item;
                    break;
                case "update":
                    item.action = null;
                    switch (item.type) {
                        case "sphere":
                            item.instance.position.x = item.x;
                            item.instance.position.y = item.y;
                            item.instance.position.z = item.z;
                            break;
                        case "pointLight":
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
        }, 16);

        engine.runRenderLoop(function () {
          scene.render();
        });

        // Resize
        window.addEventListener("resize", function () {
          engine.resize();
        });
    }));
})();