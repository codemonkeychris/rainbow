///<reference path='Babylon.js-2.0/references/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/references/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />

module Rainbow {
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

    export interface FlatSceneGraphToValue<T> { (graph : FlatSceneGraph) : T; }


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
        // UNDONE: need to refact for DynamicTexture doesn't require this
        // url: string;
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
        rotation?: Vector3;
        enablePhysics?: boolean;
        mass?: number;
        friction?: number;
        restitution?: number;
    }
    export interface Ground extends Geometry {
        width: number;
        depth: number;
        segments: number;
    }
    export interface Plane extends Geometry {
        size: number;
    }
    export interface Box extends Geometry {
        size: number;
    }
    export interface Cylinder extends Geometry {
        height: number;
        diameterTop: number;
        diameterBottom: number;
        tessellation?: number;
        subdivisions?: number;
    }
    export interface Torus extends Geometry {
        diameter: number;
        thickness: number;
        tessellation?: number;
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
        renderList: Rainbow.FlatSceneGraphToValue<string[]> | string[];
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

module Rainbow.World {
    var HOLO_ALPHA = .6;
    import R=Rainbow;


    export function createWalls(name: string, width:number, depth:number, height: number, position: R.Vector3, relativeTo: string, material: string) {
        var thickness = .5;
        var yOffset = .5 + height / 2;
        return [
            <R.Box>{ 
                type: 'box', 
                name: name + '-left', 
                size:1, 
                position: { x: position.x-width/2+thickness/2, y: position.y+yOffset, z: position.z },
                scaling: { x:thickness, y:height, z:depth-thickness},
                relativeTo: relativeTo,
                enablePhysics: true,
                mass: 20,
                material: 'mat'
            },
            <R.Box>{ 
                type: 'box', 
                name:name + '-right', 
                size:1, 
                position: { x: position.x+width/2-thickness/2, y: position.y+yOffset, z: position.z },
                scaling: { x:thickness, y:height, z:depth-thickness},
                relativeTo: relativeTo,
                enablePhysics: true,
                mass: 20,
                material: 'mat'
            },
            <R.Box>{ 
                type: 'box', 
                name:name + '-back', 
                size:1, 
                position: { x: position.x, y: position.y+yOffset, z: position.z+depth/2 },
                scaling: { x:width, y:height, z:thickness},
                relativeTo: relativeTo,
                enablePhysics: true,
                mass: 20,
                material: 'mat'
            },
            <R.Box>{ 
                type: 'box', 
                name: name + '-front', 
                size:1, 
                position: { x: position.x, y: position.y+yOffset, z: position.z-depth/2 },
                scaling: { x:width, y:height, z:thickness},
                relativeTo: relativeTo,
                enablePhysics: true,
                mass: 20,
                material: 'mat'
            },
        ]
    }
    
    function createWorld(): R.SceneGraph {
        function  basicLights(): R.SceneGraph {
            return [
                <R.DirectionalLight>{
                    name: 'light1',
                    type: 'directionalLight',
                    position: { x: 0, y: 13, z: 3 },
                    relativeTo: "ground1",
                    direction: { x: 0, y: -13, z: .1 },
                    intensity: .7,
                    diffuse: { r: .9, g: .9, b: 1 },
                    specular: { r: 1, g: 1, b: 1 }
                },
                <R.PointLight>{
                    name: 'light2',
                    type: 'pointLight',
                    relativeTo: "$camera",
                    position: { x: 0, y: 0, z: 0 },
                    intensity: .6,
                    diffuse: { r: 1, g: 1, b: 1 },
                    specular: { r: .3, g: .3, b: .3 }
                }
            ];
        }
        function select(pattern: string): R.FlatSceneGraphToValue<string[]> {
            return function(x) { return x.filter(item => item.name.indexOf(pattern) != -1).map(item=> item.name); };
        }


        function ground(
                name: string,
                width: number,
                depth: number,
                material: string) {

            // heightmap based ground doesn't work for physics... boo!
            return <R.Box>{
                name: name,
                type: 'box',
                position: { x: 0, y: 0, z: 0 },
                relativeTo: "$origin",
                size:1,
                scaling: { x: 100, y: 1, z: 100 },
                material: material,
                enablePhysics: true,
                mass: 0,
                friction:3,
                restitution: 0.001
            };
        }
        function table(name: string, position: R.Vector3, relativeTo: string): R.SceneGraph {
            var width = 16;
            var depth = 8;
            var legHeight = 4;
            var legTopSize = 1;
            var topThickness = .2;
            var materialName = name + '-wood';

            function tableLeg(part: string, position: R.Vector3) {
                return <R.Box>{
                    name: name + "-" + part,
                    type: 'box',
                    position: position,
                    relativeTo: relativeTo,
                    size: 1,
                    scaling: { x: legTopSize, y: legHeight, z: legTopSize },
                    material: materialName,
                    enablePhysics: true,
                    mass: 0,
                    friction: .5,
                    restitution: .07
                };
            };
            return [
                { name: materialName, type: 'material', diffuseTexture: { type: 'texture', url: 'wood.jpg' } },
                <R.Box>{
                    name: name + '-v-top',
                    type: 'box',
                    position: { x: position.x, y: position.y + legHeight, z: position.z },
                    relativeTo: relativeTo,
                    size: 1,
                    scaling: { x: width, y: topThickness, z: depth },
                    material: materialName,
                    enablePhysics: true,
                    mass: 0,
                    friction: 1,
                    restitution: .07
                },
                tableLeg('v-leftfront', {
                    x: position.x - (width / 2) + (legTopSize / 2),
                    y: position.y + (legHeight / 2) - (topThickness / 2),
                    z: position.z - (depth / 2) + (legTopSize / 2)
                }),
                tableLeg('v-rightfront', {
                    x: position.x + (width / 2) - (legTopSize / 2),
                    y: position.y + (legHeight / 2) - (topThickness / 2),
                    z: position.z - (depth / 2) + (legTopSize / 2)
                }),
                tableLeg('v-leftback', {
                    x: position.x - (width / 2) + (legTopSize / 2),
                    y: position.y + (legHeight / 2) - (topThickness / 2),
                    z: position.z + (depth / 2) - (legTopSize / 2)
                }),
                tableLeg('v-rightback', {
                    x: position.x + (width / 2) - (legTopSize / 2),
                    y: position.y + (legHeight / 2) - (topThickness / 2),
                    z: position.z + (depth / 2) - (legTopSize / 2)
                }),
            ];
        }

        return <R.SceneGraph>[
            <R.FreeCamera>{
                name: 'camera1',
                type: 'freeCamera',
                position: { x: 0, y: 10, z: -17 },
                relativeTo: "$origin",
                target: { x: 0, y: 5, z: 0 },
                attachControl: "renderCanvas"
            },
            basicLights(),
            { name: 'walls', type: 'material', diffuseTexture: { type: 'texture', url: 'seamless_stone_texture.jpg' } },
            <R.Material>{
                name: 'dirt',
                type: 'material',
                diffuseTexture: <R.Texture>{ type: 'texture', url: 'ground.jpg', uScale: 4, vScale: 4 }
            },
            ground('ground1', 50, 50, "dirt"),
            createWalls('wall1', 100, 100, 20, { x: 0, y: 0, z: 0 }, 'ground1', 'walls'),
            table('table1', { x: 0, y: 0, z: 0 }, 'ground1'),
            { name: 'shadow2', type: 'shadowGenerator', light: 'light1', renderList: select("table1-v") }
        ];
    }

    export interface HudButton {
        text: string;
        clicked: (any) => void;
    }

    var click_handlers = {};

    function statusMessage(msg1: string, msg2: string) : R.SceneGraph {
        function statusTextMaterial(name: string) {
            return <R.Material>{
                name: name,
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                alpha: HOLO_ALPHA,
                diffuseTexture: <R.DynamicTexture>{
                    type: 'dynamicTexture',
                    name: name + "-texture",
                    width: 512,
                    height: 60,
                    vScale: 1,
                    renderCallback:
                    'function callback(texture) { \n' +
                    '    texture.drawText("' + msg1 + '", 5, 20, "bold 20px Segoe UI", "white", "#555555"); \n' +
                    '    texture.drawText("' + (msg2 ? msg2 : "") + '", 5, 40, "bold 16px Segoe UI", "white", null); \n' +
                    '}; callback;'
                }
            };
        }

        var topStatusName = 'topStatus';
        return [
            statusTextMaterial(topStatusName),
            <R.Plane>{
                name: 'status',
                type: 'plane',
                position: { x: -1.2, y: -1, z: 3 },
                scaling: { x: 1.25 / 3, y: .20 / 3, z: 1 },
                rotation: { x: 0, y: -.2, z: 0 },
                relativeTo: '$camera',
                size: 2,
                material: topStatusName
            }
        ];
    }

    function hud(name: string, hoverModel: string, buttons : HudButton[]): R.SceneGraph {
        var hoverMaterialName = name + '-mat2';

        function hudControl(name: string, material: string, x: number) {
            return {
                name: name,
                type: 'sphere',
                position: { x: x, y: -1, z: 3 },
                relativeTo: '$camera',
                diameter: .3,
                segments: 12,
                material: hoverModel == name ? material + "-selected" : material
            }
        }

        function ballTextMaterial(name: string, msg: string, selected: boolean) {
            return <R.Material>{
                name: name,
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                alpha: HOLO_ALPHA,
                diffuseTexture: <R.DynamicTexture>{
                    type: 'dynamicTexture',
                    name: name + "-texture",
                    width: 128,
                    height: 128,
                    wAng: Math.PI / 2,
                    vScale: -1,
                    vOffset: -.25,
                    uOffset: -.1,
                    renderCallback: 'function callback(texture) { texture.drawText("' + msg + '", null, 80, "50px Segoe UI", "black", "'+ (selected ? '#FF0000' : '#CCCCCC') + '"); }; callback;'
                }
            };
        }

        var scene : R.SceneGraph = buttons.map((button, index) => {
            var button_name = name + "-hud" + index;
            click_handlers[button_name] = button.clicked;

            return [
                ballTextMaterial(button_name+'-mat', button.text, false),
                ballTextMaterial(button_name+'-mat-selected', button.text, true),
                hudControl(button_name, button_name+'-mat', index/3)
            ];
        });
        scene.push({ name: hoverMaterialName, type: 'material', diffuseColor: { r: 1, g: 0.2, b: .2 }, alpha: HOLO_ALPHA });

        return scene;
    }

    export interface WorldModel<TModel extends { position?: R.Vector3; relativeTo?: string; hover?: string }> {
        model: TModel;
        hover: string;
    }

    export function make<TModel extends { position?: R.Vector3; relativeTo?: string; hover?: string }>(
        rootComponent : R.Runtime.Component<TModel, TModel>, 
        statusLine1? : string,
        statusLine2? : string,
        buttons? : HudButton[]) : R.Runtime.Component<WorldModel<TModel>, WorldModel<TModel>> {
        return {
            updateModel: function(frameNumber: number, model: WorldModel<TModel>) { 
                model.model.hover = model.hover;
                if (rootComponent.updateModel) {
                    var nested = rootComponent.updateModel(frameNumber, model.model);
                    return { model: nested, hover: nested.hover };
                }
                else {
                    return model;
                }
            },
            initialize: function () : WorldModel<TModel> { 
                // UNDONE: hardcode what we are relative to... eventually want this
                // to be clickable to move the rendering around... :)
                //
                var nested = rootComponent.initialize ? rootComponent.initialize() : <TModel>{ };
                nested.position = { x: 0, y: 0, z: 0 };
                nested.relativeTo = "table1-v-top";

                return { model: nested, hover: "" };
            },
            clicked: function (model: WorldModel<TModel>) { 
                if (rootComponent.clicked) {
                    model.model.hover = model.hover;
                    var nested = rootComponent.clicked(model.model);
                    model = { model: nested, hover: nested.hover };
                }

                if (click_handlers[model.hover]) {
                    // UNDONE: should click handlers return a new model, or just mutate?
                    click_handlers[model.hover](model.model);
                }
                return model;
            },
            render: function(frameNumber: number, model: WorldModel<TModel>, data: WorldModel<TModel>): R.SceneGraph {
                return [
                    createWorld(),
                    rootComponent.render(frameNumber, model.model, data.model),
                    buttons && hud('hud1', model.hover, buttons),
                    (statusLine1 || statusLine2) && statusMessage(statusLine1, statusLine2)
                ];
            }
        }
    }    
}

module Rainbow.Runtime {
    import R = Rainbow;

    // UNDONE: for components with no viewModel (i.e. TModel == TData), this seems redundant... :(
    //
    // UNDONE: this seems a bit off... i feel like this is starting down the path of statefull
    // components, but really I just want a factory for the common methods, and a way of bundling
    // together the 4 related methods (well, the N related methods as this grows)... 
    //
    export interface Component<TModel, TData> {
        initialize?: () => TModel;
        clicked?: (TModel) => TModel;
        updateModel?: (number, TModel) => TModel;
        render: (number, TModel, TData) => SceneGraph;
    }

    interface ApplyHandlerCallback {
        (rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache);
    }
    interface ApplyHandler {
        create: ApplyHandlerCallback;
        update: ApplyHandlerCallback;
        diff?: (oldItem: R.GraphElement, newItem: R.GraphElement) => R.GraphElement;
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
    function updatePosition(item: R.HasPosition, r : BabylonHasPosition, realObjects : RealObjectsCache) {
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
                (<any>r).parent = globalCamera;
                r.position.x = item.position.x;
                r.position.y = item.position.y;
                r.position.z = item.position.z;
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
    function updateGeometryProps(
        item: R.Geometry, 
        includeExpensive: boolean, 
        forcePositionOnPhysics: boolean,
        realObjects : RealObjectsCache, 
        r) {
        if (item.scaling) {
            r.scaling.x = item.scaling.x;
            r.scaling.y = item.scaling.y;
            r.scaling.z = item.scaling.z;
        }
        if (item.rotation) {
            r.rotation.x = item.rotation.x;
            r.rotation.y = item.rotation.y;
            r.rotation.z = item.rotation.z;
        }
        if (forcePositionOnPhysics || !item.enablePhysics) {
            updatePosition(item, r, realObjects);
        }
        if (includeExpensive) {
            r.receiveShadows = true;
            if (item.material) {
                r.material = realObjects[item.material];
            }
        }
    }
    function updatePhysicsProps(item: R.Geometry, r : BABYLON.AbstractMesh, physicsImposter) {
        if (item.enablePhysics) {
            r.setPhysicsState(physicsImposter, 
                { mass: item.mass, friction : item.friction||1, restitution: item.restitution || 1 });
        }
    }
    function updateLightProps(item: R.Light, r) {
        r.intensity = item.intensity || 1;
        if (item.diffuse) {
            r.diffuse = new BABYLON.Color3(item.diffuse.r, item.diffuse.g, item.diffuse.b);
        }
        if (item.specular) {
            r.specular = new BABYLON.Color3(item.specular.r, item.specular.g, item.specular.b);
        }
    }

    var handlers: HandlerBlock = {
        plane: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.Plane>rawItem;
                var r = BABYLON.Mesh.CreatePlane(item.name, item.size, scene);
                realObjects[item.name] = r;
                updateGeometryProps(item, true, true, realObjects, r);
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                updateGeometryProps(<R.Plane>rawItem, true, false, realObjects, realObjects[rawItem.name]);
            }
            // UNDONE: diff for mesh recreate
        },
        box: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.Box>rawItem;

                var r = BABYLON.Mesh.CreateBox(item.name, item.size, scene);
                realObjects[item.name] = r;
                updateGeometryProps(item, true, true, realObjects, r);
                updatePhysicsProps(item, r, BABYLON.PhysicsEngine.BoxImpostor);
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                updateGeometryProps(<R.Box>rawItem, true, false, realObjects, realObjects[rawItem.name]);
            }
        },
        cylinder: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.Cylinder>rawItem;

                var r = realObjects[item.name] = BABYLON.Mesh.CreateCylinder(item.name, item.height, item.diameterTop, item.diameterBottom, item.tessellation || 20, item.subdivisions, scene);
                updateGeometryProps(item, true, true, realObjects, r);
                updatePhysicsProps(item, r, BABYLON.PhysicsEngine.CylinderImpostor);
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                updateGeometryProps(<R.Cylinder>rawItem, true, false, realObjects, realObjects[rawItem.name]);
            },
            diff: function(newItem: R.GraphElement, oldItem: R.GraphElement): R.GraphElement {

                if (!oldItem) {
                    newItem.action = "create";
                    return newItem;
                }
                else if (!newItem) {
                    oldItem.action = "delete";
                    return oldItem;
                }
                else {
                    var n = <R.Cylinder>newItem;
                    var o = <R.Cylinder>oldItem;

                    // anything used in mesh creation forces a regen of the mesh, this is why updating "scaling" is much
                    // better than adjusting "height"
                    //
                    if (n.height !== o.height 
                        || n.diameterTop !== o.diameterTop 
                        || n.diameterBottom !== o.diameterBottom
                        || n.tessellation !== o.tessellation
                        || n.subdivisions !== o.subdivisions) {
                        newItem.action = "recreate";
                    }
                    else {
                        // preserve recreate from previous diffs
                        newItem.action = o.action || "update";
                    }
                    // UNDONE: target diff
                    return newItem;
                }
            }
        },
        torus: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.Torus>rawItem;

                var r = realObjects[item.name] = BABYLON.Mesh.CreateTorus(item.name, item.diameter, item.thickness, item.tessellation || 20, scene);
                updateGeometryProps(item, true, true, realObjects, r);
                updatePhysicsProps(item, r, BABYLON.PhysicsEngine.MeshImpostor);
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                updateGeometryProps(<R.Torus>rawItem, true, false, realObjects, realObjects[rawItem.name]);
            }
            // UNDONE: diff for mesh recreate
        },
        sphere: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.Sphere>rawItem;

                var r = realObjects[item.name] = BABYLON.Mesh.CreateSphere(item.name, item.segments || 16, item.diameter, scene, true);
                updateGeometryProps(item, true, true, realObjects, r);
                updatePhysicsProps(item, r, BABYLON.PhysicsEngine.SphereImpostor);
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.Sphere>rawItem;
                updateGeometryProps(item, true, false, realObjects, realObjects[item.name]);
            }
            // UNDONE: diff for mesh recreate
        },
        ground: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.Ground>rawItem;

                var r = realObjects[item.name] = BABYLON.Mesh.CreateGround(item.name, item.width, item.depth, item.segments, scene);
                updateGeometryProps(item, true, true, realObjects, r);
                updatePhysicsProps(item, r, BABYLON.PhysicsEngine.MeshImpostor);
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                updateGeometryProps(<R.Ground>rawItem, false, false, realObjects, realObjects[rawItem.name]);
            }
            // UNDONE: diff for mesh recreate
        },
        groundFromHeightMap: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.GroundFromHeightMap>rawItem;

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
                updateGeometryProps(item, true, true, realObjects, r);
                updatePhysicsProps(item, r, BABYLON.PhysicsEngine.MeshImpostor);
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                updateGeometryProps(<R.GroundFromHeightMap>rawItem, false, false, realObjects, realObjects[rawItem.name]);
            }
            // UNDONE: diff for mesh recreate
        },
        hemisphericLight: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.HemisphericLight>rawItem;
                var r = realObjects[item.name] = new BABYLON.HemisphericLight(item.name, new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z), scene);
                updateLightProps(item, r);
                if (item.groundColor) {
                    r.groundColor.r = item.groundColor.r;
                    r.groundColor.g = item.groundColor.g;
                    r.groundColor.b = item.groundColor.b;
                }
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.HemisphericLight>rawItem;

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
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.PointLight>rawItem;
                var r = realObjects[item.name] = new BABYLON.PointLight(item.name, new BABYLON.Vector3(item.position.x, item.position.y, item.position.z), scene);
                updateLightProps(item, r);
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.PointLight>rawItem;

                var r = <BABYLON.PointLight>realObjects[item.name];
                updatePosition(item, r, realObjects);
                updateLightProps(item, r);
            }
        },
        directionalLight: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.DirectionalLight>rawItem;

                var r = realObjects[item.name] = new BABYLON.DirectionalLight(item.name, new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z), scene);
                updatePosition(item, r, realObjects);
                updateLightProps(item, r);
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.DirectionalLight>rawItem;

                var r = <BABYLON.DirectionalLight>realObjects[item.name];
                r.direction = new BABYLON.Vector3(item.direction.x, item.direction.y, item.direction.z)
                updatePosition(item, r, realObjects);
                updateLightProps(item, r);
            }
        },
        shadowGenerator: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.ShadowGenerator>rawItem;

                var r = realObjects[item.name] = new BABYLON.ShadowGenerator(1024, <BABYLON.IShadowLight>(<any>realObjects[item.light]));
                r.usePoissonSampling = item.usePoissonSampling;
                r.useVarianceShadowMap = item.useVarianceShadowMap;
                var renderList = r.getShadowMap().renderList;
                for (var i = 0; i < item.renderList.length; i++) {
                    renderList.push(<BABYLON.AbstractMesh>realObjects[item.renderList[i]]);
                }
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.ShadowGenerator>rawItem;

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
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.StandardMaterial>rawItem;

                var r = realObjects[item.name] = new BABYLON.StandardMaterial(item.name, scene);
                if (item.alpha) {
                    r.alpha = item.alpha;
                }
                if (item.diffuseColor) {
                    r.diffuseColor = new BABYLON.Color3(item.diffuseColor.r, item.diffuseColor.g, item.diffuseColor.b);
                }
                r.wireframe = item.wireframe;
                if (item.diffuseTexture) {
                    var sharedTexture: BABYLON.Texture;
                    var dynamicTexture: BABYLON.DynamicTexture;
                    var texture = <R.Texture>item.diffuseTexture;
                        
                    if (item.diffuseTexture.type === "texture") {
                        sharedTexture = new BABYLON.Texture(texture.url, scene);
                    }
                    else if (item.diffuseTexture.type === "dynamicTexture") {
                        var dt = <R.DynamicTexture>item.diffuseTexture;
                        sharedTexture = dynamicTexture = new BABYLON.DynamicTexture(dt.name, {width:dt.width,height:dt.height}, scene, true);
                    }
                    r.diffuseTexture = sharedTexture;

                    if (texture.uOffset) { sharedTexture.uOffset = texture.uOffset;} 
                    if (texture.vOffset) { sharedTexture.vOffset = texture.vOffset; } 
                    if (texture.uScale) { sharedTexture.uScale = texture.uScale; } 
                    if (texture.vScale) { sharedTexture.vScale = texture.vScale; } 
                    if (texture.uAng) { sharedTexture.uAng = texture.uAng; } 
                    if (texture.vAng) { sharedTexture.vAng = texture.vAng; } 
                    if (texture.wAng) { sharedTexture.wAng = texture.wAng; }

                    if (item.diffuseTexture.type === "dynamicTexture") {
                        var t = <Function>eval(dt.renderCallback);
                        t.call(null, dynamicTexture);
                    }

                }
                if (item.specularColor) {
                    r.specularColor = new BABYLON.Color3(item.specularColor.r, item.specularColor.g, item.specularColor.b);
                }
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.ShadowGenerator>rawItem;

                // UNDONE: update material - need really diffing for that
            }
        },
        freeCamera: {
            create: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.FreeCamera>rawItem;

                var r = globalCamera = realObjects[item.name] = new BABYLON.FreeCamera(item.name, new BABYLON.Vector3(item.position.x, item.position.y, item.position.z), scene);
                r.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                if (item.attachControl) {
                    r.attachControl(document.getElementById(item.attachControl), true);
                }
            },
            update: function(rawItem: R.GraphElement, dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects : RealObjectsCache) {
                var item = <R.FreeCamera>rawItem;

                var r = <BABYLON.FreeCamera>realObjects[item.name];
                r.setTarget(new BABYLON.Vector3(item.target.x, item.target.y, item.target.z));
                updatePosition(item, r, realObjects);
            },
            diff: function(newItem: R.GraphElement, oldItem: R.GraphElement): R.GraphElement {

                if (!oldItem) {
                    newItem.action = "create";
                    return newItem;
                }
                else if (!newItem) {
                    oldItem.action = "delete";
                    return oldItem;
                }
                else {
                    var n = <R.FreeCamera>newItem;
                    var o = <R.FreeCamera>oldItem;

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
    // so I opt'd for a simple nested array convention which will be flattened before processing and completely
    // erased.
    //
    function flatten(scene: R.SceneGraph): R.FlatSceneGraph {
        var result: R.FlatSceneGraph = [];
        for (var i = 0; i < scene.length; i++) {
            var value = scene[i];
            if (value instanceof Array) {
                var composite = flatten(<R.SceneGraph>value);
                for (var i2 = 0; i2 < composite.length; i2++) {
                    if (composite[i2]) {
                        result.push(<R.GraphElement>composite[i2]);
                    }
                }
            }
            else if (value) {
                result.push(<R.GraphElement>value);
            }
        }
        return result;
    }

    // functions in the graph allow for lazy evaluation and graph queries, the common
    // one I hit was the desire to get a list of all XXX elements to create shadows
    //
    function resolveFunctions(scene: R.FlatSceneGraph): R.FlatSceneGraph {
        var result: R.FlatSceneGraph = [];
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
    function diff(master: R.FlatSceneGraph, newScene: R.SceneGraph): R.FlatSceneGraph {

        var newFlat = resolveFunctions(flatten(newScene));

        if (!master) {
            for (var i = 0; i < newFlat.length; i++) {
                (<R.GraphElement>newFlat[i]).action = "create";
            }
            return newFlat;
        }
        else {
            var result: R.FlatSceneGraph = [];

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
    function applyActions(dom : R.FlatSceneGraph, scene : BABYLON.Scene, realObjects) {
        var result = [];

        var updateCount = 0;

        for (var i = 0; i < dom.length; i++) {
            var item = dom[i];

            // hack, hack, hack... 
            //
            if (updateCount > MAX_UPDATES) {
                if (item.action == "update" || item.action == "delete" || item.action=="recreate") {
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
                case "recreate":
                    updateCount++;

                    realObjects[item.name].dispose();
                    delete realObjects[item.name];
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


    // UNDONE: obviously "extends {hover:string}" is temporary... 
    export function start<TModel extends { hover?: string }>(
        canvas : HTMLCanvasElement, 
        rootComponent : Component<TModel, TModel>) {

        var engine = new BABYLON.Engine(canvas, true);
        var scene = new BABYLON.Scene(engine);
        scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.OimoJSPlugin());
        var lastDom : R.FlatSceneGraph = null;
        var realObjects : RealObjectsCache = {};
        var model = rootComponent.initialize ? rootComponent.initialize() : { hover: "" };

        // UNDONE: need to do mouse/etc for x-browser
        //
        function updateHover(evt) {
            var pickResult = scene.pick(evt.offsetX, evt.offsetY, (mesh) => {
                return mesh.name.indexOf("ground") == -1;
            });
            if (pickResult.hit) {
                if (model.hover !== pickResult.pickedMesh.name) {
                    model.hover = pickResult.pickedMesh.name;
                }
            }
            else {
                if (model.hover) {
                    model.hover = "";
                }
            }            
        }

        canvas.addEventListener("pointermove", updateHover);
        
        canvas.addEventListener("pointerup", (evt) => {
            updateHover(evt);
            if (model.hover && rootComponent.clicked) {
                model = rootComponent.clicked(model);
                if (!model) throw "need a model!";
            }
        });


        var frameCount = 0;

        var updateFrame = function() {
            if (rootComponent.updateModel) {
                model = rootComponent.updateModel(frameCount, model);
                if (!model) throw "need a model!";
            }
            lastDom = diff(lastDom, rootComponent.render(frameCount, model, model));
            lastDom = applyActions(lastDom, scene, realObjects);

            frameCount++;
        };

        updateFrame();

        engine.runRenderLoop(function() {
            updateFrame();
            scene.render();
        });

        window.addEventListener("resize", function() {
            engine.resize();
        });
    }
}