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
                    size: 1,
                    // initial state
                    //
                    rotation: { x: 0, y: 0, z: 0 },
                    scaling: { x: .1, y: .1, z: .1 },
                    position: { x: data.position.x, y: data.position.y + 2, z: data.position.z },
                    relativeTo: data.relativeTo,
                    // animation
                    //
                    animation: {
                        rotation: { x: 3, y: 3, z: 3 },
                        rotationVelocity: .05,
                        scaling: { x: 3, y: 3, z: 3 },
                        scalingVelocity: .05,
                        position: {
                            x: data.position.x + ((frameNumber / 30) | 0) % 10,
                            y: data.position.y + 4 + ((frameNumber / 50) | 0) % 3,
                            z: data.position.z + ((frameNumber / 20) | 0) % 10
                        },
                        velocity: .3
                    }
                }
            ];
        }
    };
    window.addEventListener("load", (function () {
        var canvas = document.getElementById("renderCanvas");
        R.Runtime.start(canvas, R.World.make(root));
    }));
})(App || (App = {}));
