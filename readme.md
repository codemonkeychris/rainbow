# React & BabylonJS (RNB)
An experiment in bringing together React style programming and 3D environments.

## Basic model
The basic design is much like [ReactJS](https://github.com/reactjs) (and should 
probably just be updated to use React's engine. You implement a `render` function
and in there return a pure JS object DOM. At each frame, your method will be called
and the runtime will diff the DOM against the current state and update the UI to
match with minimal cost. 

```js
function render() {
    return {
        camera1: {
            type: 'freeCamera',
            x: 5, 
            y: 5, 
            z: -10,
            target: {x:0, y:0, z:0}
        },
        light1 : {
            type: 'directionalLight',
            x: 5, 
            y: 5, 
            z: -10,
            direction: {x:-1, y:-1, z:10},
            intensity: .7,
            diffuse: {r:.9, g:.9, b:1},
            specular: {r:1, g:1, b:1},
        },
        sphere1: {
            type: 'sphere',
            x: 0,
            y: 0,
            z: 0,
            size: 3
        }
    };
};
```
![Rendering a simple scene](readme_preview.jpg "Rendering a simple scene")

## Functional evaluation
Of course, since it's pure JS objects, you create create these with functions.

```js
function light() {
    return {
        type: 'directionalLight',
        x: 5, 
        y: 5, 
        z: -10,
        direction: {x:-1, y:-1, z:10},
        intensity: .7,
        diffuse: {r:.9, g:.9, b:1},
        specular: {r:1, g:1, b:1},
    };
}
function sphere(size, x, y, z) {
    return {
        type: 'sphere',
        x: x,
        y: y,
        z: z,
        size: size
    };
}

function render() {
    return {
        camera1: {
            type: 'freeCamera',
            x: 5, 
            y: 5, 
            z: -10,
            target: {x:0, y:0, z:0}
        },
        light1 : light(),
        sphere1: sphere(3, 0, 0, 0) 
    };
};
```

## More?
There is more, but at this point the hacking is much faster than the documenting... 

## Contributing
Not yet supported, right now it's just me hacking

