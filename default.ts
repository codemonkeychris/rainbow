///<reference path='Babylon.js-2.0/references/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/references/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />

module App {
    var HOLO_ALPHA = .6;

    /**
     * Returns a two light system, one light at cameraPos, the other a top down ambient light
     */
    function basicLights(cameraPos : Rnb.Vector3) : Rnb.SceneGraph {
        return [
            <Rnb.DirectionalLight>{
                name: 'light1',
                type: 'directionalLight',
                position: { x: 0, y: 13, z: 0 },
                relativeTo: "ground1",
                direction: {x:0, y:-1, z:.1},
                intensity: .7,
                diffuse: {r:.9, g:.9, b:1},
                specular: {r:1, g:1, b:1}
            },
            <Rnb.DirectionalLight>{
                name: 'light2',
                type: 'directionalLight',
                relativeTo: "ground1",
                position: { x: cameraPos.x, y: cameraPos.y * 2, z: cameraPos.z * 1.2 },
                direction: {
                    x:-cameraPos.x, 
                    y:-cameraPos.y, 
                    z:-cameraPos.z
                },
                diffuse: {r:.5, g:.5, b:.5},
                specular: {r:1, g:1, b:1}
            }
        ];
    }
    function hudControl(name : string, material : string, x : number) {
        return {
            name: name,
            type: 'sphere',
            position: { x: x, y: -1, z: 3 },
            relativeTo: '$camera',
            diameter: .4,
            segments: 12,
            material: material
        }
    }
    function hud(name: string) : Rnb.SceneGraph {
        var materialName = name + '-mat1';
        return [
            { name: materialName, type: 'material', diffuseColor : { r:.2, g:0.2, b:1}, alpha: HOLO_ALPHA },
            hudControl(name + "-hud1", materialName, -1),
            hudControl(name + "-hud2", materialName, -.5),
            hudControl(name + "-hud3", materialName, 0),
            hudControl(name + "-hud4", materialName, .5),
            hudControl(name + "-hud5", materialName, 1)
        ];
    }    
    function diffuse(name: string, url : string) : Rnb.StandardMaterial { 
        return { name: name, type: 'material', diffuseTexture: { type: 'texture', url: url } };
    }
    function holo_diffuse(name: string, url : string) : Rnb.StandardMaterial { 
        return { name: name, type: 'material', diffuseTexture: { type: 'texture', url: url }, alpha: HOLO_ALPHA };
    }
    function shadowFor(name: string, lightName : string, renderList : Rnb.FlatSceneGraphToValue<string[]> | string[]) : Rnb.ShadowGenerator { 
        return { name: name, type: 'shadowGenerator', light: lightName, renderList: renderList }; 
    }
    function flatGround(name: string, width : number, depth : number, material : string) : Rnb.Ground { 
        return {
            name: name, 
            type: 'ground', 
            position: { x: 0, y: 0, z: 0 },
            relativeTo: "$origin",
            width:width, 
            depth:depth, 
            segments:8, 
            material:material 
        };
    }
    function groundFromHeightMap(
        name: string, 
        width : number, 
        depth : number, 
        minHeight : number, 
        maxHeight : number, 
        heightMapUrl : string, 
        material : string) : Rnb.GroundFromHeightMap {

        return { 
            name: name, 
            type: 'groundFromHeightMap', 
            position: { x: 0, y: 0, z: 0 },
            relativeTo: "$origin",
            width:width, 
            depth:depth, 
            minHeight: minHeight,
            maxHeight: maxHeight,
            segments:8, 
            url: heightMapUrl,
            material: material 
        };
    }
    function table(name : string, position : Rnb.Vector3, relativeTo: string) : Rnb.SceneGraph {
        var width = 16;
        var depth = 8;
        var legHeight = 4;
        var legTopSize = 1;
        var topThickness = .2;
        var materialName = name + '-wood';

        function tableLeg(part : string, position : Rnb.Vector3) {
            return <Rnb.Box>{
                name: name + "-" + part,
                type: 'box',
                position: position,
                relativeTo: relativeTo,
                size: 1,
                scaling: { x: legTopSize, y: legHeight, z: legTopSize },
                material: materialName
            };
        };
        return [
            diffuse(materialName, 'wood.jpg'),
            <Rnb.Box>{
                name: name + '-v-top',
                type: 'box',
                position: { x: position.x, y: position.y + legHeight, z: position.z },
                relativeTo: relativeTo,
                size: 1,
                scaling: { x: width, y: topThickness, z: depth },
                material: materialName
            },
            tableLeg('leftfront', { 
                    x: position.x - (width / 2) + (legTopSize / 2), 
                    y: position.y + (legHeight / 2) - (topThickness / 2), 
                    z: position.z - (depth / 2) + (legTopSize / 2) 
                }),
            tableLeg('rightfront', { 
                    x: position.x + (width / 2) - (legTopSize / 2), 
                    y: position.y + (legHeight / 2) - (topThickness / 2), 
                    z: position.z - (depth / 2) + (legTopSize / 2) 
                }),
            tableLeg('leftback', { 
                    x: position.x - (width / 2) + (legTopSize / 2), 
                    y: position.y + (legHeight / 2) - (topThickness / 2), 
                    z: position.z + (depth / 2) - (legTopSize / 2)
                }),
            tableLeg('rightback', { 
                    x: position.x + (width / 2) - (legTopSize / 2), 
                    y: position.y + (legHeight / 2) - (topThickness / 2), 
                    z: position.z + (depth / 2) - (legTopSize / 2)
                }),
        ];
    }
    /**
     * Returns a function which will seach the tree for any objects with a name matching
     * pattern.
     *
     * @param {string} pattern The string pattern to search names for, for now it is a simple "indexOf" matching
     *
     * @return {function(o : Rnb.FlatSceneGraph) => string[]} Function that will search the graph for the specified items
     */
     function select(pattern : string) : Rnb.FlatSceneGraphToValue<string[]> {
         return function(x) { return x.filter(item => item.name.indexOf(pattern) != -1).map(item=> item.name); };
    }

    function text() {
        return <Rnb.DynamicTexture>{
            type: 'dynamicTexture',
            width: 128,
            height: 128,
            renderCallback: 'function callback(texture) { texture.drawText("E", null, 80, "bold 70px Segoe UI", "white", "#555555"); }; callback;'
        };
    }

    export function render(time, model) : Rnb.SceneGraph {
        var cameraX = (Math.sin(time/40) * 10);
        var cameraY = 5;
        var cameraZ = (Math.sin((time+20)/40) * 10);
        var sphereScale = Math.abs(Math.sin(time / 20)) * 2;

        return <Rnb.SceneGraph>[
            <Rnb.FreeCamera>{
                name: 'camera1',
                type: 'freeCamera',
                position: { x: 0, y: 10, z: -17 },
                relativeTo: "$origin",
                target: {x:0, y:5, z:0},
                attachControl: "renderCanvas"
            },
            <Rnb.Material>{
                name: 'text1',
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                alpha: HOLO_ALPHA,
                diffuseTexture: text()
            },
            basicLights({x: cameraX, y: cameraY, z: cameraZ}),
            holo_diffuse('holo_stone', 'seamless_stone_texture.jpg'),
            <Rnb.Material>{
                name: 'dirt',
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                diffuseTexture: <Rnb.Texture>{ type: 'texture', url: 'ground.jpg', uScale: 4, vScale: 4 }
            },
            groundFromHeightMap('ground1', 50, 50, 0, 3, "heightMap.png", "dirt"),
            table('table1', {x:0,y:0,z:0}, 'ground1'),
            model.map((value, index) => <Rnb.Box>{
                name: 'vis(' + index + ')',
                type: 'box',
                position: {
                    x: index - model.length / 2,
                    y: (value / 4),
                    z: 0
                },
                relativeTo: "table1-v-top",
                size: 1,
                scaling: { x: .8, y: value / 2, z: .8 },
                material: "holo_stone"
            }),

            <Rnb.Sphere>{
                name: "vis(-1)",
                type: 'sphere',
                position: { x: 0, y: 2, z: 0 },
                relativeTo: "vis(0)",
                diameter: 1,
                scaling: {x:sphereScale, y:sphereScale, z:sphereScale},
                segments: 12,
                material: "text1"
            },

            hud('hud1'),

            shadowFor('shadow1', 'light2', select("table1-v")),
            shadowFor('shadow2', 'light1', select("table1-v"))
        ];
    };
}

module Rnb {
    // UNDONE action on objects is a hack for DIFF, should rethink that design
    //
    // UNDONE name on elements is kludgy, in the end we need it for Babylon, but
    // it introduces an odd set of constructs in the code to deal with name munging
    // of components and requiring lots of functions to take a name in from 
    // the caller for multi-instancing.
    //
    export interface GraphElement {
        name: string;
        type: string;
        action?: string;
    }
    /**
     * SceneGraph is what "render" should return, it can be any combination of graph elements
     * or nested scene graphs. The nesting is primarily to make it easier to build components,
     * however, keep in mind that all names must be globally unique.
     */
    export interface SceneGraph extends Array<GraphElement | SceneGraph> { }

    /**
     * FlatSceneGraph is the flattened version of a SceneGraph, where all nesting is
     * removed. All graph element names must be unique.
     */
    export interface FlatSceneGraph extends Array<GraphElement> { }

    export interface FlatSceneGraphToValue<T> { (graph : Rnb.FlatSceneGraph) : T; }


    ////////////////////////////////////////////////////////////////////////////
    // These are all simplified copies of BABYLON classes. They are converted
    // to interfaces to allow for JSON record definitions, and have name based
    // binding to facilitate graph definition in simple records.
    //
    // When in doubt, clone more of BABYLON :)
    //
    export interface Vector3 {
        x: number;
        y: number;
        z: number;
    }
    export interface Vector2 {
        x: number;
        y: number;
    }
    export interface Color3 {
        r: number;
        g: number;
        b: number;
    }
    export interface BaseTexture {
        type: string;
        url?: string;
        hasAlpha?: boolean;
        getAlphaFromRGB?: boolean;
        level?: number;
        isCube?: boolean;
        isRenderTarget?: boolean;
        // UNDONE: animations: Animation[];
        coordinatesIndex?: number;
        coordinatesMode?: number;
        wrapU?: number;
        wrapV?: number;
        anisotropicFilteringLevel?: number;
        canRescale?: boolean;
    }
    export interface Texture extends BaseTexture {
        url: string;
        uOffset?: number;
        vOffset?: number;
        uScale?: number;
        vScale?: number;
        uAng?: number;
        vAng?: number;
        wAng?: number;
    }
    export interface DynamicTexture extends Texture {
        name: string;
        renderCallback: string;
        width: number;
        height: number;
    }
    export interface Material extends GraphElement {
        alpha?: number;
        backFaceCulling?: boolean;
        pointSize?: number;
        wireframe?: boolean;
        pointsCloud?: boolean;
        fillMode?: number;
    }
    export interface FresnelParameters {
        isEnabled?: boolean;
        leftColor?: Color3;
        rightColor?: Color3;
        bias?: number;
        power?: number;
    }
    export interface StandardMaterial extends Material {
        diffuseTexture?: BaseTexture;
        ambientTexture?: BaseTexture;
        opacityTexture?: BaseTexture;
        reflectionTexture?: BaseTexture;
        emissiveTexture?: BaseTexture;
        specularTexture?: BaseTexture;
        bumpTexture?: BaseTexture;
        ambientColor?: Color3;
        diffuseColor?: Color3;
        specularColor?: Color3;
        specularPower?: number;
        emissiveColor?: Color3;
        useAlphaFromDiffuseTexture?: boolean;
        useSpecularOverAlpha?: boolean;
        fogEnabled?: boolean;
        diffuseFresnelParameters?: FresnelParameters;
        opacityFresnelParameters?: FresnelParameters;
        reflectionFresnelParameters?: FresnelParameters;
        emissiveFresnelParameters?: FresnelParameters;
    }
    export interface HasPosition {
        position: Vector3;
        relativeTo: string;
    }
    export interface Geometry extends HasPosition, GraphElement {
        material?: string;
        scaling?: Vector3;
    }
    export interface Ground extends Geometry {
        width: number;
        depth: number;
        segments: number;
    }
    export interface Box extends Geometry {
        size: number;
    }
    export interface Sphere extends Geometry {
        segments: number;
        diameter: number;
    }
    export interface GroundFromHeightMap extends Ground {
        minHeight: number;
        maxHeight: number;
        url: string;
    }
    export interface Light extends GraphElement  {
        diffuse?: Color3;
        specular?: Color3;
        intensity?: number;
        range?: number;
    }
    export interface PointLight extends Light, HasPosition {
    }
    export interface HemisphericLight extends Light {
        direction: Vector3;
        groundColor?: Color3;
    }
    export interface DirectionalLight extends Light, HasPosition {
        direction: Vector3;
    }

    export interface ShadowGenerator extends GraphElement {
        useVarianceShadowMap?: boolean;
        usePoissonSampling?: boolean;
        light: string;
        renderList: Rnb.FlatSceneGraphToValue<string[]> | string[];
    }
    export interface Camera extends GraphElement, HasPosition {
        type: string;
        action?: string;
        upVector?: Vector3;
        orthoLeft?: any;
        orthoRight?: any;
        orthoBottom?: any;
        orthoTop?: any;
        fov?: number;
        minZ?: number;
        maxZ?: number;
        inertia?: number;
        mode?: number;
        isIntermediate?: boolean;
        // UNDONE: viewport: Viewport;
        // UNDONE: subCameras: any[];
        layerMask?: number;
        fovMode?: number;
        attachControl?: string;
    }
    export interface TargetCamera extends Camera {
        cameraDirection?: Vector3;
        cameraRotation?: Vector2;
        rotation?: Vector3;
        speed?: number;
        noRotationConstraint?: boolean;
        lockedTarget?: any;
        target?: Vector3;
    }
    export interface FreeCamera extends TargetCamera {
        ellipsoid?: Vector3;
        keysUp?: number[];
        keysDown?: number[];
        keysLeft?: number[];
        keysRight?: number[];
        checkCollisions?: boolean;
        applyGravity?: boolean;
        angularSensibility?: number;
    }
}

module Rnb.Runtime {

    interface ApplyHandlerCallback {
        (rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache);
    }
    interface ApplyHandler {
        create: ApplyHandlerCallback;
        update: ApplyHandlerCallback;
        diff?: (oldItem: Rnb.GraphElement, newItem: Rnb.GraphElement) => Rnb.GraphElement;
    }
    interface HandlerBlock {
        [key: string]: ApplyHandler;
    }
    interface RealObjectsCache {
        [key: string]: BABYLON.Node | BABYLON.Material | BABYLON.ShadowGenerator;
    }
    interface BabylonHasPosition {
        position: BABYLON.Vector3
    }

    // UNDONE to enabled $camera, we stash away a camera reference. Seems like there
    // should be a cleaner way to do this more generically
    //
    var globalCamera;

    // creation of new meshes can be expensive, to avoid hanging the UI thread, I limit
    // the number of expensive operations per frame. The rest will be picked up on the 
    // next frame
    //
    var MAX_UPDATES = 20;

    // all of these update handlers are pretty bogus. Once DIFF becomes smart enough, we should clearly only 
    // update the changed values.
    // 
    function updatePosition(item: Rnb.HasPosition, r : BabylonHasPosition, realObjects : RealObjectsCache) {
        // eventually "$origin" shouldn't be supported except for surface reconstruction
        //
        var relativeTo = item.relativeTo || "$origin";
        switch (relativeTo) {
            case "$origin":
                r.position.x = item.position.x;
                r.position.y = item.position.y;
                r.position.z = item.position.z;
                break;
            case "$camera":
                var matrix: BABYLON.Matrix = globalCamera.getWorldMatrix();
                var place = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(item.position.x, item.position.y, item.position.z), matrix);

                r.position.x = place.x;
                r.position.y = place.y;
                r.position.z = place.z;
                break;
            default:
                var relative: BabylonHasPosition = <BabylonHasPosition>(<any>realObjects[relativeTo]);
                if (relative) {
                    // UNDONE: right now this is relative to the center of the object, we really
                    // need proper pins on any mesh point... also, consider rotation, scale, etc... 
                    //
                    r.position.x = relative.position.x + item.position.x;
                    r.position.y = relative.position.y + item.position.y;
                    r.position.z = relative.position.z + item.position.z;
                }
                else {
                    r.position.x = item.position.x;
                    r.position.y = item.position.y;
                    r.position.z = item.position.z;
                }
                break;
        }
    }
    function updateGeometryProps(item: Rnb.Geometry, includeExpensive: boolean, realObjects : RealObjectsCache, r) {
        if (item.scaling) {
            r.scaling.x = item.scaling.x;
            r.scaling.y = item.scaling.y;
            r.scaling.z = item.scaling.z;
        }
        updatePosition(item, r, realObjects);
        if (includeExpensive) {
            r.receiveShadows = true;
            if (item.material) {
                r.material = realObjects[item.material];
            }
        }
    }
    function updateLightProps(item: Rnb.Light, r) {
        r.intensity = item.intensity || 1;
        if (item.diffuse) {
            r.diffuse = new BABYLON.Color3(item.diffuse.r, item.diffuse.g, item.diffuse.b);
        }
        if (item.specular) {
            r.specular = new BABYLON.Color3(item.specular.r, item.specular.g, item.specular.b);
        }
    }

    var handlers: HandlerBlock = {
        box: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.Box>rawItem;

                var r = realObjects[item.name] = BABYLON.Mesh.CreateBox(item.name, item.size, scene);
                updateGeometryProps(item, true, realObjects, r);
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                updateGeometryProps(<Rnb.Box>rawItem, false, realObjects, realObjects[rawItem.name]);
            }
        },
        sphere: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.Sphere>rawItem;

                var r = realObjects[item.name] = BABYLON.Mesh.CreateSphere(item.name, item.segments || 16, item.diameter, scene, true);
                updateGeometryProps(item, true, realObjects, r);
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.Sphere>rawItem;
                updateGeometryProps(item, false, realObjects, realObjects[item.name]);
            }
        },
        ground: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.Ground>rawItem;

                var r = realObjects[item.name] = BABYLON.Mesh.CreateGround(item.name, item.width, item.depth, item.segments, scene);
                updateGeometryProps(item, true, realObjects, r);
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                updateGeometryProps(<Rnb.Ground>rawItem, false, realObjects, realObjects[rawItem.name]);
            }
        },
        groundFromHeightMap: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.GroundFromHeightMap>rawItem;

                var r = realObjects[item.name] =
                    BABYLON.Mesh.CreateGroundFromHeightMap(item.name,
                        item.url,
                        item.width,
                        item.depth,
                        item.segments,
                        item.minHeight,
                        item.maxHeight,
                        scene,
                        false);
                updateGeometryProps(item, true, realObjects, r);
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                updateGeometryProps(<Rnb.GroundFromHeightMap>rawItem, false, realObjects, realObjects[rawItem.name]);
            }
        },
        hemisphericLight: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.HemisphericLight>rawItem;
                var r = realObjects[item.name] = new BABYLON.HemisphericLight(item.name, new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z), scene);
                updateLightProps(item, r);
                if (item.groundColor) {
                    r.groundColor.r = item.groundColor.r;
                    r.groundColor.g = item.groundColor.g;
                    r.groundColor.b = item.groundColor.b;
                }
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.HemisphericLight>rawItem;

                var r = <BABYLON.HemisphericLight>realObjects[item.name];
                updateLightProps(item, r);
                if (item.groundColor) {
                    r.groundColor.r = item.groundColor.r;
                    r.groundColor.g = item.groundColor.g;
                    r.groundColor.b = item.groundColor.b;
                }
            }
        },
        pointLight: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.PointLight>rawItem;
                var r = realObjects[item.name] = new BABYLON.PointLight(item.name, new BABYLON.Vector3(item.position.x, item.position.y, item.position.z), scene);
                updateLightProps(item, r);
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.PointLight>rawItem;

                var r = <BABYLON.PointLight>realObjects[item.name];
                updatePosition(item, r, realObjects);
                updateLightProps(item, r);
            }
        },
        directionalLight: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.DirectionalLight>rawItem;

                var r = realObjects[item.name] = new BABYLON.DirectionalLight(item.name, new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z), scene);
                updatePosition(item, r, realObjects);
                updateLightProps(item, r);
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.DirectionalLight>rawItem;

                var r = <BABYLON.DirectionalLight>realObjects[item.name];
                r.direction = new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z)
                updatePosition(item, r, realObjects);
                updateLightProps(item, r);
            }
        },
        shadowGenerator: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.ShadowGenerator>rawItem;

                var r = realObjects[item.name] = new BABYLON.ShadowGenerator(1024, <BABYLON.IShadowLight>(<any>realObjects[item.light]));
                r.usePoissonSampling = item.usePoissonSampling;
                r.useVarianceShadowMap = item.useVarianceShadowMap;
                var renderList = r.getShadowMap().renderList;
                for (var i = 0; i < item.renderList.length; i++) {
                    renderList.push(<BABYLON.AbstractMesh>realObjects[item.renderList[i]]);
                }
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.ShadowGenerator>rawItem;

                var r = <BABYLON.ShadowGenerator>realObjects[item.name];
                var renderList = r.getShadowMap().renderList;
                var needRecreate = true;

                if (renderList.length == item.renderList.length) {
                    var allMatch = true;
                    for (var i = 0; i < item.renderList.length && needRecreate; i++) {
                        allMatch = allMatch && (renderList[i].name === item.renderList[i]);
                    }
                    needRecreate = !allMatch;
                }

                if (needRecreate) {
                    renderList.splice(0, renderList.length);

                    for (var i = 0; i < item.renderList.length; i++) {
                        renderList.push(<BABYLON.AbstractMesh>realObjects[item.renderList[i]]);
                    }
                }

            }
        },
        material: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.StandardMaterial>rawItem;

                var r = realObjects[item.name] = new BABYLON.StandardMaterial(item.name, scene);
                if (item.alpha) {
                    r.alpha = item.alpha;
                }
                if (item.diffuseColor) {
                    r.diffuseColor = new BABYLON.Color3(item.diffuseColor.r, item.diffuseColor.g, item.diffuseColor.b);
                }
                if (item.diffuseTexture) {
                    if (item.diffuseTexture.type === "texture") {
                        var texture = <Rnb.Texture>item.diffuseTexture;
                        var realTexture = new BABYLON.Texture(texture.url, scene);
                        r.diffuseTexture = realTexture;
                        if (texture.uScale) { realTexture.uScale = texture.uScale; }
                        if (texture.vScale) { realTexture.vScale = texture.vScale; }
                    }
                    else if (item.diffuseTexture.type === "dynamicTexture") {
                        var dt = <Rnb.DynamicTexture>item.diffuseTexture;
                        var realDT = new BABYLON.DynamicTexture(dt.name, {width:dt.width,height:dt.height}, scene, true);
                        r.diffuseTexture = realDT;
                        if (dt.uScale) { realDT.uScale = dt.uScale; }
                        if (dt.vScale) { realDT.vScale = dt.vScale; }
                        var t = <Function>eval(dt.renderCallback);
                        t.call(null, realDT);
                    }
                }
                if (item.specularColor) {
                    r.specularColor = new BABYLON.Color3(item.specularColor.r, item.specularColor.g, item.specularColor.b);
                }
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.ShadowGenerator>rawItem;

                // UNDONE: update material - need really diffing for that
            }
        },
        freeCamera: {
            create: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.FreeCamera>rawItem;

                var r = globalCamera = realObjects[item.name] = new BABYLON.FreeCamera(item.name, new BABYLON.Vector3(item.position.x, item.position.y, item.position.z), scene);
                r.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                if (item.attachControl) {
                    r.attachControl(document.getElementById(item.attachControl), true);
                }
            },
            update: function(rawItem: Rnb.GraphElement, dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <Rnb.FreeCamera>rawItem;

                var r = <BABYLON.FreeCamera>realObjects[item.name];
                r.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                updatePosition(item, r, realObjects);
            },
            diff: function(newItem: Rnb.GraphElement, oldItem: Rnb.GraphElement): Rnb.GraphElement {

                if (!oldItem) {
                    newItem.action = "create";
                    return newItem;
                }
                else if (!newItem) {
                    oldItem.action = "delete";
                    return oldItem;
                }
                else {
                    var n = <Rnb.FreeCamera>newItem;
                    var o = <Rnb.FreeCamera>oldItem;

                    if (n.position.x !== o.position.x || n.position.y !== o.position.y || n.position.z !== o.position.z) {
                        newItem.action = "update";
                    }
                    // UNDONE: target diff
                    return newItem;
                }
            }
        }
    }

    // JS records don't compose well in functional contexts, you can't merged function records easily (a+b), 
    // so I opt'd for a simple {type:'composite'} which will be flattened before processing and completely
    // erased.
    //
    function flatten(scene: Rnb.SceneGraph): Rnb.FlatSceneGraph {
        var result: Rnb.FlatSceneGraph = [];
        for (var i = 0; i < scene.length; i++) {
            var value = scene[i];
            if (value instanceof Array) {
                // undone: nested composites
                //
                var composite = <Rnb.SceneGraph>value;
                for (var i2 = 0; i2 < composite.length; i2++) {
                    result.push(<Rnb.GraphElement>composite[i2]);
                }
            }
            else {
                result.push(<Rnb.GraphElement>value);
            }
        }
        return result;
    }

    // functions in the graph allow for lazy evaluation and graph queries, the common
    // one I hit was the desire to get a list of all XXX elements to create shadows
    //
    function resolveFunctions(scene: Rnb.FlatSceneGraph): Rnb.FlatSceneGraph {
        var result: Rnb.FlatSceneGraph = [];
        for (var i = 0; i < scene.length; i++) {
            var value = scene[i];
            if (value) {
                var childKeys = Object.keys(value);
                for (var i2 = 0; i2 < childKeys.length; i2++) {
                    if (value[childKeys[i2]] instanceof Function) {
                        value[childKeys[i2]] = value[childKeys[i2]](scene);
                    }
                }
            }
            result.push(value);
        }
        return result;
    }

    // Incredibly niave implementation of DIFF... really this should just be replaced
    // by React, i need to see how hard that would be with my own custom OM as the
    // backend/DOM.
    //
    // When this switched from a record diff (SceneGraph used to be a record) this introduced
    // another side effect - reordering of elements will end up with extra delete/create, this
    // isn't desirable.
    //
    function diff(master: Rnb.FlatSceneGraph, newScene: Rnb.SceneGraph): Rnb.FlatSceneGraph {

        var newFlat = resolveFunctions(flatten(newScene));

        if (!master) {
            for (var i = 0; i < newFlat.length; i++) {
                (<Rnb.GraphElement>newFlat[i]).action = "create";
            }
            return newFlat;
        }
        else {
            var result: Rnb.FlatSceneGraph = [];

            var masterIndex = 0;
            var newIndex = 0;
            for (newIndex = 0; newIndex < newFlat.length; newIndex++) {
                var foundMatch = false;
                for (var masterSearch = 0; !foundMatch && masterSearch + masterIndex < master.length; masterSearch++) {
                    // found match, diff the two and advance "masterIndex" up to current
                    //
                    if (master[masterSearch + masterIndex].name == newFlat[newIndex].name
                        && master[masterSearch + masterIndex].type == newFlat[newIndex].type) {
                        foundMatch = true;

                        // first, push the consumed items, to preserve order
                        //
                        for (var i = 0; i < masterSearch; i++) {
                            var del = master[masterIndex++];
                            del.action = "delete";
                            result.push(del);
                        }

                        // second, diff the two items, now we are up to "current"
                        //
                        var n = newFlat[newIndex];
                        var o = master[masterIndex++];

                        var diff_handler = handlers[o.type].diff;
                        if (diff_handler) {
                            result.push(diff_handler(n, o));
                        }
                        else {
                            n.action = "update";
                            result.push(n);
                        }
                    }
                }

                if (!foundMatch) {
                    newFlat[newIndex].action = "create";
                    result.push(newFlat[newIndex]);
                }
            }

            // run to the end of master for any non-consumed items and mark them for deletion
            //
            for (; masterIndex < master.length; masterIndex++) {
                var del = master[masterIndex];
                del.action = "delete";
                result.push(del);
            }

            return result;
        }
    };


    // Poorly factored and horribly inneficient. This started as 20 lines, and kept growing. 
    // Desparately needs refactoring and some design work
    //
    function applyActions(dom : Rnb.FlatSceneGraph, scene : BABYLON.Scene, realObjects) {
        var result = [];

        var updateCount = 0;

        for (var i = 0; i < dom.length; i++) {
            var item = dom[i];

            // hack, hack, hack... 
            //
            if (updateCount > MAX_UPDATES) {
                if (item.action == "update" || item.action == "delete") {
                    result.push(item);
                }
                continue;
            }

            switch (item.action) {
                case "create":
                    updateCount++;

                    delete item.action;
                    handlers[item.type].create(item, dom, scene, realObjects);
                    result.push(item);
                    break;
                case "update":
                    delete item.action;
                    handlers[item.type].update(item, dom, scene, realObjects);
                    result.push(item);
                    break;
                case "delete":
                    updateCount++;
                    realObjects[item.name].dispose();
                    delete realObjects[item.name];
                    break;
                default:
                    result.push(item);
                    break;
            }
        }

        return result;
    };


    // Simplistic startup, need to think about the app bootstrap and actual app model.
    // Lots of questions - for example should we embrace React for the HTML UI and just go all in?
    //
    window.addEventListener("load", (function() {
        var canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
        var modelInput = <HTMLInputElement>(document.getElementById("modelInput"));
        var updateButton = <HTMLInputElement>(document.getElementById("updateButton"));

        var engine = new BABYLON.Engine(canvas, true);
        var lastDom : Rnb.FlatSceneGraph = null;
        var realObjects : RealObjectsCache = {};
        var model = JSON.parse(modelInput.value);
        updateButton.addEventListener("click", () => { try { model = JSON.parse(modelInput.value); } catch (e) { } });
        modelInput.addEventListener("keyup", () => { try { model = JSON.parse(modelInput.value); } catch (e) { } });
        var frameCount = 0;

        var scene = new BABYLON.Scene(engine);

        var updateFrame = function() {
            lastDom = diff(lastDom, App.render(frameCount++, model));
            lastDom = applyActions(lastDom, scene, realObjects);
            document.getElementById("domOutput").innerHTML = JSON.stringify(lastDom, undefined, 2);
        };

        updateFrame();

        engine.runRenderLoop(function() {
            updateFrame();
            scene.render();
        });

        window.addEventListener("resize", function() {
            engine.resize();
        });
    }));
}