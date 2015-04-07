///<reference path='Babylon.js-2.0/References/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/References/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
///<reference path='rainbow.ts' />
var App;
(function (App) {
    var Controls;
    (function (Controls) {
        var ListView = (function () {
            function ListView(name, renderer) {
                this.name = name;
                this.renderer = renderer;
            }
            ListView.prototype.initialize = function () {
                return {
                    scrollSpeed: -.1,
                    offsetX: 0,
                    columnStart: 5,
                    columnCount: 7,
                    tileSize: 2
                };
            };
            ListView.prototype.updateModel = function (time, model) {
                var sizeWithPadding = model.tileSize * 1.25;
                model.offsetX += model.scrollSpeed;
                if (model.offsetX < -sizeWithPadding) {
                    model.offsetX = 0;
                    model.columnStart++;
                }
                else if (model.offsetX > 0) {
                    model.offsetX = -sizeWithPadding;
                    model.columnStart--;
                }
                return model;
            };
            // clicked: function() {
            // }
            ListView.prototype.render = function (time, viewModel, dataModel) {
                var itemsPerColumn = 3;
                var totalColumns = (dataModel.length / itemsPerColumn) | 0;
                var offsetX = viewModel.offsetX;
                var startIndex = viewModel.columnStart * itemsPerColumn % dataModel.length;
                var endIndex1 = Math.min(startIndex + viewModel.columnCount * itemsPerColumn, dataModel.length);
                var valuesToRender = dataModel.slice(startIndex, endIndex1);
                if (endIndex1 - startIndex < viewModel.columnCount * itemsPerColumn) {
                    valuesToRender = valuesToRender.concat(dataModel.slice(0, viewModel.columnCount * itemsPerColumn - valuesToRender.length));
                }
                var sizeWithPadding = viewModel.tileSize * 1.25;
                var displayIndex = function (index) { return (index + startIndex) % dataModel.length; };
                var calcX = function (index) { return sizeWithPadding + offsetX + (((index / itemsPerColumn) | 0) - viewModel.columnCount / 2) * sizeWithPadding; };
                var that = this;
                return [
                    valuesToRender.map(function (value, index) { return {
                        name: that.name + '-vis(' + displayIndex(index) + ')',
                        type: 'plane',
                        position: {
                            x: viewModel.position.x + calcX(index),
                            y: viewModel.position.y + (sizeWithPadding / 2) + ((index % itemsPerColumn)) * sizeWithPadding,
                            z: viewModel.position.z + -Math.abs(calcX(index) / 6)
                        },
                        rotation: { x: .3, y: calcX(index) / 16, z: 0 },
                        relativeTo: viewModel.relativeTo,
                        size: viewModel.tileSize,
                        material: that.renderer(value)
                    }; })
                ];
            };
            return ListView;
        })();
        Controls.ListView = ListView;
    })(Controls = App.Controls || (App.Controls = {}));
})(App || (App = {}));
var App;
(function (App) {
    var HOLO_ALPHA = .6;
    var R = Rainbow;
    var W = Rainbow.World;
    var C = App.Controls;
    function updateModel(time, model) {
        model.listView1 = listView1.updateModel(time, model.listView1);
        return model;
    }
    var listView1 = new C.ListView('listView1', function (value) { return 'image(' + value + ')'; });
    function initialize() {
        var values = [];
        for (var i = 0; i < 100; i++) {
            values.push(i);
        }
        return {
            values: values.map(function (x) { return Math.round(Math.random() * 11); }),
            listView1: listView1.initialize()
        };
    }
    function render(time, model) {
        function holo_diffuse(name, url) {
            return { name: name, type: 'material', diffuseTexture: { type: 'texture', url: url }, alpha: HOLO_ALPHA };
        }
        // UNDONE: this feels ugly... also random - why are these properties here, but the
        // render callback is set in the constructor... 
        //
        model.listView1.relativeTo = model.relativeTo;
        model.listView1.position = model.position;
        model.listView1.tileSize = 2;
        return [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (value) { return holo_diffuse('image(' + value + ')', 'images/' + value + '.jpg'); }),
            listView1.render(time, model.listView1, model.values)
        ];
    }
    ;
    // Simplistic startup, need to think about the app bootstrap and actual app model.
    // Lots of questions - for example should we embrace React for the HTML UI and just go all in?
    //
    window.addEventListener("load", (function () {
        var canvas = document.getElementById("renderCanvas");
        R.Runtime.start(canvas, W.make({
            initialize: initialize,
            clicked: null,
            updateModel: updateModel,
            render: render
        }, "Virtualized scrolling through 100 items", "< increase scroll left, > increase scroll right, R randomizes values", [
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
        ]));
    }));
})(App || (App = {}));
