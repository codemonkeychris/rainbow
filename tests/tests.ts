/// <reference path="qunit-1.16.0.d.ts" />
/// <reference path="../linqjs/linq.js.d.ts" />
/// <reference path="../rainbow.ts" />

module Tests.Diff {
	import R = Rainbow;
	
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

