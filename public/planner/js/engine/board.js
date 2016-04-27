/**
 * Created by Henrik Peinar on 01/04/16
 */

'use strict';

/**
 * Board constructor
 * @param containerId
 * @param width
 * @param height
 * @returns {Board}
 * @constructor
 */

function Board (containerId, width, height) {
    this.R = Snap(containerId);

    this.width = width;
    this.height = height;
    this.tileSize = 16;
    this.tiles = [];
    this.buildings = [];
    this.grid = null;
    this.background = this.R.image(Board.toFullPath('img/full_background.jpg'), 0, 0, width, height);
    this.brush = new Brush(this);
    this.keepHighlights = [];
    this.placingBuilding = null;

    this.restrictionCheck = true;
	
	//A list of coordinates in the format [[x1,y1], [x2,y2],... [xa, ya]]. The coordinates are the top left corner of a square
	this.convertArrayToSVG = function(array){
		var sqWidth = 16;
		var sqHeight = 16;
		var svg = 'M';
		array.forEach(function(coord, index){
			svg += (coord[0] * sqWidth) + ',' + (coord[1] * sqHeight) + 'L';
		});
		svg = svg.substr(0, svg.length - 1) + 'z';
		console.log('generated: ' + svg);
		return svg;
	};
	
	//Rotates an array of coordinates to start at a certain point, so they can be concatenated together for reuse when doing the building boundries
	this.rotateArrayStartPoint = function(array, startCoord){
		var iterations = 0;
		while(iterations < array.length && (array[0][0] != startCoord[0] || array[0][1] != startCoord[1])){
			array.push(array.shift());
			iterations++;
		}
		console.log({array: array})
		return array;
	};
	
	//Replaces a set of coordinates in one array with another set of coordinates. This allows resuse of section definitions
	this.replaceCoordinateSet = function(array, originalCoords, replaceCoords){
		console.log({array: array, originalCoords: originalCoords, replaceCoords: replaceCoords});
		var indexOffset = array.findIndex(function(coord){return coord[0] == originalCoords[0][0] && coord[1] == originalCoords[0][1];});
		for(var i = 1; i < originalCoords.length; i++){
		console.log({indexOffset: indexOffset, orig: originalCoords[i], arr: array[indexOffset + i]})
			if(originalCoords[i][0] != array[indexOffset + i][0] || originalCoords[i][1] != array[indexOffset + i][1]){
				console.log("ERROR!");
			}
		}
		array.splice(indexOffset, originalCoords.length);
		for(var i = replaceCoords.length - 1; i >= 0; i--){
			array.splice(indexOffset, 0, replaceCoords[i]);
		}
		console.log({outArray: array});
		return array;
	};

	//Standard Boundries
	var leftSide = [[0,0], [40,0], [40,8], [35,8], [35,6], [34,6], [34,8], [4,8], [4,9], [3,9], [3,23], [7,23], [7,34], [5,34], [5,35], [4,35], [4,36], [3,36], [3,62], [40,62], [40,65], [0,65]];
	var topRight = [[42,0], [80,0], [80,15], [78,15], [78,12], [77,12], [77,11], [78,11], [78,10], [77,10], [77,11], [75,11], [75,10], [55,10], [55,9], [53,9], [53,7], [49,7], [49,8], [48,8], [48,7], [46,7], [46,8], [42,8]];
	var bottomRight = [[77,56], [77,19], [80,19], [80,65], [42,65], [42,62], [69,62], [69,59], [73,59], [73,56]];
	var house = [[59,11], [68,11], [68,16], [69,16], [69,17], [59,17]];
	var greenhouse = [[25,10], [32,10], [32,16], [25,16]];
	var shipBox = [[71,14], [73,14], [73,15], [71,15]];
	var littlePond = [[76,33], [75,33], [75,34], [71,34], [71,33], [70,33], [70,28], [75,28], [75,29], [76,29]];
	var bigPond = [[36,49], [43,49], [43,50], [44,50], [44,51], [46,51], [46,52], [47,52], [47,56], [46,56], [46,57], [45,57], [45,58], [42,58], [42,59], [37,59], [37,58], [36,58], [36,57], [34,57], [34,55], [33,55], [33,52], [34,52], [34,51], [35,51], [35,50], [36,50]];
	
    this.restrictedPath =
		this.convertArrayToSVG(leftSide) +
        this.convertArrayToSVG(topRight) +
        this.convertArrayToSVG(bottomRight) +
		this.convertArrayToSVG(greenhouse) +
        this.convertArrayToSVG(house) +
        this.convertArrayToSVG(shipBox) +
        this.convertArrayToSVG(littlePond) +
        this.convertArrayToSVG(bigPond);

	//Building Boundries, buildings cant go in these areas, while normal equipment can
	//First off, some custom boundries
	var greenhouseBuildings = [[24,10], [35,10], [35,16], [33,16], [33,17], [31,17], [31,18], [26,18], [26,17], [24,17]];
	var topRightBuildings = [[72,18], [72,16], [71,16], [71,17], [70,17], [70,18], [58,18], [58,14], [57,14], [57,13], [56,13], [56,12], [55,12], [55,11], [54,11], [54,9], [53,9], [53,7], [49,7], [49,8], [48,8], [48,7], [47,7], [47,8], [46,8], [46,9], [41,9], [41,0], [80,0], [80,18]]; //This replaces the normal house, shipBox, and topRight
	
	//Now, let's update the existing ones.
	var bottomRightBuildings = this.replaceCoordinateSet(bottomRight, [[77,56], [77,19]], [[76,56], [76,19]]);//The shadowy area isnt for buildings
	var leftSideBuildings = this.replaceCoordinateSet(leftSide,[[40,8], [35,8], [35,6], [34,6], [34,8], [4,8], [4,9], [3,9]], [[40,9], [5,9], [5,10], [4,10], [4,11], [3,11]]); //The top shadowy area isn't for building, so we can also drop teh save entrance
	leftSideBuildings = this.replaceCoordinateSet(leftSide,[[5,34], [5,35], [4,35], [4,36], [3,36]], [[7,34], [6,34], [6,35], [5,35], [5,36], [4,36], [4,37], [3,37]]); //This is the shadowy part under the left cliface halfway down
	
	//Now, the fun part, the lake is close enough to the bottom right, we should combine it. In addition, there are a few squares beween the bottom right, top, AND left side that are all unusable, effectively making all of the outside one big boundry. Lets combine them all, adding extra points as needed
	var outerBoundForBuildings = this.rotateArrayStartPoint(bottomRightBuildings, [76,19]).concat(littlePond);
	outerBoundForBuildings = this.rotateArrayStartPoint(outerBoundForBuildings, [80,19]).concat([[78,19], [78,18]], this.rotateArrayStartPoint(topRightBuildings, [72,18]), [[79,18], [79,19]]);
	outerBoundForBuildings = this.rotateArrayStartPoint(outerBoundForBuildings, [41,0]).concat([[41,2], [40,2]], this.rotateArrayStartPoint(leftSideBuildings, [40,9]));
	
    this.restrictedBuildingArea = this.R.path(
		this.convertArrayToSVG(outerBoundForBuildings) +
		this.convertArrayToSVG(greenhouseBuildings) + 
        this.convertArrayToSVG(bigPond)
	);
    this.restrictedBuildingArea.attr({
        fill: 'none',
        stroke: 'red'
    });

    this.positionHelpers = [this.R.text(0, 30, 'X: 0').attr({fill: 'white', pointerEvents: 'none', opacity: 0}), this.R.text(0, 15, 'Y: 0').attr({fill: 'white', pointerEvents: 'none', opacity: 0})];
    this.ghostPath = null; // used for debugging...
    this.pathPoints = []; // used for debugging...

    this.drawGrid();
    this.drawHelpers();
    this.preDrawSprites();

    this.R.mousemove(this.mousemove.bind(this));

    // yes... same event name
    this.R.mouseup(this.mousedown.bind(this));

    // bind keybinds to window
    $(window).keydown(this.keydown.bind(this));

    this.R.drag(this.dragMove, this.dragStart, this.dragEnd, this, this, this);

    return this;
}

Board.prototype.showHighlights = function showHighlights(type) {
    var board = this;

    if (type && board.keepHighlights.indexOf(type) === -1) {
        board.keepHighlights.push(type);
    }

    board.buildings.forEach(function (building) {
        if (board.keepHighlights.indexOf(building.typeGroup) !== -1) {
            building.moveHighlight(true);
        }
    });
};

Board.prototype.hideHighlights = function hideHighlights(type) {
    var board = this;
    var index = board.keepHighlights.indexOf(type);
    if (index >= 0) {
        board.keepHighlights.splice(board.keepHighlights.indexOf(type), 1);

        board.buildings.forEach(function (building) {
            if (building.highlight && board.keepHighlights.indexOf(building.typeGroup) === -1) {
                building.highlight.attr('opacity', 0);
            }
        });
    }
};

Board.prototype.drawHelpers = function drawHelpers() {
    var helperAttr = {
        fill: 'none',
        pointerEvents: 'none',
        stroke: '#000',
        strokeWidth: 0.5,
        opacity: 1
    };

    this.helperX = this.R.rect(0, 0, this.width, this.tileSize);
    this.helperY = this.R.rect(0, 0, this.tileSize, this.height);

    this.helperX.attr(helperAttr);
    this.helperY.attr(helperAttr);
};

Board.prototype.moveHelpers = function moveHelpers(pos) {
    this.helperX.attr({
        y: pos.y
    });
    this.helperY.attr({
        x: pos.x
    });
};

/**
 * Deselects building
 */
Board.prototype.deselectBuilding = function deselectBuilding() {
    var board = this;
    if (board.placingBuilding) {
        board.removeBuilding(board.placingBuilding);
        board.placingBuilding = null;
    }
};

/**
 * Deletes building from the buildings list
 * @param building
 */
Board.prototype.removeBuilding = function removeBuilding(building) {
    var board = this;
    var bIndex = board.buildings.map(function (b) { return (b || {}).uuid; }).indexOf((building || {}).uuid);
    board.buildings.splice(bIndex, 1);

    if (building.highlight) {
        building.highlight.remove();
    }

    building.remove();

    if ((board.placingBuilding || {}).uuid === building.uuid) {
        board.placingBuilding = null;
    }
    window.dispatchEvent(new Event('updateCount'));
};

/**
 * Starts placing building ("picks" it up)
 * @param id
 * @param building
 * @param x
 * @param y
 */
Board.prototype.placeBuilding = function placeBuilding(id, building, x, y) {
    var board = this;

    if (building && board.brush.erase) {
        board.removeBuilding(building);
        return;
    }

    if (!building) {
        this.deselectBuilding();
        building = new Building(this, id, (x || 0), (y || 250), true);
    }

    board.brush.changeBrush('select');
    board.placingBuilding = building;
};

/**
 * Brings all buildings to top (uses toBack because it is reverted for snapsvg plugin)
 */
Board.prototype.buildingsToTop = function buildingsToTop(e) {
    // hold buildings on top
    this.buildings.forEach(function (b) {
        if (b) {
            b.sprite.toBack();
        }

        if (b.highlight) {
            b.highlight.toBack();
        }
    });

    this.helperX.toBack();
    this.helperY.toBack();
    this.brush.rect.toBack();
};


/**
 * Handles darg start, if building placing is in action, cancles drag
 * @param x
 * @param y
 * @param e
 */
Board.prototype.dragStart = function dragStart(x, y, e) {
    this.brush.lock();
};

/**
 * Handles drag move event
 * @param dx
 * @param dy
 * @param x
 * @param y
 * @param e
 */
Board.prototype.dragMove = function dragMove(dx, dy, x, y, e) {
    if (this.brush.freemode) {
        var pos = Board.normalizePos(e, this.background.node, this.tileSize);
        this.drawTile(pos, this.brush.type);
    } else {
        this.brush.drag(this.snap(Board.normalizePos(e, this.background.node)));
    }
};

/**
 * Handles dragEnd event
 * @param e
 */
Board.prototype.dragEnd = function dragEnd(e) {
    this.brush.move(this.snap(Board.normalizePos(e, this.background.node)));
    this.brush.unlock();

    // check if rect happens to be inside of restricted area
    if ($(e.target).data('custom-type') !== 'building' && (!this.brush.type || !this.checkRestriction(this.restrictedBuildingArea, this.brush.rect))) {
        this.drawTiles(this.brush.rect, this.brush.type);
    }

    this.brush.reset();
    this.buildingsToTop();
};

/**
 * Handles board mousedown event
 * @param e
 */
Board.prototype.mousedown = function mousedown(e) {
    var board = this;

    if (board.placingBuilding) {

        if(this.checkRestriction(this.restrictedBuildingArea, this.placingBuilding.sprite)) {
            this.removeBuilding(this.placingBuilding);
            return;
        }
        var bIndex = board.buildings.map(function (b) { return (b || {}).uuid; }).indexOf((board.placingBuilding || {}).uuid);
        var pos = Board.normalizePos(e, null, board.tileSize);
        var buildingId = board.placingBuilding.type;

        board.placingBuilding.move(pos);
        board.placingBuilding.putDown();
        if (bIndex === -1) {
            board.buildings.push(board.placingBuilding);
        }

        board.placingBuilding = null;

        if (e.ctrlKey || e.metaKey || e.shiftKey) {
            setTimeout(function () {
                board.placeBuilding(buildingId, null, pos.x, pos.y);
            }, 1);
            e.preventDefault();
        } else {
            board.brush.restoreBrush();
        }
        window.dispatchEvent(new Event('updateCount'));
    }
};

/**
 * Checks if element bbox intersects with path
 * @param restrictedArea
 * @param element
 * @returns {*}
 */
Board.prototype.checkPathRestriction = function checkPathRestriction (restrictedArea, element) {
    var bb = element.getBBox();
    // you might ask WHY?! but there is a good reason we down-scale the path here:
    // we don't want edge-to-edge collisions to be detected, so we make the actual testing path smaller
    var matrix = (Snap.matrix()).scale(0.98, 0.98, bb.x + bb.width / 2, bb.y + bb.height / 2);

    // also we're going to draw extra paths for even better collision detection
    var s = {
        x: bb.x + 4,
        y: bb.y + 4,
        x2: bb.x + bb.width - 4,
        y2: bb.y + bb.height - 4,
    };

    var extraPaths = [
        ['M'+ s.x, s.y +'L'+ (s.x2), (s.y2) +'z'],
        ['M'+ (s.x2), (s.y) +'L'+ (s.x), (s.y2) +'z'],
        ['M'+ (s.x + bb.width / 2) , (s.y) +'L'+ (s.x + bb.width / 2), (s.y2) +'z']
    ];
    var transformPath = Snap.path.map(bb.path.toString(), matrix);
    transformPath += extraPaths.join('');

    return Snap.path.intersection(restrictedArea, transformPath.toString()).length > 0;
};

/**
 * Checks if rect is in restrictionPath or not
 * @param restrictionPath
 * @param rect
 */
Board.prototype.checkRestriction = function checkRestriction (restrictionPath, rect) {
    if (!this.restrictionCheck) {
        return false;
    }

    var data = {};
    if (rect.type) {
        data = {
            x: +rect.attr('x') + 1,
            y: +rect.attr('y') + 1,
            width: +rect.attr('width') - 2,
            height: +rect.attr('height') - 2
        };
    } else {
        data = {
            x: +rect.x + 1,
            y: +rect.y + 1,
            width: +rect.width - 2,
            height: +rect.height - 2
        };
    }

    var points = [
        { x: data.x, y: data.y},
        { x: data.x + data.width, y: data.y},
        { x: data.x, y: data.y + data.height},
        { x: data.x + data.width, y: data.y + data.height}
    ];

    return points.some(function (p) {
        return Snap.path.isPointInside(restrictionPath, p.x, p.y);
    });
};

/**
 * Handles mouse movement over the background (considered to be our "canvas")
 * @param e
 */
Board.prototype.mousemove = function mousemove(e) {
    if (this.placingBuilding) {

        if(this.checkRestriction(this.restrictedBuildingArea, this.placingBuilding.getBBox())) {
            // sorry, can't build here
            // TODO: I like red. Try to figure out how to use red here
            this.placingBuilding.sprite.attr({
                opacity: .2
            });
        } else {
            // build away
            this.placingBuilding.sprite.attr({
                opacity: .7
            });
        }

        this.placingBuilding.move(Board.normalizePos(e, null, this.tileSize));
    }

    // show pos
    var snappedPos = Board.normalizePos(e, null, this.tileSize);
    this.positionHelpers[0].attr({
        'text': 'Y: '+ (+snappedPos.y / this.tileSize),
        'y': snappedPos.y - 16,
        'x': snappedPos.x - 3*16
    }).toBack();
    this.positionHelpers[1].attr({
        'text': 'X: '+ (+snappedPos.x / this.tileSize),
        'y': snappedPos.y,
        'x': snappedPos.x - 3*16
    }).toBack();


    //move the brush
    this.brush.move(snappedPos);

    // move helpers
    this.moveHelpers(snappedPos);
};

/**
 * Handles key presses
 * @param e
 */
Board.prototype.keydown = function keydown(e) {
    // 'Del'
    if (this.placingBuilding && e.which == 46) {
        this.deselectBuilding();
    }

    // 'E'
    if (e.which === 69) {
        if (this.placingBuilding) {
            this.deselectBuilding();
        }

        if (!this.brush.erase) {
            this.brush.changeBrush('eraser');
        } else {
            this.brush.restoreBrush();
        }
    }

    // 'Esc'
    if (e.which === 27) {
        if (this.placingBuilding) {
            this.deselectBuilding();
            this.brush.restoreBrush();
        }

        this.brush.unlock();
        this.brush.reset();
    }

    e.stopPropagation();
};

/**
 * Snaps the given x,y obj to closest point
 * @param pos
 */
Board.prototype.snap = function snap(pos) {
    return {
        x: Math.floor(pos.x / this.tileSize) * this.tileSize,
        y: Math.floor(pos.y / this.tileSize) * this.tileSize
    }
};

/**
 * Normalizes position for all browsers
 * @param e
 * @newTarget
 * @snap
 * @returns {{x: number, y: number}}
 */
Board.normalizePos = function normalizePos(e, newTarget, snap) {
    var target = (newTarget || e.currentTarget);
    var rect = target.getBoundingClientRect();
    var offsetX = e.clientX - rect.left;
    var offsetY = e.clientY - rect.top;

    if (snap) {
        offsetX = Math.floor(offsetX / snap) * snap;
        offsetY = Math.floor(offsetY / snap) * snap;
    }

    return {
        x: offsetX,
        y: offsetY
    }
};

/**
 * Draws tiles to given area or location
 * @param area {R.rect|{x,y}}
 * @param tile
 */
Board.prototype.drawTiles = function drawTiles(area, tile) {
    // first we check path restriction
    if (this.brush.type && this.checkPathRestriction(this.restrictedBuildingArea, area)) {
        return;
    }

    // we are drawing to an area (most likely from a brush)
    if (area.type === 'rect') {

        // Note: Could draw areas of tiles as rects with fill to url(#)
        // but then there is problem with deleting them

        var areaData = {
            x: +area.attr('x'),
            y: +area.attr('y'),
            width: +area.attr('width'),
            height: +area.attr('height')
        };

        // loop this area and draw tiles on every square
        for (var y = areaData.y;y < areaData.y + areaData.height;y += this.tileSize) {
            for (var x = areaData.x;x < areaData.x + areaData.width;x += this.tileSize) {
                this.drawTile({
                    x: x,
                    y: y
                }, tile);
            }
        }

        window.dispatchEvent(new Event('updateCount'));
        return;
    }

    // not area, just draw this one tile to location
    this.drawTile(area, tile);
    window.dispatchEvent(new Event('updateCount'));
};

/**
 * Draws tile to given location, also does all the checking work
 * @param location
 * @param tile
 * @return {*}
 */
Board.prototype.drawTile = function drawTile(location, tile) {
    var hardX = location.x / this.tileSize;
    var hardY = location.y / this.tileSize;

    if (!this.tiles[hardY]) {
        this.tiles[hardY] = [];
    }

    if (tile === 'select') {
        return;
    }

    if (this.tiles[hardY][hardX]) {
        // there seems to be a tile in place here already, remove it

        if (!this.brush.overwriting && !this.brush.erase) {
            return;
        } else {
            this.tiles[hardY][hardX].remove();
            this.tiles[hardY][hardX] = null;

            if (this.brush.erase) {
                return;
            }
        }
    }

    if (tile) {
        var newTile = this.R.use(tile);
        newTile.attr({
            x: location.x,
            y: location.y,
            tileType: tile,
            pointerEvents: 'none'
        });

        this.tiles[hardY][hardX] = newTile;

        return newTile;
    }
};

/**
 * Draws grid. This is just to visually ease planning
 * Uses path tag in pattern tag and full width/height rect to fill the grid. Disables mouseEvents on the fill rect
 */
Board.prototype.drawGrid = function drawGrid() {
    var oneGridBlock = this.R.path('M 16 0 L 0 0 0 16');

    oneGridBlock.attr({
        fill: 'none',
        stroke: 'grey',
        strokeWidth: .5
    });

    var pattern = oneGridBlock.toPattern(0, 0, 16, 16);
    pattern.attr({
        id: 'grid'
    });

    this.grid = this.R.rect(0, 0, this.width, this.height);
    this.grid.attr({
        fill: 'url(#grid)',
        pointerEvents: 'none'
    });
};

/**
 * Inserts all our sprites to defs
 */
Board.prototype.preDrawSprites = function preDrawSprites() {
    data.tiles.forEach(function (tile) {
        var tileImage = this.R.image(Board.toFullPath('img/tiles/'+ tile +'.png'), 0, 0, this.tileSize, this.tileSize);
        tileImage.attr({
            id: tile
        });

        tileImage.toDefs();
    }.bind(this));

    Object.keys(data.buildings).forEach(function (b) {
        var building = data.buildings[b];
        var buildingImage = this.R.image(Board.toFullPath(building.sprite), 0, 0, building.width, building.height);
        buildingImage.attr({
            id: b
        });


        buildingImage.toDefs();
    }.bind(this));
};

/**
 * Exports data to JSON string
 */
Board.prototype.exportData = function exportData() {
    var farmData = {
        tiles: [],
        buildings: []
    };

    this.tiles.forEach(function (yTiles) {
        yTiles.forEach(function (tile) {
            if (tile) {
                var tileData = {
                    type: tile.attr('tileType'),
                    y: tile.attr('y'),
                    x: tile.attr('x')
                };

                if (tileData) {
                    farmData.tiles.push(tileData);
                }
            }
        });
    });

    this.buildings.forEach(function (building) {
        if (!building) {
            return;
        }

        var buildingData = building.convertToData();

        if (buildingData && buildingData.x && buildingData.y) {
            farmData.buildings.push(buildingData);
        }
    });

    return farmData;
};

/**
 * Imports farm data
 * @param data
 * @param cb
 */
Board.prototype.importData = function importData(data, cb) {
    if (!data) {
        return;
    }

    var board = this;
    var farmData = data;

    // import buildings
    farmData.buildings.forEach(function (building) {
        // don't import buildings on 0,0
        if (building.x > 0 || building.y > 0) {
            board.buildings.push(new Building(board, building.type, building.x, building.y))
        }
    });

    // import tiles
    farmData.tiles.forEach(function (tile) {
        board.drawTile(tile, tile.type);
    });

    // draw buildings on tops
    this.buildingsToTop();

    // show highlights
    this.showHighlights();

    if (typeof cb === 'function') {
        cb();
    }

    if (typeof cb === 'function') {
        cb();
    }

    window.dispatchEvent(new Event('updateCount'));
};

/**
 * Clears the board
 */
Board.prototype.clear = function clear() {
    var board = this;

    this.tiles.forEach(function (cTiles) {
        if (cTiles) {
            cTiles.forEach(function (tile) {
                tile.remove();
            });
        }
    });

    this.tiles = [];

    this.buildings.forEach(function (building) {
        building.sprite.remove();

        if(building.highlight) {
            building.highlight.remove();
        }

    });

    this.buildings = [];
};

/**
 * Well, you wouldn't believe it, but this function hides stuff
 */
Board.prototype.hideStuff = function hideStuff() {
    var hideMe = {
        opacity: 0
    };

    this.modifyStuff(hideMe);
};

/**
 * And this function shows the same stuff that was hidden
 */
Board.prototype.showStuff = function showStuff() {
    var showMe = {
        opacity: 1
    };

    this.modifyStuff(showMe);
};

Board.prototype.modifyStuff = function modifyStuff(attr) {
    this.helperY.attr(attr);
    this.helperX.attr(attr);
    this.grid.attr(attr);
    this.restrictedBuildingArea.attr(attr);
};

/**
 * Show coordinates
 */
Board.prototype.showCoords = function showCoords() {
    this.positionHelpers.forEach(function (h) {
        h.attr('opacity', 1);
    });
};

/**
 * Hide coordinates
 */
Board.prototype.hideCoords = function hideCoords() {
    this.positionHelpers.forEach(function (h) {
        h.attr('opacity', 0);
    });
};

/**
 * Converts relative path to absolute (this is needed to be able to save SVG's as images)
 * @param relativePath
 * @returns {string}
 */
Board.toFullPath = function toFullPath(relativePath) {
    return window.location.origin + window.location.pathname + relativePath;
};

/**
 * Generates unique uuid
 * @returns {string}
 */
Board.generateGUID = function generateGUID() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

/**
 * Little plugin for snap to support toFront / toBack
 */
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype;
    elproto.toFront = function () {
        this.prependTo(this.paper);
    };
    elproto.toBack = function () {
        this.appendTo(this.paper);
    };
});
