// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root 
//

///<reference path='../Babylon.js-2.0/References/poly2tri.d.ts' />
///<reference path='../Babylon.js-2.0/References/waa.d.ts' />
///<reference path='../Babylon.js-2.0/babylon.d.ts' />
///<reference path='../lib/rainbow.ts' />

module App {
    import R=Rainbow;

    // these three members are required to plug into world reconstsruction,
    // your objects must be relativeTo "relativeTo" and should be positioned
    // around "position".
    //
    interface Model {
        hover?: string;
        relativeTo?: string;
        position?: R.Vector3
    }

    var root = {
        render: function (frameNumber: number, model: Model, data: Model): R.SceneGraph {
            return [
                <R.Box>{ 
                    type: 'box', 
                    name:'shape1', 
                    size:1, 
                    
                    // initial state
                    //
                    rotation: { x:0, y:0, z:0 },
                    scaling: {x:.1, y:.1, z:.1},
                    position: { x: data.position.x, y: data.position.y + 2, z: data.position.z },
                    relativeTo: data.relativeTo,

                    // animation
                    //
                    animation: <R.AnimateGeometry>{
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
    }

    window.addEventListener("load", (function() {
        var canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");

        R.Runtime.start<Model>(canvas, R.World.make(root));
    }));    
}

