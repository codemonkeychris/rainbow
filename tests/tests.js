/// <reference path="qunit-1.16.0.d.ts" />
/// <reference path="../linqjs/linq.js.d.ts" />
/// <reference path="../lib/rainbow.ts" />
var Tests;
(function (Tests) {
    var Diff;
    (function (Diff) {
        var R = Rainbow;
        QUnit.module("basic diff tests");
        test("null graph diff", function ($) {
            var initialGraph = [
                {
                    name: 'box1',
                    type: 'box',
                    size: 1,
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "a"
                }
            ];
            var result = R.Runtime._testExport.diff(null, initialGraph);
            $.deepEqual(result, [
                {
                    name: 'box1',
                    type: 'box',
                    action: 'create',
                    size: 1,
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "a"
                }
            ], "diff against null should result in create");
        });
        test("update single value graph diff", function ($) {
            var initialGraph = [
                {
                    name: 'box1',
                    type: 'box',
                    size: 1,
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "a"
                }
            ];
            var newGraph = [
                {
                    name: 'box1',
                    type: 'box',
                    size: 1,
                    position: { x: 1, y: 0, z: 0 },
                    relativeTo: "a"
                }
            ];
            var result = R.Runtime._testExport.diff(initialGraph, newGraph);
            $.deepEqual(result, [
                {
                    name: 'box1',
                    type: 'box',
                    action: 'update',
                    size: 1,
                    position: { x: 1, y: 0, z: 0 },
                    relativeTo: "a"
                }
            ], "diff against old should result in update");
        });
        test("flatten", function ($) {
            var initialGraph = [
                {
                    name: 'box1',
                    type: 'box',
                    size: 1,
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "a"
                }
            ];
            var newGraph = [[[
                {
                    name: 'box1',
                    type: 'box',
                    size: 1,
                    position: { x: 1, y: 0, z: 0 },
                    relativeTo: "a"
                }
            ]]];
            var result = R.Runtime._testExport.diff(initialGraph, newGraph);
            $.deepEqual(result, [
                {
                    name: 'box1',
                    type: 'box',
                    action: 'update',
                    size: 1,
                    position: { x: 1, y: 0, z: 0 },
                    relativeTo: "a"
                }
            ], "diff against old should result in update, flattened");
        });
        test("function eval", function ($) {
            function firstItemName(graph) {
                return graph[0].name;
            }
            var initialGraph = [
                {
                    name: 'box1',
                    type: 'box',
                    size: 1,
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "a"
                },
                {
                    name: 'box2',
                    type: 'box',
                    size: 1,
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "a"
                }
            ];
            var newGraph = [
                {
                    name: 'box1',
                    type: 'box',
                    size: 1,
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "a"
                },
                {
                    name: 'box2',
                    type: 'box',
                    size: 1,
                    position: { x: 1, y: 0, z: 0 },
                    relativeTo: firstItemName
                }
            ];
            var result = R.Runtime._testExport.diff(initialGraph, newGraph);
            $.deepEqual(result, [
                {
                    action: 'update',
                    name: 'box1',
                    type: 'box',
                    size: 1,
                    position: { x: 0, y: 0, z: 0 },
                    relativeTo: "a"
                },
                {
                    action: 'update',
                    name: 'box2',
                    type: 'box',
                    size: 1,
                    position: { x: 1, y: 0, z: 0 },
                    relativeTo: "box1"
                }
            ], "diff should result in function resolution");
        });
        QUnit.module("linqjs validation");
        test("basic query and projection", function ($) {
            var result = Enumerable.from([1, 2, 3, 4, 5]).where(function (v) { return v % 2 == 0; }).select(function (v) {
                return { x: v };
            }).toArray();
            $.deepEqual(result, [{ x: 2 }, { x: 4 }], "select should project the even items to the new data structure");
        });
    })(Diff = Tests.Diff || (Tests.Diff = {}));
})(Tests || (Tests = {}));
