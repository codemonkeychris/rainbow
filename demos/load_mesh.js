// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root 
//
///<reference path='../Babylon.js-2.0/References/poly2tri.d.ts' />
///<reference path='../Babylon.js-2.0/References/waa.d.ts' />
///<reference path='../Babylon.js-2.0/babylon.d.ts' />
///<reference path='../lib/rainbow.ts' />
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
    // ugh, this only works from web hosted files :(
    //
    var root = {
        render: function (frameNumber, model, data) {
            return [
                {
                    name: 'meshes1',
                    type: 'loadMesh',
                    roolUrl: "../demos/",
                    sceneFileName: "skull.babylon",
                    scaling: { x: .05, y: .05, z: .05 },
                    position: { x: 0, y: 1.5, z: 0 },
                    relativeTo: model.relativeTo
                }
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
