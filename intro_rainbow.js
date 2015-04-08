// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root 
//
///<reference path='Babylon.js-2.0/References/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/References/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
///<reference path='rainbow.ts' />
var App;
(function (App) {
    var R = Rainbow;
    var root = {
        render: function (frameNumber, model, data) {
            return [
                {
                    type: 'box',
                    name: 'shape1',
                    size: 3,
                    rotation: { x: 0, y: frameNumber / 60, z: 0 },
                    position: { x: data.position.x, y: data.position.y + 2, z: data.position.z },
                    relativeTo: data.relativeTo
                }
            ];
        }
    };
    window.addEventListener("load", (function () {
        var canvas = document.getElementById("renderCanvas");
        R.Runtime.start(canvas, R.World.make(root));
    }));
})(App || (App = {}));
