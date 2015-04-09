// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root 
//

///<reference path='Babylon.js-2.0/References/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/References/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.d.ts' />
///<reference path='rainbow.ts' />

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
                    size:3, 
                    rotation: { x:0, y:frameNumber/60, z:0 },
                    position: { x: data.position.x, y: data.position.y + 2, z: data.position.z },
                    relativeTo: data.relativeTo
                }
            ];
        }
    }

    window.addEventListener("load", (function() {
        var canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");

        R.Runtime.start<Model>(canvas, R.World.make(root));
    }));    
}

