///<reference path='Babylon.js-2.0/references/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/references/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
///<reference path='Rainbow.ts' />
var App;
(function (App) {
    var R = Rainbow;
    function range(max) {
        var result = [];
        for (var i = 0; i < (max | 0); i++) {
            result.push(i);
        }
        return result;
    }
    var pyramidSize = 6;
    var itemSize = .6;
    var root = {
        render: function (frameNumber, model, data) {
            return [
                { name: 'blue', type: 'material', diffuseColor: { r: 0, g: 0, b: 1 } },
                { name: 'white', type: 'material', diffuseColor: { r: 1, g: 1, b: 1 } },
                { name: 'red', type: 'material', diffuseColor: { r: 1, g: 0, b: 0 } },
                R.World.createWalls('wall1', 15, 7, .5, data.position, data.relativeTo, 'white'),
                range(Math.min(frameNumber / 20, 40)).map(function (v) { return {
                    type: 'sphere',
                    name: 'v' + v,
                    segments: 6,
                    diameter: .4,
                    position: {
                        x: data.position.x + Math.random(),
                        y: data.position.y + 6,
                        z: data.position.z + Math.random()
                    },
                    relativeTo: data.relativeTo,
                    enablePhysics: true,
                    mass: 12,
                    restitution: .5,
                    material: 'red'
                }; }),
                range(pyramidSize).map(function (level) { return range((pyramidSize - 1) - level).map(function (x) { return range((pyramidSize - 1) - level).map(function (y) { return {
                    type: 'sphere',
                    name: 'l' + level + 'x' + x + 'y' + y,
                    segments: 6,
                    diameter: itemSize,
                    position: {
                        x: data.position.x + x * .6 + itemSize * level / 2 - pyramidSize / 2,
                        y: data.position.y + 1 + itemSize * level,
                        z: data.position.z + y * .6 + itemSize * level / 2 - pyramidSize / 2
                    },
                    relativeTo: data.relativeTo,
                    enablePhysics: true,
                    mass: 12,
                    restitution: .5,
                    material: 'blue'
                }; }); }); })
            ];
        }
    };
    // UNDONE:
    //
    // canvas.addEventListener("mousedown", function (evt) {
    //     var pickResult = scene.pick(evt.clientX, evt.clientY, function (mesh) {
    //         if (mesh.name.indexOf("Sphere0") !== -1 || mesh.name.indexOf("Box0") !== -1) {
    //             return true;
    //         }
    //         return false;
    //     });
    //     if (pickResult.hit) {
    //         var dir = pickResult.pickedPoint.subtract(scene.activeCamera.position);
    //         dir.normalize();
    //         pickResult.pickedMesh.applyImpulse(dir.scale(1), pickResult.pickedPoint);
    //     }
    // });
    window.addEventListener("load", (function () {
        var canvas = document.getElementById("renderCanvas");
        R.Runtime.start(canvas, R.World.make(root));
    }));
})(App || (App = {}));
