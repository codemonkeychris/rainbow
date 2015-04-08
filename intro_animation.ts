///<reference path='Babylon.js-2.0/References/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/References/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
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
                    size:1, 
                    
                    // initial state
                    //
                    rotation: { x:0, y:0, z:0 },
                    scaling: {x:.1, y:.1, z:.1},
                    position: { x: data.position.x, y: data.position.y + 2, z: data.position.z },
                    relativeTo: data.relativeTo,

                    // animation
                    //
                    temp_goalRotation: { x:3, y:3, z:3},
                    temp_rotationVelocity: .05,
                    temp_goalScaling: {x:3, y:3, z:3},
                    temp_scalingVelocity: .05,
                    temp_goalPosition: { 
                        x: data.position.x + ((frameNumber/30)|0) % 10, 
                        y: data.position.y + 4 + ((frameNumber/50)|0) % 3, 
                        z: data.position.z + ((frameNumber/20)|0) % 10 
                    },
                    temp_velocity: .3
                }
            ];
        }
    }

    window.addEventListener("load", (function() {
        var canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");

        R.Runtime.start<Model>(canvas, R.World.make(root));
    }));    
}

