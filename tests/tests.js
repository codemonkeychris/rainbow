/// <reference path="qunit-1.16.0.d.ts" />
/// <reference path="../rainbow.ts" />
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
    })(Diff = Tests.Diff || (Tests.Diff = {}));
})(Tests || (Tests = {}));
