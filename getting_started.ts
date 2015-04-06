///<reference path='Babylon.js-2.0/references/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/references/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
///<reference path='Rainbow.ts' />

module App {
    import R=Rainbow;

    interface Model {
        hover: string;
    }

    var root = {
        // Update model on each frame tick
        // 
        updateModel: function(frameNumber: number, model: Model) { return model; },
        
        // Create initial state of model
        // 
        initialize: function () : Model { return { hover: "" }; },
        
        // Update model in response to clicking
        // 
        clicked: function (model: Model) { return model; },

        // Create the scene graph for a current point in time
        //    
        render: function (frameNumber: number, model: Model, data: Model): R.SceneGraph {

            // Normally only the camera and ground are position relative
            // to $origin, but for a simple starter, we don't have a ground
            //
            return [
                <R.FreeCamera>{
                    name: 'camera1',
                    type: 'freeCamera',
                    position: { x: 0, y: 10, z: -17 },
                    relativeTo: "$origin",
                    target: { x: 0, y: 5, z: 0 },
                    attachControl: "renderCanvas"
                },
                <R.PointLight>{
                    name: 'light1',
                    type: 'pointLight',
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "$camera",
                    intensity: .7,
                    diffuse: { r: .9, g: .9, b: 1 },
                    specular: { r: 1, g: 1, b: 1 }
                },
                <R.Box>{ 
                    type: 'box', 
                    name:'shape1', 
                    size:3, 
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x:frameNumber/120, y:-.5, z:-.5 },
                    relativeTo: "$origin"
                }
            ];
        }
    }

    // Simplistic startup, need to think about the app bootstrap and actual app model.
    // Lots of questions - for example should we embrace React for the HTML UI and just go all in?
    //
    window.addEventListener("load", (function() {
        var canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");

        R.Runtime.start<Model>(canvas, root);
    }));    
}

