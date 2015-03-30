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
                }
                item.action = null;
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
                }
                break;
            case "delete":
                throw "not implemented!!";
                break;    
        }
    }
};

window.addEventListener("load", (function() {
    var canvas = document.getElementById("renderCanvas");
    var engine = new BABYLON.Engine(canvas, true);

    var lastDom = null;

    var render = function (time) {
        var root = { children: [] };
        root.children["light1"] = {
            type: 'hemisphericLight',
            intensity: 0.7
        };
        root.children["light2"] = {
            type: 'pointLight',
            x: Math.abs(((time+80) % 120)/30 - 30), 
            y:5, 
            z:- 10,
            diffuse: {r:.5, g:0, b:0},
            specular: {r:1, g:0, b:0},
        };

        var size = .35;
        var zsize=6;
        var ysize=6;
        var xsize=6;
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
        return root;
    };

    var createScene = function (t) {

        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new BABYLON.Scene(engine);

        // This creates and positions a free camera (non-mesh)
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        lastDom = diff(lastDom, render(0));
        applyActions(lastDom, scene);

        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
        var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

        return scene;

    };

    var scene = createScene();
    var t = 0;

    setInterval(function() {
        t++;
        lastDom = diff(lastDom, render(t));
        applyActions(lastDom, scene);
    }, 32);

    engine.runRenderLoop(function () {
      scene.render();
    });

    // Resize
    window.addEventListener("resize", function () {
      engine.resize();
    });
}));