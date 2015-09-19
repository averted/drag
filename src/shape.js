import Gem from './gem';
import Grid from './grid';

/**
 * Shape constructor
 */
function Shape(options) {
  this.wrapper = '';
  this.offset  = { x:0, y:0 };
  this.coords  = { x:0, y:0 };
  this.type  = options.type;
  this.area  = options.area;
  this.width   = options.width;
  this.height  = options.height;
  this.img   = options.img;
  this.cells   = options.cells;
  this.gems  = options.gems;
  this.Gems  = [];
}

Shape.prototype = {
  constructor: Shape,

  /**
   * Build Shape
   */
  init: function() {
    var Shape = this
      , gemArray = [];

    this.wrapper = $('<div/>').addClass('grid-shape').css({
      width: this.width,
      height: this.height,
      backgroundImage: 'url(' + this.img + ')',
    }).on('mousedown', function(e) {
      if (e.which == 3) {
        Shape.rotate();
      }
    });

    // build Shape's gems
    this.gems.forEach(function(item, index) {
      var gem = new Gem(item);

      // add to gemArray
      gemArray.push(gem.wrapper);

      // assign Gem to Shape
      gem.Shape = Shape;
      Shape.Gems.push(gem);

      // dereference
      gem = null;
    });

    // add gems to shape dom
    this.wrapper.append(gemArray);
  },

  /**
   * Rotate Shape
   */
  rotate: function() {
    this.rotateWrapper();
    this.rotateMatrix();

    return true;
  },

  /**
   * Rotate Shape's matrix in Grid
   */
  rotateMatrix: function() {
    var rotatedCells = [];

    this.cells.forEach(function(item, index, obj) {
      var cell      = item.charAt(0)
        , newIndex  = index + 1 >= obj.length ? 0 : index + 1
        , direction = obj[newIndex].charAt(1);

      switch (cell) {
        case '1': cell = '4'; break;
        case '2': cell = '1'; break;
        case '3': cell = '2'; break;
        case '4': cell = '3'; break;
      }

      rotatedCells[newIndex] = cell + direction;
    });

    // remove Shape from it's coords and draw a new one on top
    Grid.drawShape(this, this.coords, 'remove');
    this.cells = rotatedCells;
    Grid.drawShape(this, this.coords);

    // LOGGING
    Grid.matrix.forEach(function(item, index) {
      console.log(item);
    });

    return true;
  },

  /**
   * Rotate Shape's wrapper (image)
   */
  rotateWrapper: function() {
    var angle = 0
      , transform = this.wrapper.css("-webkit-transform") ||
            this.wrapper.css("-moz-transform")    ||
            this.wrapper.css("-ms-transform")     ||
            this.wrapper.css("-o-transform")      ||
            this.wrapper.css("transform");

    if (transform !== 'none') {
      var values = transform.split('(')[1].split(')')[0].split(',')
        , a = values[0]
        , b = values[1];

      angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
    }

    angle = angle < 0 ? angle += 360 : angle;

    this.wrapper.css('transform', 'rotate(' + (angle + 90) + 'deg)');

    return true;
  },

  /**
   * Enable dragging functionality and handle matrix adjustments
   */
  enableDrag: function() {
    var shape = this;

    this.wrapper.draggable({
      grid: [ 128, 128 ],
      containment: 'parent',

      start: function(e, ui) {
        var y = (ui.originalPosition.top) / 128,
          x = (ui.originalPosition.left) / 128;

        // remove shape from matrix
        Grid.drawShape(shape, { x: x, y: y }, 'remove');

        // add class to prevent default click event
        $(this).addClass('shape-dragging');
      },

      stop: function(e, ui) {
        var y  = (ui.originalPosition.top) / 128
          , x  = (ui.originalPosition.left) / 128
          , newY = (ui.position.top) / 128
          , newX = (ui.position.left) / 128;

        // move shape to new coords
        if (Grid.willFitShape(shape, { x: newX, y: newY })) {
          Grid.drawShape(shape, { x: newX, y: newY });
        } else {
          $(this).remove();
        }

        // LOGGING
        Grid.matrix.forEach(function(item, index) {
          console.log(item);
        });
      },
    });
  },

  /**
   * Check if Shape is completely filled with proper Gems
   *
   * @return true|false   Returns true if all gems match their corresponding socket's color
   */
  checkComplete: function() {
    var result = true;

    this.Gems.forEach(function(gem, index) {
      if (gem.Spark) {
        if (gem.Spark.color != gem.color && gem.color != 'combo') {
          result = false;
        }
      } else {
        result = false;
      }
    });

    return result;
  }
};

export default Shape;
