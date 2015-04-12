/// <reference path="qunit-1.16.0.d.ts" />
/// <reference path="../linqjs/linq.js.d.ts" />
/// <reference path="../lib/rainbow.ts" />

module Tests.Diff {
	import R = Rainbow;
    import RO = Rainbow.RecordOperations;
	
    QUnit.module('object.assign tests');

    test('validate typed version', function($) {
        var o1 = { a: 1 };
        var o2 = { b: 2 };
        var o3 = { c: 3 };

        var typed = RO.assign<{ a: number; b: number;c: number;}>(o1, o2, o3);
        $.deepEqual(typed, { a: 1, b: 2, c: 3 }, "should be copied");
        $.deepEqual(o1, { a: 1, b: 2, c: 3 }, "target object itself is changed");
    });

    test('samples from MDN', function($) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
        var o1 = { a: 1 };
        var o2 = { b: 2 };
        var o3 = { c: 3 };

        var obj = RO.assign<any>(o1, o2, o3);
        $.deepEqual(obj, { a: 1, b: 2, c: 3 }, "should be copied");
        $.deepEqual(o1, { a: 1, b: 2, c: 3 }, "target object itself is changed");


        var obj = Object.create({ foo: 1 }, { // foo is an inherit property.
            bar: {
                value: 2  // bar is a non-enumerable property.
            },
            baz: {
                value: 3,
                enumerable: true  // baz is an own enumerable property.
            }
        });

        var copy = RO.assign({}, obj);
        $.deepEqual(copy, { baz: 3 }, "Inherit properties and non-enumerable properties cannot be copied");
    });

	QUnit.module("basic diff tests");
    
    test("null graph diff", function ($) {
        var initialGraph = <R.SceneGraph>[
            <R.Box>{ 
                name:'box1', 
                type:'box', 
                size:1, 
                position: {x:0,y:0, z:0}, 
                relativeTo:"a" 
            }        
        ];

        var result = R.Runtime._testExport.diff(null, initialGraph);

        $.deepEqual<R.SceneGraph>(
            result, 
            <R.FlatSceneGraph>[ 
                <R.Box>{ 
                    name:'box1', 
                    type:'box', 
                    action:'create', 
                    size:1, 
                    position: {x:0,y:0, z:0}, 
                    relativeTo:"a" 
                } 
            ], "diff against null should result in create");
    });
    
    test("update single value graph diff", function ($) {
        var initialGraph = <R.FlatSceneGraph>[
            <R.Box>{ 
                name:'box1', 
                type:'box', 
                size:1, 
                position: {x:0,y:0, z:0}, 
                relativeTo:"a" 
            }        
        ];
        var newGraph = <R.SceneGraph>[
            <R.Box>{ 
                name:'box1', 
                type:'box', 
                size:1, 
                position: {x:1,y:0, z:0}, 
                relativeTo:"a" 
            }        
        ];

        var result = R.Runtime._testExport.diff(initialGraph, newGraph);

        $.deepEqual<R.SceneGraph>(
            result, 
            <R.FlatSceneGraph>[ 
                <R.Box>{ 
                    name:'box1', 
                    type:'box', 
                    action:'update', 
                    size:1, 
                    position: {x:1,y:0, z:0}, 
                    relativeTo:"a" 
                } 
            ], "diff against old should result in update");
    });
    
    test("flatten", function ($) {
        var initialGraph = <R.FlatSceneGraph>[
            <R.Box>{ 
                name:'box1', 
                type:'box', 
                size:1, 
                position: {x:0,y:0, z:0}, 
                relativeTo:"a" 
            }        
        ];
        var newGraph = <R.SceneGraph>[[[
            <R.Box>{ 
                name:'box1', 
                type:'box', 
                size:1, 
                position: {x:1,y:0, z:0}, 
                relativeTo:"a" 
            }        
        ]]];

        var result = R.Runtime._testExport.diff(initialGraph, newGraph);

        $.deepEqual<R.SceneGraph>(
            result, 
            <R.FlatSceneGraph>[ 
                <R.Box>{ 
                    name:'box1', 
                    type:'box', 
                    action:'update', 
                    size:1, 
                    position: {x:1,y:0, z:0}, 
                    relativeTo:"a" 
                } 
            ], "diff against old should result in update, flattened");
    });
    
    test("function eval", function ($) {
        function firstItemName(graph : R.FlatSceneGraph) : string {
            return graph[0].name;
        }
        var initialGraph = <R.FlatSceneGraph>[
            <R.Box>{ 
                name:'box1', 
                type:'box', 
                size:1, 
                position: {x:0,y:0, z:0}, 
                relativeTo:"a" 
            },
            <R.Box>{
                name:'box2', 
                type:'box', 
                size:1, 
                position: {x:0,y:0, z:0}, 
                relativeTo:"a" 
            }
        ];
        var newGraph = <R.SceneGraph>[
            <R.Box>{ 
                name:'box1', 
                type:'box', 
                size:1, 
                position: {x:0,y:0, z:0}, 
                relativeTo:"a" 
            },
            <R.Box>{ 
                name:'box2', 
                type:'box', 
                size:1, 
                position: {x:1,y:0, z:0}, 
                relativeTo: firstItemName 
            }        
        ];

        var result = R.Runtime._testExport.diff(initialGraph, newGraph);

        $.deepEqual<R.SceneGraph>(
            result, 
            <R.FlatSceneGraph>[
            <R.Box>{ 
                action: 'update',
                name:'box1', 
                type:'box', 
                size:1, 
                position: {x:0,y:0, z:0}, 
                relativeTo:"a" 
            },
            <R.Box>{
                action: 'update',
                name:'box2', 
                type:'box', 
                size:1, 
                position: {x:1,y:0, z:0}, 
                relativeTo:"box1" 
            }
        ], "diff should result in function resolution");
    });

    QUnit.module("linqjs validation");

    test("basic query and projection", function($) {
        var result = Enumerable.from([1, 2, 3, 4, 5]).where(v=> v % 2 == 0).select(function(v) { return { x: v }; }).toArray();

        $.deepEqual(result, [{ x: 2 }, { x: 4 }], "select should project the even items to the new data structure");
    });
    
}

