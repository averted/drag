'use strict';

/**
 * Extend prototype
 */
if (!Array.prototype.hasOwnProperty('forEach')) {
    Array.prototype.forEach = function (callback, thisArg) {
        var T, k;

        if (this == null) {
          throw new TypeError(" this is null or not defined");
        }

        var O = Object(this);
        var len = O.length >>> 0;

        if (typeof callback !== "function") {
          throw new TypeError(callback + " is not a function");
        }

        if (arguments.length > 1) { T = thisArg; }

        k = 0;

        while (k < len) {
          var kValue;

          if (k in O) {
            kValue = O[k];
            callback.call(T, kValue, k, O);
          }

          k++;
        }
    };
}

/**
 * Shape object constructor
 */
function Shape(options) {
    this.wrapper = '';
    this.offset  = { x:0, y:0 };
    this.type    = options.type;
    this.area    = options.area;
    this.width   = options.width;
    this.height  = options.height;
    this.img     = options.img; 
    this.cells   = options.cells; 
}

Shape.prototype = {
    constructor: Shape,

    /**
     * Build Shape's wrapper.
     */
    init: function() {
        // click ability, etc...
        this.wrapper = $('<div/>').addClass('grid-shape').css({
            width: this.width,
            height: this.height,
            backgroundImage: 'url(' + this.img + ')',
        }).on('dblclick', function(e) {
            $(this).remove();
        });
    },

    /**
     * Enable dragging functionality and handle matrix adjustments.
     */
    enableDrag: function() {
        var shape = this;

        this.wrapper.draggable({
            grid: [ 128, 128 ],
            containment: 'parent',

            start: function(e, ui) {
                var y = (ui.originalPosition.top) / 128,
                    x = (ui.originalPosition.left) / 128;

                Grid.drawShape(shape, { x: x, y: y }, 'remove'); // remove shape from grid
            },

            stop: function(e, ui) {
                var y    = (ui.originalPosition.top) / 128,
                    x    = (ui.originalPosition.left) / 128,
                    newY = (ui.offset.top - 1) / 128,
                    newX = (ui.offset.left - 1) / 128;

                // move shape to new coords
                if (Grid.willFitShape(shape, { x: newX, y: newY })) {
                    Grid.drawShape(shape, { x: newX, y: newY });    // draw shape at new coordinates
                } else {
                    $(this).remove();   // remove shape if there was a collision
                }

                // LOGGING
                Grid.matrix.forEach(function(item, index) {
                    console.log(item);
                });
            },
        });
    }
};

/**
 * Grid
 */
var Grid = {
    content: $('.grid'),
    availableSpace: 266256,
    matrix: [ [ 0, 0, 0, 0 ],
              [ 0, 0, 0, 0 ],
              [ 0, 0, 0, 0 ],
              [ 0, 0, 0, 0 ] ],

    /**
     * Build Shape and add it's DOM to Grid.
     *
     * @param  shape     Shape object
     */
    addShape: function(shape) {
        // check for available space
        if (!Grid.hasSpace(shape)) { alert('not enough space'); return false; }

        // build shape dom
        shape.init();

        // find starting location for shape 
        var coords = Grid.findLocationForShape(shape);
        if (coords) {
            Grid.drawShape(shape, coords);
        } else {
            alert('NO SPACE, try re-organizing?');
            return false;
        }
        
        // add offset?
        shape.wrapper.css({
            top: shape.offset.y * 128 + 'px',
            left: shape.offset.x * 128 + 'px',
        });

        // add shape dom to grid
        this.content.append(shape.wrapper);
        shape.enableDrag();
    },

    /**
     * Find space in Grid to fit the shape.
     *
     * @param  shape                Shape object
     * @return false | coords       Return X,Y coords if shape can fit in Grid, otherwise false
     */
    findLocationForShape: function(shape) {
        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 4; x++) {
                // attempt to draw shape at x, y
                if (Grid.willFitShape(shape, { x:x, y:y })) {
                    return { x: x, y: y }
                }

                shape.offset.x++;
                if (x == 3) shape.offset.x = 0;
            }
            shape.offset.y++;
        }

        return false;
    },

    /**
     * Draw a shape in Grid's matrix.
     *
     * @param shape         Shape object
     * @param coords        X,Y coords
     * @param remove        Optional flag to remove a shape (default: false)
     */
    drawShape: function(shape, coords, remove) {
        var x = coords.x,
            y = coords.y,
            remove = (typeof remove === 'undefined') ? false : true; 

        shape.cells.forEach(function(item, index) {
            var cell      = item.charAt(0),
                direction = item.charAt(1);
            
            Grid.matrix[y][x] = remove ? (cell === '0' ? Grid.matrix[y][x] : 0) : (cell === '0' ? Grid.matrix[y][x] : cell); 

            switch (direction) {
                case '1': y--; break; // top
                case '2': x++; break; // right
                case '3': y++; break; // bottom
                case '4': x--; break; // left
            }
        });

        // manage Grid's available space
        this.availableSpace = remove ? this.availableSpace + shape.area : this.availableSpace - shape.area;
    },

    /**
     * Check if cell can fit into matrix.
     * 
     * @param cell            Value to check (one of: [ 0, 1, 2, 3, 4, 5 ])
     * @param matrix_cell     Value of current matrix cell
     */
    willFit: function(cell, matrix_cell) {
        if (matrix_cell == 0) { return true; }

        switch (cell) {
            case '0': return true;
            case '1': if (matrix_cell == 3) { return true; }
            case '2': if (matrix_cell == 4) { return true; }
            case '3': if (matrix_cell == 1) { return true; }
            case '4': if (matrix_cell == 2) { return true; }
            default:
                return false;
        }

        return false;
    },

    /**
     * Check if whole shape will fit into matrix.
     * 
     * @param shape     Shape object
     * @param coords    X,Y coordiantes
     */
    willFitShape: function(shape, coords) {
        var x = coords.x,
            y = coords.y,
            result = true;

        shape.cells.forEach(function(item, index) {
            var cell      = item.charAt(0),
                direction = item.charAt(1);

            if (result == false) return false;

            // check if shape is out of grid bounds
            if (y < 0 || y > 3 || x < 0 || x > 3) 
                return result = false;

            // check if cell can physically fit into the matrix
            if (!Grid.willFit(cell, Grid.matrix[y][x]))
                return result = false;

            switch (direction) {
                case '1': y--; break; // top
                case '2': x++; break; // right
                case '3': y++; break; // bottom
                case '4': x--; break; // left
            }
        });

        return result;
    },

    /**
     * Check if Grid has enough available space for specified shape.
     *
     * @param shape     Shape object
     */
    hasSpace: function(shape) {
        return this.availableSpace - shape.area >= 0 ? true : false;
    },
};

/**
 * Controls 
 */
var Controls = {
    /**
     * Initialize controls.
     *
     * @constructor
     */
    init: function() {
        $('.shape').on('click', function() {
            var shape_type = $(this).attr('data-type');

            $.ajax({
                url: '/js/shapes.json',
                dataType: 'json',
                async: false,
                success: function(data) {
                    Grid.addShape(new Shape(data.common[shape_type]));
                }
            });
        });
    },
};

Controls.init();
