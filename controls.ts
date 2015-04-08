///<reference path='Babylon.js-2.0/References/poly2tri.d.ts' />
///<reference path='Babylon.js-2.0/References/waa.d.ts' />
///<reference path='Babylon.js-2.0/babylon.2.0.d.ts' />
///<reference path='rainbow.ts' />

module App.Controls {
    import R=Rainbow;

    export class ListView<TData extends any[]> implements R.Runtime.Component<ListViewViewModel, TData> {
        private name: string;
        private renderer: (T) => string;

        constructor(name: string, renderer: (T) => string) {
            this.name = name; 
            this.renderer = renderer;
        }
        initialize(): ListViewViewModel {
            return {
                scrollSpeed: -.1,
                offsetX: 0,
                columnStart: 5,
                columnCount: 7,
                tileSize: 2,
            };
        }
        updateModel(time: number, model: ListViewViewModel) : ListViewViewModel {
            var sizeWithPadding = model.tileSize * 1.25;

            model.offsetX +=model.scrollSpeed;
            if (model.offsetX < -sizeWithPadding) {
                model.offsetX = 0;
                model.columnStart++;
            }
            else if (model.offsetX > 0) {
                model.offsetX = -sizeWithPadding;
                model.columnStart--;
            }
            return model;
        }

        // clicked: function() {

        // }
        render(time : number, viewModel: ListViewViewModel, dataModel: TData) : R.SceneGraph {
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
            var displayIndex = index => (index + startIndex) % dataModel.length;
            var calcX = index => sizeWithPadding + offsetX + (((index / itemsPerColumn) | 0) - viewModel.columnCount / 2) * sizeWithPadding;

            var that = this;
            return [
                valuesToRender.map((value, index) => <R.Plane>{
                    name: that.name + '-vis(' + displayIndex(index) + ')',
                    type: 'plane',
                    position: {
                        x: viewModel.position.x + calcX(index),
                        y: viewModel.position.y + (sizeWithPadding/2) + ((index % itemsPerColumn)) * sizeWithPadding,
                        z: viewModel.position.z + -Math.abs(calcX(index) / 6)
                    },
                    rotation: { x: .3, y: calcX(index) / 16, z: 0 },
                    relativeTo: viewModel.relativeTo,
                    size: viewModel.tileSize,
                    material: that.renderer(value)
                })
            ];
        }
    }
    export interface ListViewViewModel {
        offsetX: number;
        columnStart: number;
        columnCount: number;
        scrollSpeed: number;
        tileSize: number;
        relativeTo?: string;
        position?: R.Vector3;
    }
}

module App {
    var HOLO_ALPHA = .6;
    import R = Rainbow;
    import W = Rainbow.World;
    import C = App.Controls;

    // UNDONE: the number of times "listView1" appears in this file indicates something is
    // broken... you have to declare the model slot for state, the variable to cache
    // the instance, the initialize, etc... just seems very not DRY (don't repeat yourself)
    //

    interface Model {
        values: number[];
        listView1: C.ListViewViewModel;
        hover?: string;
        position?: R.Vector3; 
        relativeTo?: string;
    }

    function updateModel(time : number, model: Model) {
        model.listView1 = listView1.updateModel(time, model.listView1);
        return model;
    }

    var listView1 = new C.ListView<number[]>('listView1', value => 'image(' + value + ')');

    function initialize() : Model {
        var values = [];
        for (var i = 0; i < 100; i++) {
            values.push(i);
        }
        return {
            values: values.map(x=> Math.round(Math.random() * 11)),
            listView1: listView1.initialize()
        };
    }

    function render(time: number, model: Model): R.SceneGraph {

        function holo_diffuse(name: string, url: string) : R.StandardMaterial {
            return <R.StandardMaterial>{ name: name, type: 'material', diffuseTexture: { type: 'texture', url: url }, alpha: HOLO_ALPHA };
        }

        // UNDONE: this feels ugly... also random - why are these properties here, but the
        // render callback is set in the constructor... 
        //
        model.listView1.relativeTo = model.relativeTo;
        model.listView1.position = model.position;
        model.listView1.tileSize = 2;

        return <R.SceneGraph>[
            // since this is a web demo, we cache all 12 images in textures to avoid re-downloading
            //
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((value) => holo_diffuse('image(' + value + ')', 'images/' + value + '.jpg')),
            listView1.render(time, model.listView1, model.values)
        ];
    };

    // Simplistic startup, need to think about the app bootstrap and actual app model.
    // Lots of questions - for example should we embrace React for the HTML UI and just go all in?
    //
    window.addEventListener("load", (function() {
        var canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");

        R.Runtime.start(canvas, 
            W.make({ 
                initialize: initialize, 
                clicked: null, 
                updateModel:updateModel, 
                render:render 
            },
            "Virtualized scrolling through 100 items",
            "< increase scroll left, > increase scroll right, R randomizes values",
            [
                {
                    text:'<', 
                    clicked: (model)=> {
                        var listView1 = <C.ListViewViewModel>model.listView1;
                        listView1.scrollSpeed = (((listView1.scrollSpeed * 100) - 5) | 0) / 100;
                    }
                },
                {
                    text:'>', 
                    clicked: (model)=> {
                        var listView1 = <C.ListViewViewModel>model.listView1;
                        listView1.scrollSpeed = (((listView1.scrollSpeed * 100) + 5) | 0) / 100;
                    }
                },
                {
                    text:'R', 
                    clicked: (model)=> {
                        model.values = model.values.map(x=> Math.round(Math.random() * 11));
                    }
                },
            ])
        );
    }));    
}

