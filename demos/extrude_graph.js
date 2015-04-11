// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root 
//
///<reference path='Babylon.js-2.0/References/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/References/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.d.ts' />
///<reference path='rainbow.ts' />
var App;
(function (App) {
    var R = Rainbow;
    // curve is the path which "shape" is extruded along
    //
    var curvePoints = function (l, t) {
        var path = [];
        var step = l / t;
        var i = 0;
        var flat = l / 8;
        for (; i <= flat; i += step) {
            path.push({ x: 0, y: i / 4, z: 0 });
        }
        var offset = Math.sin((i - flat) / (Math.PI * 2));
        for (; i <= l; i += step) {
            path.push({ x: 0, y: i / 4, z: offset - Math.sin((i - flat) / (Math.PI * 2)) });
        }
        return path;
    };
    var curve = curvePoints(40, 80);
    // shape is the 2D (or 3D) shape that is extruded. The orientation of the 2D shape
    // is still a bit confusing to me... 
    //
    var shape = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: -1, y: 1, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }
    ];
    var stick1 = new R.Controls.StickyNote("stick1");
    var root = {
        initialize: function () {
            return { stick1: stick1.initialize() };
        },
        render: function (frameNumber, model, data) {
            model.stick1.relativeTo = model.relativeTo;
            model.stick1.position = { x: model.position.x - 5, y: model.position.y + 2, z: model.position.z };
            return [
                { name: 'blue', type: 'material', alpha: .4, diffuseColor: { r: 0, g: 0, b: 1 }, backFaceCulling: false },
                {
                    name: 'extrude1',
                    type: 'extrudedShape',
                    path: curve,
                    shape: shape,
                    scale: 1,
                    material: 'blue',
                    position: { x: 0, y: .5, z: 0 },
                    relativeTo: model.relativeTo
                },
                {
                    name: 'line1',
                    type: 'line',
                    points: curve,
                    color: { r: 1, g: 0, b: 0 },
                    position: { x: 0, y: .5, z: 0 },
                    relativeTo: model.relativeTo
                },
                {
                    name: 'line2',
                    type: 'line',
                    points: shape,
                    color: { r: 0, g: 1, b: 0 },
                    position: { x: 0, y: .5, z: 0 },
                    relativeTo: model.relativeTo
                },
                stick1.render(frameNumber, model.stick1, ["Extruding a 2D shape along a path", "Green is the shape, red is the path"])
            ];
        }
    };
    window.addEventListener("load", (function () {
        var canvas = document.getElementById("renderCanvas");
        R.Runtime.start(canvas, R.World.make(root));
    }));
})(App || (App = {}));
