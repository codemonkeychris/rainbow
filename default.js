///<reference path='Babylon.js-2.0/references/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/references/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
///<reference path='Rainbow.ts' />
var App;
(function (App) {
    var HOLO_ALPHA = .6;
    var R = Rainbow;
    function hud(name, hoverModel, buttons) {
        var hoverMaterialName = name + '-mat2';
        function hudControl(name, material, x) {
            return {
                name: name,
                type: 'sphere',
                position: { x: x, y: -1, z: 3 },
                relativeTo: '$camera',
                diameter: .3,
                segments: 12,
                material: hoverModel == name ? material + "-selected" : material
            };
        }
        function ballTextMaterial(name, msg, selected) {
            return {
                name: name,
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                alpha: HOLO_ALPHA,
                diffuseTexture: {
                    type: 'dynamicTexture',
                    name: name + "-texture",
                    width: 128,
                    height: 128,
                    wAng: Math.PI / 2,
                    vScale: -1,
                    vOffset: -.25,
                    uOffset: -.1,
                    renderCallback: 'function callback(texture) { texture.drawText("' + msg + '", null, 80, "50px Segoe UI", "black", "' + (selected ? '#FF0000' : '#CCCCCC') + '"); }; callback;'
                }
            };
        }
        var scene = buttons.map(function (button, index) {
            var button_name = name + "-hud" + index;
            click_handlers[button_name] = button.clicked;
            return [
                ballTextMaterial(button_name + '-mat', button.text, false),
                ballTextMaterial(button_name + '-mat-selected', button.text, true),
                hudControl(button_name, button_name + '-mat', index / 3)
            ];
        });
        scene.push({ name: hoverMaterialName, type: 'material', diffuseColor: { r: 1, g: 0.2, b: .2 }, alpha: HOLO_ALPHA });
        return scene;
    }
    function createWorld() {
        function basicLights() {
            return [
                {
                    name: 'light1',
                    type: 'directionalLight',
                    position: { x: 0, y: 13, z: 3 },
                    relativeTo: "ground1",
                    direction: { x: 0, y: -13, z: .1 },
                    intensity: .7,
                    diffuse: { r: .9, g: .9, b: 1 },
                    specular: { r: 1, g: 1, b: 1 }
                },
                {
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
        function select(pattern) {
            return function (x) {
                return x.filter(function (item) { return item.name.indexOf(pattern) != -1; }).map(function (item) { return item.name; });
            };
        }
        function groundFromHeightMap(name, width, depth, minHeight, maxHeight, heightMapUrl, material) {
            return {
                name: name,
                type: 'groundFromHeightMap',
                position: { x: 0, y: 0, z: 0 },
                relativeTo: "$origin",
                width: width,
                depth: depth,
                minHeight: minHeight,
                maxHeight: maxHeight,
                segments: 8,
                url: heightMapUrl,
                material: material
            };
        }
        function table(name, position, relativeTo) {
            var width = 16;
            var depth = 8;
            var legHeight = 4;
            var legTopSize = 1;
            var topThickness = .2;
            var materialName = name + '-wood';
            function tableLeg(part, position) {
                return {
                    name: name + "-" + part,
                    type: 'box',
                    position: position,
                    relativeTo: relativeTo,
                    size: 1,
                    scaling: { x: legTopSize, y: legHeight, z: legTopSize },
                    material: materialName
                };
            }
            ;
            return [
                { name: materialName, type: 'material', diffuseTexture: { type: 'texture', url: 'wood.jpg' } },
                {
                    name: name + '-v-top',
                    type: 'box',
                    position: { x: position.x, y: position.y + legHeight, z: position.z },
                    relativeTo: relativeTo,
                    size: 1,
                    scaling: { x: width, y: topThickness, z: depth },
                    material: materialName
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
        return [
            {
                name: 'camera1',
                type: 'freeCamera',
                position: { x: 0, y: 10, z: -17 },
                relativeTo: "$origin",
                target: { x: 0, y: 5, z: 0 },
                attachControl: "renderCanvas"
            },
            basicLights(),
            {
                name: 'dirt',
                type: 'material',
                specularColor: { r: 0, g: 0, b: 0 },
                diffuseTexture: { type: 'texture', url: 'ground.jpg', uScale: 4, vScale: 4 }
            },
            groundFromHeightMap('ground1', 50, 50, 0, 3, "heightMap.png", "dirt"),
            table('table1', { x: 0, y: 0, z: 0 }, 'ground1'),
            { name: 'shadow2', type: 'shadowGenerator', light: 'light1', renderList: select("table1-v") }
        ];
    }
    function listView(name, viewModel, dataModel, relativeTo, position, tileSize, renderer) {
        var itemsPerColumn = 3;
        var totalColumns = (dataModel.length / itemsPerColumn) | 0;
        var offsetX = viewModel.offsetX;
        var startIndex = viewModel.columnStart * itemsPerColumn % dataModel.length;
        var endIndex1 = Math.min(startIndex + viewModel.columnCount * itemsPerColumn, dataModel.length);
        var valuesToRender = dataModel.slice(startIndex, endIndex1);
        if (endIndex1 - startIndex < viewModel.columnCount * itemsPerColumn) {
            valuesToRender = valuesToRender.concat(dataModel.slice(0, viewModel.columnCount * itemsPerColumn - valuesToRender.length));
        }
        var sizeWithPadding = tileSize * 1.25;
        var displayIndex = function (index) { return (index + startIndex) % dataModel.length; };
        var calcX = function (index) { return sizeWithPadding + offsetX + (((index / itemsPerColumn) | 0) - viewModel.columnCount / 2) * sizeWithPadding; };
        hackViewModelUpdateHandler = function (time, model) {
            model[name].offsetX += model[name].scrollSpeed;
            if (model[name].offsetX < -sizeWithPadding) {
                model[name].offsetX = 0;
                model[name].columnStart++;
            }
            else if (model[name].offsetX > 0) {
                model[name].offsetX = -sizeWithPadding;
                model[name].columnStart--;
            }
            return model;
        };
        return [
            valuesToRender.map(function (value, index) { return {
                name: name + '-vis(' + displayIndex(index) + ')',
                type: 'plane',
                position: {
                    x: position.x + calcX(index),
                    y: position.y + (sizeWithPadding / 2) + ((index % itemsPerColumn)) * sizeWithPadding,
                    z: position.z + -Math.abs(calcX(index) / 6)
                },
                rotation: { x: .3, y: calcX(index) / 16, z: 0 },
                relativeTo: relativeTo,
                size: tileSize,
                material: renderer(value)
            }; })
        ];
    }
    // UNDONE: need a way for components to update their viewModel
    //
    var hackViewModelUpdateHandler;
    function updateModel(time, model) {
        if (hackViewModelUpdateHandler) {
            model = hackViewModelUpdateHandler(time, model);
        }
        return model;
    }
    function initialize() {
        var values = [];
        for (var i = 0; i < 100; i++) {
            values.push(i);
        }
        return {
            values: values.map(function (x) { return Math.round(Math.random() * 11); }),
            listView1: {
                scrollSpeed: -.1,
                offsetX: 0,
                columnStart: 5,
                columnCount: 7
            },
            hover: ""
        };
    }
    // UNDONE: real eventing model
    //
    var click_handlers = {};
    function clicked(model) {
        if (click_handlers[model.hover]) {
            click_handlers[model.hover](model);
        }
        return model;
    }
    function render(time, model) {
        function statusMessage(scrollSpeed) {
            function statusTextMaterial(name, msg1, msg2) {
                return {
                    name: name,
                    type: 'material',
                    specularColor: { r: 0, g: 0, b: 0 },
                    alpha: HOLO_ALPHA,
                    diffuseTexture: {
                        type: 'dynamicTexture',
                        name: name + "-texture",
                        width: 512,
                        height: 60,
                        vScale: 1,
                        renderCallback: 'function callback(texture) { \n' + '    texture.drawText("' + msg1 + '", 5, 20, "bold 20px Segoe UI", "white", "#555555"); \n' + '    texture.drawText("' + msg2 + '", 5, 40, "bold 16px Segoe UI", "white", null); \n' + '}; callback;'
                    }
                };
            }
            var topStatusName = 'topStatus(' + scrollSpeed + ')';
            return [
                statusTextMaterial(topStatusName, "Virtualized scrolling through 100 items (current:" + scrollSpeed + ")", "< increase scroll left, > increase scroll right, R randomizes values"),
                {
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
        function holo_diffuse(name, url) {
            return { name: name, type: 'material', diffuseTexture: { type: 'texture', url: url }, alpha: HOLO_ALPHA };
        }
        return [
            createWorld(),
            statusMessage(model.listView1.scrollSpeed),
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (value) { return holo_diffuse('image(' + value + ')', 'images/' + value + '.jpg'); }),
            listView('listView1', model.listView1, model.values, 'table1-v-top', { x: 0, y: 0, z: 0 }, 2, function (value) { return 'image(' + value + ')'; }),
            hud('hud1', model.hover, [
                {
                    text: '<',
                    clicked: function (model) {
                        var listView1 = model.listView1;
                        listView1.scrollSpeed = (((listView1.scrollSpeed * 100) - 5) | 0) / 100;
                    }
                },
                {
                    text: '>',
                    clicked: function (model) {
                        var listView1 = model.listView1;
                        listView1.scrollSpeed = (((listView1.scrollSpeed * 100) + 5) | 0) / 100;
                    }
                },
                {
                    text: 'R',
                    clicked: function (model) {
                        model.values = model.values.map(function (x) { return Math.round(Math.random() * 11); });
                    }
                },
            ])
        ];
    }
    ;
    // Simplistic startup, need to think about the app bootstrap and actual app model.
    // Lots of questions - for example should we embrace React for the HTML UI and just go all in?
    //
    window.addEventListener("load", (function () {
        var canvas = document.getElementById("renderCanvas");
        R.Runtime.start(canvas, initialize, clicked, updateModel, render);
    }));
})(App || (App = {}));
